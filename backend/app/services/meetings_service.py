from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.security import create_token
from backend.app.models.platform import Meeting, MeetingInvitation, MeetingStatus, MeetingStatusAudit, RSVPStatus
from backend.app.domain.rbac.platform_roles import is_platform_super
from backend.app.models.user import User

_ALLOWED_TRANSITIONS: dict[MeetingStatus, set[MeetingStatus]] = {
    MeetingStatus.DRAFT: {MeetingStatus.PUBLISHED},
    MeetingStatus.PUBLISHED: {MeetingStatus.LIVE},
    MeetingStatus.LIVE: {MeetingStatus.ENDED, MeetingStatus.PUBLISHED},
    MeetingStatus.ENDED: {MeetingStatus.ARCHIVED},
    MeetingStatus.ARCHIVED: set(),
}


class MeetingsService:
    def create_meeting(self, db: Session, payload: dict, organizer: User) -> Meeting:
        from backend.app.models.platform import AgendaItem, GroupMembership, MembershipRole
        
        group_id = payload.get("group_id")
        if not group_id:
            raise ValueError("Group ID is required")
        
        agenda_items_data = payload.pop("agenda_items", [])
        extra_attendee_emails = payload.pop("extra_attendee_emails", [])
            
        if not is_platform_super(organizer):
            membership = db.scalar(
                select(GroupMembership).where(
                    GroupMembership.group_id == group_id,
                    GroupMembership.user_id == organizer.id,
                    GroupMembership.role == MembershipRole.ORGANIZER
                )
            )
            if not membership:
                raise ValueError("Only Group Organizers or Admins can create meetings")

        from backend.app.models.platform import MeetingMode

        mode = payload.get("meeting_mode", MeetingMode.OFFLINE)
        link = payload.get("meeting_link")
        if mode == MeetingMode.ONLINE and not link:
            raise ValueError("meeting_link is required for online meetings")
        if mode == MeetingMode.OFFLINE:
            payload["meeting_link"] = None

        meeting = Meeting(organizer_id=organizer.id, **payload)
        db.add(meeting)
        db.flush()

        # Create inline agenda items
        for idx, item in enumerate(agenda_items_data):
            agenda_item = AgendaItem(
                meeting_id=meeting.id,
                topic=item.get("topic", ""),
                presenter=item.get("presenter"),
                duration_minutes=item.get("duration_minutes", 15),
                position=item.get("position", idx),
            )
            db.add(agenda_item)

        db.commit()
        db.refresh(meeting)

        # Collect all group member emails
        from backend.app.models.user import User as UserModel
        group_members = db.execute(
            select(GroupMembership, UserModel)
            .join(UserModel, UserModel.id == GroupMembership.user_id)
            .where(GroupMembership.group_id == group_id)
        ).all()
        member_emails = [user.email for _, user in group_members]

        # Merge with extra attendee emails, de-duplicate
        all_emails = list(set(member_emails + extra_attendee_emails))
        if all_emails:
            self.invite(db, meeting.id, all_emails)

        return meeting


    def list_meetings(self, db: Session, user: User) -> list[Meeting]:
        # Admins see everything
        if is_platform_super(user):
            return db.scalars(select(Meeting).order_by(Meeting.meeting_date.desc())).all()
            
        # Users see meetings for groups they are members of
        from backend.app.models.platform import GroupMembership
        
        stmt = (
            select(Meeting)
            .join(GroupMembership, GroupMembership.group_id == Meeting.group_id)
            .where(GroupMembership.user_id == user.id)
            .order_by(Meeting.meeting_date.desc())
            .distinct()
        )
        return db.scalars(stmt).all()

    def transition_status(self, db: Session, meeting: Meeting, to_status: MeetingStatus, actor: User) -> Meeting:
        from_status = meeting.status
        allowed = _ALLOWED_TRANSITIONS[from_status]
        if to_status not in allowed:
            raise ValueError(f"Invalid transition {from_status} -> {to_status}")
        if from_status == MeetingStatus.LIVE and to_status == MeetingStatus.PUBLISHED and not is_platform_super(actor):
            raise ValueError("Only platform admin can revert LIVE to PUBLISHED")
        meeting.status = to_status
        db.add(MeetingStatusAudit(meeting_id=meeting.id, from_status=from_status, to_status=to_status, changed_by_id=actor.id))
        db.commit()
        db.refresh(meeting)
        return meeting

    def invite(self, db: Session, meeting_id: int, emails: list[str]) -> list[MeetingInvitation]:
        invitations: list[MeetingInvitation] = []
        meeting = db.get(Meeting, meeting_id)
        if not meeting:
            raise ValueError("Meeting not found")
        if meeting.status == MeetingStatus.DRAFT:
            meeting.status = MeetingStatus.PUBLISHED
        expiry = datetime.now(timezone.utc) + timedelta(days=7)
        for email in emails:
            token = create_token(subject=f"{meeting_id}:{email}", expires_delta=timedelta(days=7), token_type="rsvp")
            inv = db.scalar(select(MeetingInvitation).where(MeetingInvitation.meeting_id == meeting_id, MeetingInvitation.email == email))
            if inv:
                inv.token = token
                inv.token_expires_at = expiry
            else:
                inv = MeetingInvitation(
                    meeting_id=meeting_id,
                    email=email,
                    token=token,
                    token_expires_at=expiry,
                    rsvp_status=RSVPStatus.PENDING,
                )
                db.add(inv)
            invitations.append(inv)
        db.commit()
        try:
            from backend.app.workers.tasks.ai_tasks import send_meeting_invites

            send_meeting_invites.delay(meeting_id)
        except Exception:
            pass
        return invitations
