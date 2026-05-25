"""platform extensions: meeting_mode, transcripts, audit_logs

Revision ID: 0002_platform_extensions
Revises: 0001_initial_platform
Create Date: 2026-05-19
"""

from alembic import op
import sqlalchemy as sa

revision = "0002_platform_extensions"
down_revision = "0001_initial_platform"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE meetingmode AS ENUM ('ONLINE', 'OFFLINE')")
    op.execute("CREATE TYPE transcriptsource AS ENUM ('UPLOAD', 'LIVE', 'MANUAL')")
    op.add_column("meetings", sa.Column("meeting_mode", sa.Enum("ONLINE", "OFFLINE", name="meetingmode"), nullable=False, server_default="OFFLINE"))
    op.create_table(
        "meeting_transcripts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("meeting_id", sa.Integer(), sa.ForeignKey("meetings.id"), nullable=False),
        sa.Column("source", sa.Enum("UPLOAD", "LIVE", "MANUAL", name="transcriptsource"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("filename", sa.String(512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("actor_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("action", sa.String(128), nullable=False),
        sa.Column("resource_type", sa.String(64), nullable=False),
        sa.Column("resource_id", sa.Integer(), nullable=True),
        sa.Column("details", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_audit_resource", "audit_logs", ["resource_type", "resource_id"])


def downgrade() -> None:
    op.drop_index("ix_audit_resource", table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_table("meeting_transcripts")
    op.drop_column("meetings", "meeting_mode")
    op.execute("DROP TYPE IF EXISTS transcriptsource")
    op.execute("DROP TYPE IF EXISTS meetingmode")
