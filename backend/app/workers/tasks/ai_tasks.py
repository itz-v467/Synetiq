from sqlalchemy import select

from backend.app.core.config import get_settings
from backend.app.db.session import SessionLocal
from backend.app.integrations.email.sender import EmailSender
from backend.app.models.platform import Meeting, MeetingInvitation
from backend.app.models.user import User
from backend.app.services.notifications_service import NotificationsService
from backend.app.workers.celery_app import celery_app


@celery_app.task(name="synetiq.tasks.generate_embeddings")
def generate_embeddings(mom_id: int) -> dict:
  return {"mom_id": mom_id, "indexed": True}


@celery_app.task(name="synetiq.tasks.send_notification")
def send_notification(notification_id: int) -> dict:
  service = NotificationsService()
  with SessionLocal() as db:
    return service.send_pending(db, notification_id)


@celery_app.task(name="synetiq.tasks.send_meeting_invites")
def send_meeting_invites(meeting_id: int) -> dict:
  settings = get_settings()
  email = EmailSender()
  notif_service = NotificationsService()
  sent = 0
  with SessionLocal() as db:
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
      return {"meeting_id": meeting_id, "sent": 0}
    invitations = db.scalars(select(MeetingInvitation).where(MeetingInvitation.meeting_id == meeting_id)).all()
    for inv in invitations:
      rsvp_link = f"{settings.app_public_url}/api/v1/meetings/rsvp/{inv.token}"
      body = (
        f"<p>You are invited to <strong>{meeting.title}</strong> "
        f"on {meeting.meeting_date} at {meeting.start_time}.</p>"
        f"<p><a href='{rsvp_link}'>RSVP</a></p>"
      )
      user = db.scalar(select(User).where(User.email == inv.email))
      if user:
        row = notif_service.queue(db, user.id, "meeting_invite", f"Invitation: {meeting.title}", body)
        send_notification.delay(row.id)
      if email.send(inv.email, f"Invitation: {meeting.title}", body):
        sent += 1
  return {"meeting_id": meeting_id, "sent": sent}


@celery_app.task(name="synetiq.tasks.weekly_digest")
def weekly_digest() -> dict:
  return {"status": "scheduled"}
