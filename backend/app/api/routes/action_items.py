from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.auth.dependencies import get_current_user
from backend.app.db.session import get_db
from backend.app.models.platform import ActionItem
from backend.app.models.user import User
from backend.app.schemas.platform import ActionItemCreate, ActionItemUpdateStatus
from backend.app.services.action_items_service import ActionItemsService

router = APIRouter(prefix="/api/v1/action-items", tags=["action-items"])
service = ActionItemsService()


@router.post("")
def create_action_item(payload: ActionItemCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    item = service.create_item(db, payload.model_dump())
    return {"id": item.id}


@router.patch("/{action_item_id}/status")
def update_action_item_status(action_item_id: int, payload: ActionItemUpdateStatus, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.get(ActionItem, action_item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")
    item = service.update_status(db, item, payload.status, current_user.id)
    return {"id": item.id, "status": item.status}
