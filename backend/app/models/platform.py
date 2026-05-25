from enum import Enum

from sqlalchemy import Boolean, Date, DateTime, Enum as SqlEnum, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.db.base import Base, SoftDeleteMixin, TimestampMixin


class MembershipRole(str, Enum):
    ADMIN = "ADMIN"
    ORGANIZER = "ORGANIZER"
    PARTICIPANT = "PARTICIPANT"


class MeetingStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    LIVE = "LIVE"
    ENDED = "ENDED"
    ARCHIVED = "ARCHIVED"


class JoinPolicy(str, Enum):
    OPEN = "OPEN"
    INVITE_ONLY = "INVITE_ONLY"
    APPROVAL_REQUIRED = "APPROVAL_REQUIRED"


class Recurrence(str, Enum):
    ONE_TIME = "ONE_TIME"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"


class MeetingMode(str, Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"


class TranscriptSource(str, Enum):
    UPLOAD = "UPLOAD"
    LIVE = "LIVE"
    MANUAL = "MANUAL"


class RSVPStatus(str, Enum):
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    TENTATIVE = "TENTATIVE"
    PENDING = "PENDING"


class AttendanceStatus(str, Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    LATE = "LATE"


class ActionItemStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"
    DEFERRED = "DEFERRED"


class NotificationStatus(str, Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"


class Community(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "communities"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)


class CommunityMembership(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "community_memberships"
    __table_args__ = (UniqueConstraint("community_id", "user_id", name="uq_community_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    community_id: Mapped[int] = mapped_column(ForeignKey("communities.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    role: Mapped[MembershipRole] = mapped_column(SqlEnum(MembershipRole), nullable=False, default=MembershipRole.PARTICIPANT)


class Group(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "groups"
    __table_args__ = (UniqueConstraint("community_id", "name", name="uq_group_name_per_community"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    community_id: Mapped[int] = mapped_column(ForeignKey("communities.id"), nullable=False, index=True)
    parent_group_id: Mapped[int | None] = mapped_column(ForeignKey("groups.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)


class GroupMembership(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "group_memberships"
    __table_args__ = (UniqueConstraint("group_id", "user_id", name="uq_group_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    role: Mapped[MembershipRole] = mapped_column(SqlEnum(MembershipRole), nullable=False, default=MembershipRole.PARTICIPANT)


class Meeting(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "meetings"
    __table_args__ = (
        Index("ix_meeting_group_status_date", "group_id", "status", "meeting_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), nullable=False, index=True)
    organizer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    meeting_date: Mapped[Date] = mapped_column(Date, nullable=False)
    start_time: Mapped[str] = mapped_column(String(16), nullable=False)
    end_time: Mapped[str | None] = mapped_column(String(16), nullable=True)
    expected_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    location: Mapped[str] = mapped_column(String(512), nullable=False)
    meeting_link: Mapped[str | None] = mapped_column(String(512), nullable=True)
    meeting_mode: Mapped[MeetingMode] = mapped_column(SqlEnum(MeetingMode), nullable=False, default=MeetingMode.OFFLINE)
    join_policy: Mapped[JoinPolicy] = mapped_column(SqlEnum(JoinPolicy), nullable=False, default=JoinPolicy.INVITE_ONLY)
    recurrence: Mapped[Recurrence] = mapped_column(SqlEnum(Recurrence), nullable=False, default=Recurrence.ONE_TIME)
    status: Mapped[MeetingStatus] = mapped_column(SqlEnum(MeetingStatus), nullable=False, default=MeetingStatus.DRAFT)
    is_cancelled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class MeetingTranscript(TimestampMixin, Base):
    __tablename__ = "meeting_transcripts"

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"), nullable=False, index=True)
    source: Mapped[TranscriptSource] = mapped_column(SqlEnum(TranscriptSource), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    filename: Mapped[str | None] = mapped_column(String(512), nullable=True)


class MeetingStatusAudit(TimestampMixin, Base):
    __tablename__ = "meeting_status_audits"

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"), nullable=False, index=True)
    from_status: Mapped[MeetingStatus] = mapped_column(SqlEnum(MeetingStatus), nullable=False)
    to_status: Mapped[MeetingStatus] = mapped_column(SqlEnum(MeetingStatus), nullable=False)
    changed_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)


class MeetingInvitation(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "meeting_invitations"
    __table_args__ = (UniqueConstraint("meeting_id", "email", name="uq_invitation_meeting_email"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"), nullable=False, index=True)
    invited_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    token: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    token_expires_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    rsvp_status: Mapped[RSVPStatus] = mapped_column(SqlEnum(RSVPStatus), nullable=False, default=RSVPStatus.PENDING)


class AgendaItem(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "agenda_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"), nullable=False, index=True)
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    presenter: Mapped[str | None] = mapped_column(String(255), nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    attachment_url: Mapped[str | None] = mapped_column(String(512), nullable=True)


class AttendanceRecord(TimestampMixin, Base):
    __tablename__ = "attendance_records"
    __table_args__ = (UniqueConstraint("meeting_id", "user_id", name="uq_attendance_meeting_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    status: Mapped[AttendanceStatus] = mapped_column(SqlEnum(AttendanceStatus), nullable=False)
    marked_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)


class MeetingDecision(TimestampMixin, Base):
    __tablename__ = "meeting_decisions"

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"), nullable=False, index=True)
    decision_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)


class MOMRecord(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "mom_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"), nullable=False, index=True)
    generated_text: Mapped[str] = mapped_column(Text, nullable=False)
    generated_html: Mapped[str] = mapped_column(Text, nullable=False, default="")
    quality_report: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    published_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)


class ActionItem(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "action_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"), nullable=False, index=True)
    mom_id: Mapped[int | None] = mapped_column(ForeignKey("mom_records.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_to_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    due_date: Mapped[Date] = mapped_column(Date, nullable=False)
    status: Mapped[ActionItemStatus] = mapped_column(SqlEnum(ActionItemStatus), nullable=False, default=ActionItemStatus.OPEN)


class ActionItemAudit(TimestampMixin, Base):
    __tablename__ = "action_item_audits"

    id: Mapped[int] = mapped_column(primary_key=True)
    action_item_id: Mapped[int] = mapped_column(ForeignKey("action_items.id"), nullable=False, index=True)
    from_status: Mapped[ActionItemStatus] = mapped_column(SqlEnum(ActionItemStatus), nullable=False)
    to_status: Mapped[ActionItemStatus] = mapped_column(SqlEnum(ActionItemStatus), nullable=False)
    changed_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)


class Notification(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    body_html: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[NotificationStatus] = mapped_column(SqlEnum(NotificationStatus), nullable=False, default=NotificationStatus.PENDING)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)


class SemanticEmbedding(TimestampMixin, Base):
    __tablename__ = "semantic_embeddings"

    id: Mapped[int] = mapped_column(primary_key=True)
    mom_id: Mapped[int] = mapped_column(ForeignKey("mom_records.id"), nullable=False, unique=True, index=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"), nullable=False, index=True)
    community_id: Mapped[int] = mapped_column(ForeignKey("communities.id"), nullable=False, index=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), nullable=False, index=True)
    chroma_document_id: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)


class AuditLog(TimestampMixin, Base):
    __tablename__ = "audit_logs"
    __table_args__ = (Index("ix_audit_resource", "resource_type", "resource_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    resource_type: Mapped[str] = mapped_column(String(64), nullable=False)
    resource_id: Mapped[int | None] = mapped_column(nullable=True)
    details: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)


class AnalyticsSnapshot(TimestampMixin, Base):
    __tablename__ = "analytics_snapshots"
    __table_args__ = (Index("ix_analytics_scope_date", "scope", "snapshot_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    scope: Mapped[str] = mapped_column(String(32), nullable=False)
    scope_id: Mapped[int | None] = mapped_column(nullable=True)
    snapshot_date: Mapped[Date] = mapped_column(Date, nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
