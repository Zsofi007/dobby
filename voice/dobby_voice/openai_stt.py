import io
from typing import Any

from openai import AsyncOpenAI

from dobby_voice.stt import SpeechToText

_MIME_EXT = {
    "audio/webm": ("audio.webm", "webm"),
    "audio/wav": ("audio.wav", "wav"),
    "audio/mpeg": ("audio.mp3", "mp3"),
    "audio/mp4": ("audio.mp4", "mp4"),
    "audio/ogg": ("audio.ogg", "ogg"),
}


class OpenAIWhisperSTT(SpeechToText):
    """OpenAI Whisper API transcription."""

    def __init__(
        self,
        api_key: str,
        *,
        model: str = "whisper-1",
        base_url: str | None = None,
    ) -> None:
        kwargs: dict[str, Any] = {"api_key": api_key}
        if base_url:
            kwargs["base_url"] = base_url
        self._client = AsyncOpenAI(**kwargs)
        self._model = model

    async def transcribe(self, audio_bytes: bytes, *, mime_type: str = "audio/webm") -> str:
        if not audio_bytes:
            return ""

        filename, _ = _MIME_EXT.get(mime_type, ("audio.webm", "webm"))
        file_obj = io.BytesIO(audio_bytes)
        file_obj.name = filename

        result = await self._client.audio.transcriptions.create(
            model=self._model,
            file=file_obj,
        )
        return (result.text or "").strip()
