"""Runtime PostgreSQL enum patches (safe when using create_all without Alembic)."""

import logging

from sqlalchemy import text

from backend.app.db.session import engine

logger = logging.getLogger(__name__)


def ensure_userrole_superadmin() -> None:
    if engine.dialect.name != "postgresql":
        return
    try:
        with engine.begin() as conn:
            exists = conn.execute(
                text(
                    """
                    SELECT 1 FROM pg_enum e
                    JOIN pg_type t ON e.enumtypid = t.oid
                    WHERE t.typname = 'userrole' AND e.enumlabel = 'SUPERADMIN'
                    """
                )
            ).first()
            if not exists:
                conn.execute(text("ALTER TYPE userrole ADD VALUE 'SUPERADMIN'"))
                logger.info("userrole_enum_added_superadmin")
    except Exception as exc:
        logger.warning("userrole_enum_superadmin_skipped", exc_info=exc)
