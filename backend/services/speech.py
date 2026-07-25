import random
from typing import Dict, Any

try:
    # Optional Whisper local model import
    import openai
    HAS_WHISPER = True
except ImportError:
    HAS_WHISPER = False

class SpeechService:
    def __init__(self):
        self.has_whisper = HAS_WHISPER

    def transcribe_audio(self, audio_base64: str) -> Dict[str, Any]:
        """
        Transcribes incoming base64 encoded audio bytes using Whisper.
        """
        if not audio_base64:
            return {"text": "", "confidence": 0.0}
            
        # Production path:
        #   audio_bytes = base64.b64decode(audio_base64.split(",")[-1])
        #   with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
        #       f.write(audio_bytes)
        #       tmp_path = f.name
        #   result = openai.audio.transcriptions.create(
        #       model="whisper-1", file=open(tmp_path, "rb")
        #   )
        #   return {"text": result.text, "confidence": 1.0, "analytics": {...}}

        # Whisper / real transcription not yet configured — return empty so the
        # session handler falls back to the student's typed chat input.
        return {
            "text": "",
            "confidence": 0.0,
            "analytics": {
                "words_per_minute": 0,
                "filler_words_count": 0,
                "confidence_level": 0.0,
                "hesitation_index": 0.0
            }
        }

    def synthesize_speech(self, text: str, voice_name: str = "Default", speed: float = 1.0) -> Dict[str, Any]:
        """
        Synthesizes AI Teacher response into voice audio data.
        In production, calls ElevenLabs, OpenAI Audio TTS, or Web Speech API directive.
        """
        return {
            "text": text,
            "voice": voice_name,
            "speed": speed,
            "audio_format": "mp3",
            "audio_base64": "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA..." # Valid sample audio marker
        }

speech_service = SpeechService()
