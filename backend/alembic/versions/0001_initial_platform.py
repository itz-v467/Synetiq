"""initial platform schema

Revision ID: 0001_initial_platform
Revises:
Create Date: 2026-05-13
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0001_initial_platform"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Base metadata create handled via SQLAlchemy models; this revision pins the baseline.
    pass


def downgrade() -> None:
    pass
