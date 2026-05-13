from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.auth.dependencies import get_current_user
from backend.app.db.session import get_db
from backend.app.models.platform import Notification
from backend.app.models.user import User
from backend.app.services.notifications_service import NotificationsService
from backend.app.workers.tasks.ai_tasks import send_notification

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])
service = NotificationsService()


@router.post("")
def create_notification(user_id: int, category: str, subject: str, body_html: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    row = service.queue(db, user_id=user_id, category=category, subject=subject, body_html=body_html)
    send_notification.delay(row.id)
    return {"notification_id": row.id}


@router.get("")
def list_my_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()
