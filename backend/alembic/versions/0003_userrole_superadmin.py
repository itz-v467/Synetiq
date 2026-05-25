"""add SUPERADMIN to userrole enum

Revision ID: 0003_userrole_superadmin
Revises: 0002_platform_extensions
Create Date: 2026-05-19
"""

from alembic import op

revision = "0003_userrole_superadmin"
down_revision = "0002_platform_extensions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'SUPERADMIN'")


def downgrade() -> None:
    # PostgreSQL cannot remove enum values safely; no-op.
    pass
