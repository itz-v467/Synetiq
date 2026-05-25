from pathlib import Path

# Monkeypatch chromadb telemetry to suppress PostHog exception output
try:
    import chromadb.telemetry.posthog
    class MockPosthog:
        def __init__(self, *args, **kwargs): pass
        def capture(self, *args, **kwargs): pass
    chromadb.telemetry.posthog.Posthog = MockPosthog
except Exception:
    pass

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.api.router import api_router
from backend.app.core.config import get_settings
from backend.app.core.exceptions import register_exception_handlers
from backend.app.core.logging_config import configure_logging
from backend.app.core.middleware import CorrelationIdMiddleware
from backend.app.db.base import Base
from backend.app.db.session import engine
from backend.app import models  # noqa: F401
from backend.app.websocket.routes import router as websocket_router


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.debug)
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
        return FileResponse(static_path / "mom_generator.html")

    @app.on_event("startup")
    def on_startup() -> None:
        if settings.auto_create_schema:
            Base.metadata.create_all(bind=engine)
        from backend.app.db.enum_migrations import ensure_userrole_superadmin

        ensure_userrole_superadmin()
        from sqlalchemy import select
        from sqlalchemy.orm import Session

        from backend.app.core.security import hash_password
        from backend.app.db.session import SessionLocal
        from backend.app.models.user import User, UserRole

        with SessionLocal() as db:
            admin_email = "admin@synetiq.ai"
            existing = db.scalar(select(User).where(User.email == admin_email))
            if not existing:
                admin = User(
                    full_name="Synetiq Admin",
                    email=admin_email,
                    password_hash=hash_password("admin123"),
                    role=UserRole.SUPERADMIN,
                    is_active=True,
                )
                db.add(admin)
                db.commit()
            else:
                seeded = db.scalar(select(User).where(User.email == admin_email))
                if seeded and seeded.role == UserRole.ADMIN:
                    seeded.role = UserRole.SUPERADMIN
                    db.commit()

            from backend.app.models.platform import Community, Group
            from backend.app.services.communities_service import CommunitiesService
            from backend.app.services.groups_service import GroupsService

            try:
                admin = db.scalar(select(User).where(User.email == admin_email))
                if admin and not db.scalar(select(Community).where(Community.deleted_at.is_(None))):
                    comm = CommunitiesService().create_community(
                        db, name="Default Community", description="Auto-created starter community", creator=admin
                    )
                    GroupsService().create_group(
                        db,
                        community_id=comm.id,
                        name="General",
                        description="Default group for meetings",
                        parent_group_id=None,
                        creator=admin,
                    )
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning("startup_seed_skipped", exc_info=exc)

    return app
