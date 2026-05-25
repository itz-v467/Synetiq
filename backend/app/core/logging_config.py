import json
import logging
import sys
from datetime import datetime, timezone


class JsonFormatter(logging.Formatter):
  def format(self, record: logging.LogRecord) -> str:
    payload = {
      "ts": datetime.now(timezone.utc).isoformat(),
      "level": record.levelname,
      "logger": record.name,
      "message": record.getMessage(),
    }
    if hasattr(record, "correlation_id"):
      payload["correlation_id"] = record.correlation_id
    if record.exc_info:
      payload["exception"] = self.formatException(record.exc_info)
    return json.dumps(payload)


def configure_logging(debug: bool = False) -> None:
  root = logging.getLogger()
  root.handlers.clear()
  handler = logging.StreamHandler(sys.stdout)
  handler.setFormatter(JsonFormatter())
  root.addHandler(handler)
  root.setLevel(logging.DEBUG if debug else logging.INFO)
