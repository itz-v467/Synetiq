from typing import Any
from functools import lru_cache
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Synetiq API"
    api_v1_prefix: str = "/api/v1"
    environment: str = "development"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 5000
    allowed_origins: Any = Field(default_factory=lambda: ["*"])

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        return v

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/synetiq"
    redis_url: str = "redis://localhost:6379/0"
    chroma_path: str = "./.chroma"
    secret_key: str = "change-me-in-env"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    whisper_model_name: str = "base"
    ollama_model: str = "llama3.2"
    ollama_host: str = "http://localhost:11434"
    embedding_model: str = "nomic-embed-text"
    anonymized_telemetry: bool = False
    celery_eager: bool = True


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
