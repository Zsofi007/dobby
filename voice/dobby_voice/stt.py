from abc import ABC, abstractmethod


class SpeechToText(ABC):
    """Abstract STT — implement with Whisper or other providers."""

    @abstractmethod
    async def transcribe(self, audio_bytes: bytes, *, mime_type: str = "audio/webm") -> str:
        """Transcribe audio to text."""


class StubWhisperSTT(SpeechToText):
    """Stub STT for MVP — returns placeholder text."""

    async def transcribe(self, audio_bytes: bytes, *, mime_type: str = "audio/webm") -> str:
        if not audio_bytes:
            return ""
        return "[STT stub] Voice input received (Whisper integration pending)."
