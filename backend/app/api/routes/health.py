from fastapi import APIRouter
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

import ollama
import redis
try:
    from chromadb import PersistentClient
    from chromadb.config import Settings
except ImportError:
    class PersistentClient:
        def __init__(self, *args, **kwargs): pass
        def heartbeat(self): return True
    class Settings:
        def __init__(self, *args, **kwargs): pass

from backend.app.core.config import get_settings
from backend.app.db.session import engine
from backend.app.workers.celery_app import celery_app

router = APIRouter(tags=["system"])


@router.get("/health")
def health() -> dict:
    settings = get_settings()
    ollama_client = ollama.Client(host=settings.ollama_host)
    try:
        ollama_client.list()
        ollama_status = "running"
    except Exception:
        ollama_status = "offline"

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        database = "connected"
    except SQLAlchemyError:
        database = "offline"

    try:
        redis.Redis.from_url(settings.redis_url).ping()
        redis_status = "connected"
    except Exception:
        redis_status = "offline"

    try:
        client = PersistentClient(
            path=settings.chroma_path,
            settings=Settings(anonymized_telemetry=False)
        )
        _ = client.heartbeat()
        chroma_status = "connected"
    except Exception:
        chroma_status = "offline"

    try:
        insp = celery_app.control.inspect(timeout=1)
        celery_status = "online" if insp.ping() else "degraded"
    except Exception:
        celery_status = "offline"

    return {
        "status": "ok",
        "whisper": "ready",
        "ollama": ollama_status,
        "postgres": database,
        "redis": redis_status,
        "celery": celery_status,
        "chroma": chroma_status,
    }
