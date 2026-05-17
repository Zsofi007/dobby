from typing import Any

from openai import AsyncOpenAI

from dobby_voice.tts import TextToSpeech

# OpenAI TTS input limit
MAX_TTS_CHARS = 4096


class OpenAITTS(TextToSpeech):
    """OpenAI speech synthesis API."""

    def __init__(
        self,
        api_key: str,
        *,
        model: str = "tts-1",
        default_voice: str = "alloy",
        speed: float = 1.0,
        base_url: str | None = None,
    ) -> None:
        kwargs: dict[str, Any] = {"api_key": api_key}
        if base_url:
            kwargs["base_url"] = base_url
        self._client = AsyncOpenAI(**kwargs)
        self._model = model
        self._default_voice = default_voice
        self._speed = max(0.25, min(4.0, speed))

    async def synthesize(self, text: str, *, voice: str | None = None) -> bytes:
        trimmed = text.strip()[:MAX_TTS_CHARS]
        if not trimmed:
            return b""

        response = await self._client.audio.speech.create(
            model=self._model,
            voice=voice or self._default_voice,
            input=trimmed,
            speed=self._speed,
            response_format="mp3",
        )
        return response.content
