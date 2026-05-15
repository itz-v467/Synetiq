from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.api.router import api_router
from backend.app.core.config import get_settings
from backend.app.core.exceptions import register_exception_handlers
from backend.app.core.middleware import CorrelationIdMiddleware
from backend.app.db.base import Base
from backend.app.db.session import engine
from backend.app import models  # noqa: F401
from backend.app.websocket.routes import router as websocket_router


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, debug=settings.debug)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(CorrelationIdMiddleware)
    register_exception_handlers(app)

    project_root = Path(__file__).resolve().parents[2]
    static_path = project_root / "static"
    static_path.mkdir(parents=True, exist_ok=True)
    html_path = project_root / "mom_generator.html"
    if html_path.exists():
        (static_path / "mom_generator.html").write_text(html_path.read_text(encoding="utf-8"), encoding="utf-8")

    app.include_router(api_router)
    app.include_router(websocket_router)
    app.mount("/static", StaticFiles(directory=static_path), name="static")

    @app.get("/legacy/mom")
    def legacy_mom():
        """Legacy multilingual MOM UI; main app is served by Next.js behind nginx at /."""
        return FileResponse(static_path / "mom_generator.html")

    @app.on_event("startup")
    def on_startup() -> None:
        Base.metadata.create_all(bind=engine)
        from sqlalchemy.orm import Session
        from backend.app.db.session import SessionLocal
        from backend.app.models.user import User, UserRole
        from backend.app.core.security import hash_password
        from sqlalchemy import select

        with SessionLocal() as db:
            admin_email = "admin@synetiq.ai"
            existing = db.scalar(select(User).where(User.email == admin_email))
            if not existing:
                admin = User(
                    full_name="Synetiq Admin",
                    email=admin_email,
                    password_hash=hash_password("admin123"),
                    role=UserRole.ADMIN,
                    is_active=True
                )
                db.add(admin)
                db.commit()
                print(f"Created default admin: {admin_email}")

    return app
