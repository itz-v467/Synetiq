from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from backend.app.models.platform import (
    ActionItemStatus,
    AttendanceStatus,
    JoinPolicy,
    MeetingMode,
    MeetingStatus,
    MembershipRole,
    Recurrence,
    RSVPStatus,
)


class CommunityCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    description: str | None = None


class CommunityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    slug: str
    description: str | None
    created_at: datetime


class GroupCreate(BaseModel):
    community_id: int
    name: str
    description: str | None = None
    parent_group_id: int | None = None


class GroupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    community_id: int
    name: str
    description: str | None
    parent_group_id: int | None
    created_at: datetime


class AgendaItemInline(BaseModel):
    topic: str
    presenter: str | None = None
    duration_minutes: int = Field(default=15, gt=0)
    position: int = 0


class MeetingCreate(BaseModel):
    group_id: int
    title: str
    description: str | None = None
    meeting_date: date
    start_time: str
    end_time: str | None = None
    expected_duration_minutes: int = Field(default=60, gt=0)
    location: str
    meeting_link: str | None = None
    meeting_mode: MeetingMode = MeetingMode.OFFLINE
    join_policy: JoinPolicy = JoinPolicy.INVITE_ONLY
    recurrence: Recurrence = Recurrence.ONE_TIME
    agenda_items: list[AgendaItemInline] = []
    extra_attendee_emails: list[EmailStr] = []


class MeetingTransition(BaseModel):
    to_status: MeetingStatus


class MeetingUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    meeting_date: date | None = None
    start_time: str | None = None
    expected_duration_minutes: int | None = Field(None, gt=0)
    location: str | None = None
    meeting_link: str | None = None
    meeting_mode: MeetingMode | None = None
    join_policy: JoinPolicy | None = None
    recurrence: Recurrence | None = None


class MeetingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    group_id: int
    organizer_id: int
    title: str
    description: str | None
    meeting_date: date
    start_time: str
    end_time: str | None = None
    location: str
    meeting_link: str | None = None
    meeting_mode: MeetingMode = MeetingMode.OFFLINE
    expected_duration_minutes: int = 60
    status: MeetingStatus


class MOMGenerateRequest(BaseModel):
    transcript_or_notes: str = Field(min_length=1)
    meeting_info: str = ""


class IntelligenceGenerateRequest(BaseModel):
    source: str = Field(pattern="^(audio|notes|image|live)$")
    content: str | None = None
    meeting_info: str = ""


class AttendanceCreate(BaseModel):
    email: EmailStr
    status: AttendanceStatus


class AgendaItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    meeting_id: int
    topic: str
    presenter: str | None
    duration_minutes: int
    position: int


class InvitationCreate(BaseModel):
    meeting_id: int
    emails: list[EmailStr]


class MeetingInvitationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    meeting_id: int
    email: str
    rsvp_status: RSVPStatus


class RSVPUpdate(BaseModel):
    status: RSVPStatus

class AttendanceUpdate(BaseModel):
    user_id: int
    status: str


class AgendaItemCreate(BaseModel):
    meeting_id: int
    topic: str
    presenter: str | None = None
    duration_minutes: int = Field(gt=0)
    position: int = 0
    attachment_url: str | None = None


class ActionItemCreate(BaseModel):
    meeting_id: int
    title: str
    description: str | None = None
    assigned_to_id: int
    due_date: date


class ActionItemUpdateStatus(BaseModel):
    status: ActionItemStatus


class MembershipUpdate(BaseModel):
    role: MembershipRole

class CommunityMemberAdd(BaseModel):
    email: EmailStr
    role: MembershipRole = MembershipRole.PARTICIPANT

class GroupMemberAdd(BaseModel):
    email: EmailStr
    role: MembershipRole = MembershipRole.PARTICIPANT
