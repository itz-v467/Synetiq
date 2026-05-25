from sqlalchemy.orm import Session

from backend.app.integrations.email.sender import EmailSender
from backend.app.models.platform import Notification, NotificationStatus


class NotificationsService:
  def __init__(self) -> None:
    self.email = EmailSender()

  def queue(self, db: Session, user_id: int, category: str, subject: str, body_html: str) -> Notification:
    row = Notification(user_id=user_id, category=category, subject=subject, body_html=body_html, status=NotificationStatus.PENDING)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

  def send_pending(self, db: Session, notification_id: int) -> dict:
    row = db.get(Notification, notification_id)
    if not row:
      return {"sent": False, "reason": "not_found"}
    from backend.app.models.user import User

    user = db.get(User, row.user_id)
    if not user:
      row.status = NotificationStatus.FAILED
      row.error_message = "user_not_found"
      db.commit()
      return {"sent": False}
    ok = self.email.send(user.email, row.subject, row.body_html)
    row.status = NotificationStatus.SENT if ok else NotificationStatus.FAILED
    if not ok:
      row.error_message = "smtp_failed"
    db.commit()
    return {"sent": ok, "notification_id": notification_id}

  def queue_meeting_invite(self, db: Session, user_id: int, meeting_title: str, rsvp_link: str) -> Notification:
    body = f"<p>You are invited to <strong>{meeting_title}</strong>.</p><p><a href='{rsvp_link}'>RSVP</a></p>"
    return self.queue(db, user_id, "meeting_invite", f"Invitation: {meeting_title}", body)
