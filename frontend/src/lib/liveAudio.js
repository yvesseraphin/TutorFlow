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
    this.endTimeout = null;
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

      if (this.endTimeout) {
        clearTimeout(this.endTimeout);
        this.endTimeout = null;
      }

      const currentTime = this.audioCtx.currentTime;
      // Seamless contiguous scheduling without artificial gap penalties
      const startTime = Math.max(currentTime, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;

      this.activeNodes.push({ source, endTime: this.nextStartTime });
      this._setPlaying(true);

      source.onended = () => {
        this.activeNodes = this.activeNodes.filter((n) => n.source !== source);
        if (this.activeNodes.length === 0) {
          if (this.endTimeout) clearTimeout(this.endTimeout);
          this.endTimeout = setTimeout(() => {
            if (this.activeNodes.length === 0) {
              this._setPlaying(false);
            }
          }, 100);
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
      if (this.endTimeout) {
        clearTimeout(this.endTimeout);
        this.endTimeout = null;
      }
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
// Inline AudioWorklet processor code for low latency audio capture
const audioWorkletCode = `
class RecorderWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0];
      for (let i = 0; i < channelData.length; i++) {
        this.buffer[this.bufferIndex++] = channelData[i];
        if (this.bufferIndex >= this.bufferSize) {
          this.port.postMessage(this.buffer);
          this.buffer = new Float32Array(this.bufferSize);
          this.bufferIndex = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor('recorder-worklet', RecorderWorkletProcessor);
`;

export class AudioStreamRecorder {
  constructor({ onChunk = () => {}, onLevel = () => {} } = {}) {
    this.onChunk = onChunk;
    this.onLevel = onLevel;
    this.stream = null;
    this.audioCtx = null;
    this.workletNode = null;
    this.source = null;
    this.isRecording = false;
    this.workletInitialized = false;
  }

  async _initWorklet(audioCtx) {
    if (this.workletInitialized) return;
    const blob = new Blob([audioWorkletCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    await audioCtx.audioWorklet.addModule(url);
    this.workletInitialized = true;
    URL.revokeObjectURL(url);
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

      await this._initWorklet(this.audioCtx);

      const inputSampleRate = this.audioCtx.sampleRate;
      const targetSampleRate = 16000;

      this.source = this.audioCtx.createMediaStreamSource(this.stream);
      this.workletNode = new AudioWorkletNode(this.audioCtx, 'recorder-worklet');

      this.workletNode.port.onmessage = (e) => {
        if (!this.isRecording) return;
        const inputData = e.data;

        // Calculate RMS volume level for UI visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        this.onLevel(Math.min(1, rms * 5));

        // Resample smoothly from browser inputSampleRate to 16000Hz via linear interpolation
        let resampledData = inputData;
        if (inputSampleRate !== targetSampleRate) {
          const ratio = inputSampleRate / targetSampleRate;
          const newLength = Math.round(inputData.length / ratio);
          resampledData = new Float32Array(newLength);
          for (let i = 0; i < newLength; i++) {
            const pos = i * ratio;
            const index = Math.floor(pos);
            const frac = pos - index;
            const s1 = inputData[index] || 0;
            const s2 = inputData[index + 1] !== undefined ? inputData[index + 1] : s1;
            resampledData[i] = s1 + (s2 - s1) * frac;
          }
        }

        const base64PCM = float32ToInt16Base64(resampledData);
        if (base64PCM) {
          this.onChunk(base64PCM);
        }
      };

      this.muteGain = this.audioCtx.createGain();
      this.muteGain.gain.value = 0.0;
      this.source.connect(this.workletNode);
      this.workletNode.connect(this.muteGain);
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
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
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

/**
 * Continuous Real-Time Speech Recognition Engine
 * Converts spoken words to text instantly, streaming interim subtitles
 * and sending finalized student turns directly to the AI tutor.
 */
export class SpeechTranscriber {
  constructor({ onInterim = () => {}, onFinal = () => {}, onLevel = () => {}, onStateChange = () => {}, onSpeechStart = () => {} } = {}) {
    this.onInterim = onInterim;
    this.onFinal = onFinal;
    this.onLevel = onLevel;
    this.onStateChange = onStateChange;
    this.onSpeechStart = onSpeechStart;
    this.recognition = null;
    this.isListening = false;
    this.audioRecorder = new AudioStreamRecorder({
      onLevel: (lvl) => {
        this.onLevel(lvl);
        if (lvl > 0.35 && this.onSpeechStart) {
          this.onSpeechStart();
        }
      },
    });
    this._debounceTimer = null;
    this._initRecognition();
  }

  _initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition API is not supported in this browser.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        const text = item[0].transcript;
        if (item.isFinal) {
          const trimmed = text.trim();
          // Filter out background noise artifacts (single consonants, stray clicks, non-alphanumeric noise)
          if (trimmed.length >= 2 && /[a-zA-Z0-9]/.test(trimmed)) {
            console.log(`[SPEECH RECOGNITION] Validated Speech: "${trimmed}"`);
            clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => {
              this.onFinal(trimmed);
              this.onInterim("");
            }, 300);
          }
        } else {
          interim += text;
        }
      }
      if (interim && interim.trim().length >= 2) {
        if (this.onSpeechStart) {
          this.onSpeechStart();
        }
        this.onInterim(interim.trim());
      }
    };

    rec.onerror = (event) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("[SPEECH RECOGNITION] Error:", event.error);
      }
    };

    rec.onend = () => {
      if (this.isListening) {
        try {
          rec.start();
        } catch (e) {}
      }
    };

    this.recognition = rec;
  }

  async start() {
    if (this.isListening) return;
    this.isListening = true;
    this.onStateChange(true);

    try {
      await this.audioRecorder.start();
    } catch (e) {
      console.warn("Volume analyzer start error:", e);
    }

    if (this.recognition) {
      try {
        this.recognition.start();
        console.log("[SPEECH RECOGNITION] Voice recognition started.");
      } catch (err) {
        console.warn("[SPEECH RECOGNITION] Start failed:", err);
      }
    }
  }

  stop() {
    this.isListening = false;
    this.onStateChange(false);
    this.onInterim("");
    this.audioRecorder.stop();
    if (this.recognition) {
      try {
        this.recognition.stop();
        console.log("[SPEECH RECOGNITION] Voice recognition stopped.");
      } catch (err) {}
    }
  }
}


