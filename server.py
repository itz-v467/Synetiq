import os
import sys

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import uvicorn

from backend.app.core.config import get_settings
from backend.app.main import create_app

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

app = create_app()

if __name__ == "__main__":
    settings = get_settings()
    print("\n" + "=" * 58)
    print("  Synetiq API — FastAPI + Modular AI Pipeline")
    print("  Backward-compatible legacy AI routes enabled")
    print(f"  URL: http://localhost:{settings.port}/docs")
    print("=" * 58 + "\n")
    uvicorn.run("server:app", host=settings.host, port=settings.port, reload=False)
