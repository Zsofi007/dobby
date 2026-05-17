from abc import ABC, abstractmethod
from enum import Enum


class TTSProvider(str, Enum):
    OPENAI = "openai"
    ELEVENLABS = "elevenlabs"


class TextToSpeech(ABC):
    """Abstract TTS — implement with OpenAI, ElevenLabs, etc."""

    @abstractmethod
    async def synthesize(self, text: str, *, voice: str | None = None) -> bytes:
        """Return audio bytes (e.g. MP3)."""


class StubTTS(TextToSpeech):
    """Stub TTS for MVP."""

    async def synthesize(self, text: str, *, voice: str | None = None) -> bytes:
        return b""
