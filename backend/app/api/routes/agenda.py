from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.auth.dependencies import get_current_user
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.schemas.platform import AgendaItemCreate
from backend.app.services.agenda_service import AgendaService

router = APIRouter(prefix="/api/v1/agenda", tags=["agenda"])
service = AgendaService()


@router.post("")
def add_agenda_item(payload: AgendaItemCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    item = service.add_item(db, payload.model_dump())
    return {"id": item.id}


@router.get("/{meeting_id}")
def list_agenda_items(meeting_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return service.list_for_meeting(db, meeting_id)
