from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.platform import (
  ActionItem,
  AgendaItem,
  AttendanceRecord,
  Meeting,
  MeetingDecision,
  MeetingInvitation,
  MeetingStatusAudit,
  MeetingTranscript,
  MOMRecord,
)
from backend.app.models.user import User


class MeetingDashboardService:
  def build(self, db: Session, meeting: Meeting) -> dict:
    invitations = db.scalars(
      select(MeetingInvitation).where(MeetingInvitation.meeting_id == meeting.id, MeetingInvitation.deleted_at.is_(None))
    ).all()
    attendance = db.scalars(select(AttendanceRecord).where(AttendanceRecord.meeting_id == meeting.id)).all()
    present_ids = {a.user_id for a in attendance if a.status.value == "PRESENT"}
    invited_user_ids = {i.invited_user_id for i in invitations if i.invited_user_id}

    attendees = [a for a in attendance if a.status.value == "PRESENT"]
    absentees = [a for a in attendance if a.status.value == "ABSENT"]
    not_marked = [i for i in invitations if i.invited_user_id and i.invited_user_id not in present_ids and i.invited_user_id not in {a.user_id for a in absentees}]

    agenda = db.scalars(
      select(AgendaItem).where(AgendaItem.meeting_id == meeting.id, AgendaItem.deleted_at.is_(None)).order_by(AgendaItem.position)
    ).all()
    minutes = db.scalars(
      select(MOMRecord).where(MOMRecord.meeting_id == meeting.id, MOMRecord.deleted_at.is_(None)).order_by(MOMRecord.created_at.desc())
    ).all()
    action_items = db.scalars(select(ActionItem).where(ActionItem.meeting_id == meeting.id, ActionItem.deleted_at.is_(None))).all()
    decisions = db.scalars(select(MeetingDecision).where(MeetingDecision.meeting_id == meeting.id)).all()
    history = db.scalars(
      select(MeetingStatusAudit).where(MeetingStatusAudit.meeting_id == meeting.id).order_by(MeetingStatusAudit.created_at.desc())
    ).all()
    transcripts = db.scalars(
      select(MeetingTranscript).where(MeetingTranscript.meeting_id == meeting.id).order_by(MeetingTranscript.created_at.desc())
    ).all()

    return {
      "meeting": meeting,
      "invitations": invitations,
      "attendance": attendance,
      "attendees": attendees,
      "absentees": absentees,
      "pending_attendance": not_marked,
      "agenda": agenda,
      "minutes": minutes,
      "action_items": action_items,
      "decisions": decisions,
      "history": history,
      "transcripts": transcripts,
      "realtime_status": meeting.status.value,
    }
