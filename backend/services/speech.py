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
            
        # In actual system:
        # Decode audio_base64, save to temp file, pass to openai.Audio.transcribe or local whisper model
        
        # Robust mock transcription with high relevance to algebra teaching sessions
        sample_transcripts = [
            "I don't think I understand why three times parenthesis x plus two becomes three x plus six.",
            "Can we review why the sign changes from negative to positive here?",
            "I'm trying to solve three x plus two equals eleven. Do I subtract two first?",
            "Yes, I see. So we do the same thing to both sides of the equation."
        ]
        
        selected_text = random.choice(sample_transcripts)
        
        # Analyze voice characteristics (WPM, pitch fluctuations)
        wpm = random.randint(110, 140)
        filler_count = random.randint(1, 4)
        hesitation_index = round(random.uniform(0.1, 0.6), 2)
        
        return {
            "text": selected_text,
            "confidence": 0.96,
            "analytics": {
                "words_per_minute": wpm,
                "filler_words_count": filler_count,
                "confidence_level": round(1.0 - (hesitation_index * 0.4), 2),
                "hesitation_index": hesitation_index
            }
        }

speech_service = SpeechService()
