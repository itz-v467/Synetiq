from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from backend.app.models.platform import (
    ActionItemStatus,
    JoinPolicy,
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


class MeetingCreate(BaseModel):
    group_id: int
    title: str
    description: str | None = None
    meeting_date: date
    start_time: str
    expected_duration_minutes: int = Field(gt=0)
    location: str
    join_policy: JoinPolicy = JoinPolicy.INVITE_ONLY
    recurrence: Recurrence = Recurrence.ONE_TIME


class MeetingTransition(BaseModel):
    to_status: MeetingStatus


class MeetingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    group_id: int
    organizer_id: int
    title: str
    description: str | None
    meeting_date: date
    status: MeetingStatus


class InvitationCreate(BaseModel):
    meeting_id: int
    emails: list[EmailStr]


class RSVPUpdate(BaseModel):
    status: RSVPStatus


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
