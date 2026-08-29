/**
 * TutorFlow Real-Time Audio Engine
 * Handles low-latency 16kHz PCM microphone capture (Input)
 * and seamless queued 24kHz PCM audio playback with instant barge-in / interruption (Output).
 */

// Global AudioContext cache to bypass browser autoplay restrictions seamlessly
let sharedAudioCtx = null;

export function getOrCreateAudioContext() {
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    sharedAudioCtx = new AudioContextClass();
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export async function unlockAudioContext() {
  const ctx = getOrCreateAudioContext();
  if (ctx && ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch (e) {}
  }
  return ctx;
}

// Helper to convert base64 string to Uint8Array / ArrayBuffer
export function base64ToUint8Array(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to convert Int16 PCM ArrayBuffer (24kHz mono) to AudioBuffer (Float32)
export function pcm16ToAudioBuffer(pcmBytes, audioCtx, sampleRate = 24000) {
  const int16Array = new Int16Array(pcmBytes.buffer, pcmBytes.byteOffset, pcmBytes.byteLength / 2);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }

  const audioBuffer = audioCtx.createBuffer(1, float32Array.length, sampleRate);
  audioBuffer.getChannelData(0).set(float32Array);
  return audioBuffer;
}

// Convert Float32Array to Int16 PCM base64 string
export function float32ToInt16Base64(float32Array) {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = "";
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return window.btoa(binary);
}

/**
 * AudioStreamPlayer
 * Manages low-latency scheduled playback of raw 24kHz PCM chunks from Gemini Live.
 * Supports instant interruption (barge-in) and audio level events.
 */
export class AudioStreamPlayer {
  constructor({ onPlayStateChange = () => {}, onLevel = () => {} } = {}) {
    this.audioCtx = null;
    this.nextStartTime = 0;
    this.activeNodes = [];
    this.isPlaying = false;
    this.onPlayStateChange = onPlayStateChange;
    this.onLevel = onLevel;
  }

  _initContext() {
    if (!this.audioCtx) {
      this.audioCtx = getOrCreateAudioContext();
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
  }

  playChunk(base64Pcm, sampleRate = 24000) {
    try {
      this._initContext();
      const pcmBytes = base64ToUint8Array(base64Pcm);
      if (pcmBytes.byteLength < 2) return;

      const audioBuffer = pcm16ToAudioBuffer(pcmBytes, this.audioCtx, sampleRate);
      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = this.audioCtx.createGain();
      gainNode.gain.value = 1.0;
      source.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      const currentTime = this.audioCtx.currentTime;
      const startTime = Math.max(currentTime + 0.005, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;

      this.activeNodes.push({ source, endTime: this.nextStartTime });
      this._setPlaying(true);

      source.onended = () => {
        this.activeNodes = this.activeNodes.filter((n) => n.source !== source);
        if (this.activeNodes.length === 0 || this.audioCtx.currentTime >= this.nextStartTime - 0.05) {
          this._setPlaying(false);
        }
      };
    } catch (err) {
      console.warn("Error playing audio chunk:", err);
    }
  }

  _setPlaying(playing) {
    if (this.isPlaying !== playing) {
      this.isPlaying = playing;
      this.onPlayStateChange(playing);
    }
  }

  /**
   * Instant interruption / Barge-in: cancels all queued & playing audio nodes immediately!
   */
  interrupt() {
    try {
      this.activeNodes.forEach(({ source }) => {
        try {
          source.stop();
          source.disconnect();
        } catch (e) {}
      });
      this.activeNodes = [];
      if (this.audioCtx) {
        this.nextStartTime = this.audioCtx.currentTime;
      }
      this._setPlaying(false);
    } catch (err) {
      console.warn("Error interrupting audio player:", err);
    }
  }

  destroy() {
    this.interrupt();
  }
}

/**
 * AudioStreamRecorder
 * Captures microphone stream, resamples to 16kHz Int16 PCM, and streams chunks to onChunk callback.
 */
export class AudioStreamRecorder {
  constructor({ onChunk = () => {}, onLevel = () => {} } = {}) {
    this.onChunk = onChunk;
    this.onLevel = onLevel;
    this.stream = null;
    this.audioCtx = null;
    this.processor = null;
    this.source = null;
    this.isRecording = false;
  }

  async start() {
    if (this.isRecording) return;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });

      this.audioCtx = getOrCreateAudioContext();
      if (this.audioCtx.state === "suspended") {
        await this.audioCtx.resume().catch(() => {});
      }

      const inputSampleRate = this.audioCtx.sampleRate;
      const targetSampleRate = 16000;

      this.source = this.audioCtx.createMediaStreamSource(this.stream);
      this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate RMS volume level for UI visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        this.onLevel(Math.min(1, rms * 5));

        // Resample from browser inputSampleRate to 16000Hz
        let resampledData = inputData;
        if (inputSampleRate !== targetSampleRate) {
          const ratio = inputSampleRate / targetSampleRate;
          const newLength = Math.round(inputData.length / ratio);
          resampledData = new Float32Array(newLength);
          for (let i = 0; i < newLength; i++) {
            const originIndex = Math.floor(i * ratio);
            resampledData[i] = inputData[originIndex] || 0;
          }
        }

        const base64PCM = float32ToInt16Base64(resampledData);
        if (base64PCM) {
          this.onChunk(base64PCM);
        }
      };

      this.muteGain = this.audioCtx.createGain();
      this.muteGain.gain.value = 0.0;
      this.source.connect(this.processor);
      this.processor.connect(this.muteGain);
      this.muteGain.connect(this.audioCtx.destination);
      this.isRecording = true;
    } catch (err) {
      console.error("Failed to start audio recorder:", err);
      this.stop();
      throw err;
    }
  }

  stop() {
    this.isRecording = false;
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.onLevel(0);
  }
}
