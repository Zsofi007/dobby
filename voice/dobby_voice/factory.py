from dataclasses import dataclass

from dobby_voice.openai_stt import OpenAIWhisperSTT
from dobby_voice.openai_tts import OpenAITTS
from dobby_voice.stt import SpeechToText, StubWhisperSTT
from dobby_voice.tts import StubTTS, TextToSpeech


@dataclass(frozen=True)
class VoiceConfig:
    openai_api_key: str = ""
    openai_base_url: str | None = None
    stt_model: str = "whisper-1"
    tts_model: str = "tts-1"
    tts_voice: str = "alloy"
    tts_speed: float = 1.2


def get_stt(config: VoiceConfig) -> SpeechToText:
    if config.openai_api_key:
        return OpenAIWhisperSTT(
            config.openai_api_key,
            model=config.stt_model,
            base_url=config.openai_base_url,
        )
    return StubWhisperSTT()


def get_tts(config: VoiceConfig) -> TextToSpeech:
    if config.openai_api_key:
        return OpenAITTS(
            config.openai_api_key,
            model=config.tts_model,
            default_voice=config.tts_voice,
            speed=config.tts_speed,
            base_url=config.openai_base_url,
        )
    return StubTTS()
