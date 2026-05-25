from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.auth.dependencies import get_current_user
from backend.app.db.session import get_db
from backend.app.domain.rbac.policies import RBACService
from backend.app.models.platform import Meeting
from backend.app.models.user import User

rbac = RBACService()


def get_rbac() -> RBACService:
  return rbac


def require_meeting_read(meeting_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Meeting:
  meeting = db.get(Meeting, meeting_id)
  if not meeting:
    raise HTTPException(status_code=404, detail="Meeting not found")
  if not rbac.can_read_meeting(db, user, meeting):
    raise HTTPException(status_code=404, detail="Meeting not found")
  return meeting


def require_meeting_write(meeting_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Meeting:
  meeting = db.get(Meeting, meeting_id)
  if not meeting:
    raise HTTPException(status_code=404, detail="Meeting not found")
  if not rbac.can_write_meeting(db, user, meeting):
    raise HTTPException(status_code=403, detail="Insufficient permissions")
  return meeting
