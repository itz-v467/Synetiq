from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.security import create_token
from backend.app.models.platform import Meeting, MeetingInvitation, MeetingStatus, MeetingStatusAudit, RSVPStatus
from backend.app.models.user import User, UserRole

_ALLOWED_TRANSITIONS: dict[MeetingStatus, set[MeetingStatus]] = {
    MeetingStatus.DRAFT: {MeetingStatus.PUBLISHED},
    MeetingStatus.PUBLISHED: {MeetingStatus.LIVE},
    MeetingStatus.LIVE: {MeetingStatus.ENDED, MeetingStatus.PUBLISHED},
    MeetingStatus.ENDED: {MeetingStatus.ARCHIVED},
    MeetingStatus.ARCHIVED: set(),
}


class MeetingsService:
    def create_meeting(self, db: Session, payload: dict, organizer: User) -> Meeting:
        meeting = Meeting(organizer_id=organizer.id, **payload)
        db.add(meeting)
        db.commit()
        db.refresh(meeting)
        return meeting

    def transition_status(self, db: Session, meeting: Meeting, to_status: MeetingStatus, actor: User) -> Meeting:
        from_status = meeting.status
        allowed = _ALLOWED_TRANSITIONS[from_status]
        if to_status not in allowed:
            raise ValueError(f"Invalid transition {from_status} -> {to_status}")
        if from_status == MeetingStatus.LIVE and to_status == MeetingStatus.PUBLISHED and actor.role != UserRole.ADMIN:
            raise ValueError("Only admin can revert LIVE to PUBLISHED")
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
        return invitations
