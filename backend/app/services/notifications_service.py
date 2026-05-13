from sqlalchemy.orm import Session

from backend.app.models.platform import Notification, NotificationStatus


class NotificationsService:
    def queue(self, db: Session, user_id: int, category: str, subject: str, body_html: str) -> Notification:
        notice = Notification(user_id=user_id, category=category, subject=subject, body_html=body_html, status=NotificationStatus.PENDING)
        db.add(notice)
        db.commit()
        db.refresh(notice)
        return notice
