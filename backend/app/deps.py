from functools import lru_cache

from dobby_memory import PostgresMemoryStore
from dobby_tools import get_default_registry
from dobby_voice import VoiceConfig, get_stt, get_tts
from dobby_voice.stt import SpeechToText
from dobby_voice.tts import TextToSpeech

from app.config import get_settings
from app.core.agent import AgentService
from app.core.llm import LLMService


@lru_cache
def get_memory_store() -> PostgresMemoryStore:
    return PostgresMemoryStore(get_settings().database_url)


def get_tool_registry():
    return get_default_registry()


@lru_cache
def get_llm_service() -> LLMService:
    return LLMService(get_settings())


@lru_cache
def get_agent_service() -> AgentService:
    return AgentService(
        llm=get_llm_service(),
        memory=get_memory_store(),
        tools=get_tool_registry(),
        settings=get_settings(),
    )


def _voice_config() -> VoiceConfig:
    s = get_settings()
    return VoiceConfig(
        openai_api_key=s.openai_api_key,
        openai_base_url=s.openai_base_url,
        stt_model=s.voice_stt_model,
        tts_model=s.voice_tts_model,
        tts_voice=s.voice_tts_voice,
        tts_speed=s.voice_tts_speed,
    )


@lru_cache
def get_stt_service() -> SpeechToText:
    return get_stt(_voice_config())


@lru_cache
def get_tts_service() -> TextToSpeech:
    return get_tts(_voice_config())
