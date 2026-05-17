from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Dobby"
    app_version: str = "0.1.0"
    debug: bool = False
    cors_origins: str = "http://localhost:3000"

    database_url: str = "postgresql+asyncpg://dobby:dobby@localhost:5432/dobby"

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_base_url: str | None = None

    max_tool_iterations: int = 5
    conversation_message_limit: int = 30

    voice_stt_model: str = "whisper-1"
    voice_tts_model: str = "tts-1"
    voice_tts_voice: str = "alloy"
    voice_tts_speed: float = 1.2
    voice_max_upload_bytes: int = 25 * 1024 * 1024

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
