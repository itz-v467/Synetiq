from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ValueError)
    async def value_error_handler(_: Request, exc: ValueError):
        return JSONResponse(status_code=400, content={"detail": str(exc)})

    @app.exception_handler(Exception)
    async def generic_handler(request: Request, exc: Exception):
        from backend.app.core.config import get_settings

        settings = get_settings()
        detail = str(exc) if settings.debug else "Internal server error"
        correlation_id = request.headers.get("x-correlation-id", "")
        return JSONResponse(status_code=500, content={"detail": detail, "correlation_id": correlation_id})
