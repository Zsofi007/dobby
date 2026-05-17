from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.config import Settings, get_settings
from app.deps import get_stt_service, get_tts_service
from dobby_voice.stt import SpeechToText
from dobby_voice.tts import TextToSpeech

router = APIRouter()

ALLOWED_AUDIO_TYPES = {
    "audio/webm",
    "audio/wav",
    "audio/mpeg",
    "audio/mp4",
    "audio/ogg",
    "audio/x-wav",
    "video/webm",
}


class TranscribeResponse(BaseModel):
    text: str


class SynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4096)


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(
    audio: UploadFile = File(...),
    stt: SpeechToText = Depends(get_stt_service),
    settings: Settings = Depends(get_settings),
) -> TranscribeResponse:
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=503,
            detail="Voice transcription requires OPENAI_API_KEY to be set.",
        )

    content_type = (audio.content_type or "audio/webm").split(";")[0].strip()
    if content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio type: {content_type}",
        )

    data = await audio.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty audio file")
    if len(data) > settings.voice_max_upload_bytes:
        raise HTTPException(status_code=400, detail="Audio file too large")

    mime = "audio/webm" if content_type == "video/webm" else content_type
    text = await stt.transcribe(data, mime_type=mime)
    return TranscribeResponse(text=text)


@router.post("/synthesize")
async def synthesize(
    body: SynthesizeRequest,
    tts: TextToSpeech = Depends(get_tts_service),
    settings: Settings = Depends(get_settings),
) -> Response:
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=503,
            detail="Voice synthesis requires OPENAI_API_KEY to be set.",
        )

    audio_bytes = await tts.synthesize(body.text)
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="No audio generated")

    return Response(content=audio_bytes, media_type="audio/mpeg")
