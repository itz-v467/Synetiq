import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException, Request

from backend.app.core.config import get_settings


class InMemoryRateLimiter:
  def __init__(self) -> None:
    self._buckets: dict[str, list[float]] = defaultdict(list)
    self._lock = Lock()

  def check(self, key: str, limit: int, window_seconds: int) -> None:
    now = time.time()
    with self._lock:
      hits = [t for t in self._buckets[key] if now - t < window_seconds]
      if len(hits) >= limit:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
      hits.append(now)
      self._buckets[key] = hits


limiter = InMemoryRateLimiter()


def rate_limit_key(request: Request, suffix: str = "") -> str:
  client = request.client.host if request.client else "unknown"
  auth = request.headers.get("authorization", "")
  return f"{client}:{auth[:32]}:{suffix}"


async def apply_rate_limit(request: Request, route_key: str, limit: int = 60, window: int = 60) -> None:
  settings = get_settings()
  if settings.environment == "development" and settings.debug:
    return
  limiter.check(rate_limit_key(request, route_key), limit, window)
