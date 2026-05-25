from typing import Any
from functools import lru_cache
import socket
import re

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _resolve_ollama_host(host: str) -> str:
    """
    If OLLAMA_HOST contains 'host.docker.internal' but that hostname is not
    reachable (i.e. the backend is running natively, not inside Docker),
    transparently replace it with 'localhost' so Ollama calls never 500.
    """
    if "host.docker.internal" not in host:
        return host
    try:
        ip = socket.gethostbyname("host.docker.internal")
        # Try a quick TCP connect to confirm Ollama is actually there
        port_match = re.search(r":(\d+)", host)
        port = int(port_match.group(1)) if port_match else 11434
        with socket.create_connection((ip, port), timeout=1):
            return host  # reachable – keep as-is
    except Exception:
        # Not reachable: swap host.docker.internal for localhost
        return re.sub(r"host\.docker\.internal", "localhost", host)


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
    auto_create_schema: bool = True

    smtp_enabled: bool = False
    smtp_host: str = "localhost"
    smtp_port: int = 587
    smtp_tls: bool = True
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@synetiq.ai"
    app_public_url: str = "http://localhost:8080"
    max_upload_bytes: int = 25 * 1024 * 1024

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        if self.environment not in ("development", "test") and self.secret_key in ("change-me-in-env", "change-me-in-production"):
            raise ValueError("SECRET_KEY must be set for non-development environments")
        # Dynamically resolve Ollama host in case host.docker.internal is unavailable
        self.ollama_host = _resolve_ollama_host(self.ollama_host)
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
