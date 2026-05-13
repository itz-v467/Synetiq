from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.auth.dependencies import get_current_user
from backend.app.db.session import get_db
from backend.app.models.platform import Group, MOMRecord, Meeting
from backend.app.models.user import User
from backend.app.services.mom_service import MOMService
from backend.app.services.semantic_search_service import SemanticSearchService
from backend.app.workers.tasks.ai_tasks import generate_embeddings

router = APIRouter(prefix="/api/v1/mom", tags=["mom"])
service = MOMService()
search_service = SemanticSearchService()


@router.post("/{meeting_id}/generate")
def generate_mom(meeting_id: int, transcript_or_notes: str, meeting_info: str = "", db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    record = service.generate_from_text(db, meeting_id, transcript_or_notes, meeting_info)
    return {"mom_id": record.id, "quality_report": record.quality_report}


@router.post("/{mom_id}/publish")
def publish_mom(mom_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = db.get(MOMRecord, mom_id)
    record.is_published = True
    record.published_by_id = current_user.id
    db.commit()
    meeting = db.get(Meeting, record.meeting_id)
    group = db.get(Group, meeting.group_id) if meeting else None
    if meeting and group:
        search_service.index_mom(db, record, community_id=group.community_id, group_id=meeting.group_id)
        generate_embeddings.delay(record.id)
    return {"success": True}
