from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.api.deps import get_rbac, require_meeting_write
from backend.app.auth.dependencies import get_current_user
from backend.app.db.session import get_db
from backend.app.domain.rbac.policies import RBACService
from backend.app.models.platform import Group, MOMRecord, Meeting
from backend.app.models.user import User
from backend.app.schemas.platform import MOMGenerateRequest
from backend.app.services.meeting_intelligence_service import MeetingIntelligenceService
from backend.app.services.semantic_search_service import SemanticSearchService
from backend.app.workers.tasks.ai_tasks import generate_embeddings

router = APIRouter(prefix="/api/v1/mom", tags=["mom"])
intelligence = MeetingIntelligenceService()
search_service = SemanticSearchService()
rbac = RBACService()


@router.get("")
def list_moms(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    allowed = rbac.accessible_group_ids(db, current_user)
    stmt = select(MOMRecord).join(Meeting).order_by(MOMRecord.created_at.desc())
    if allowed is not None:
        stmt = stmt.where(Meeting.group_id.in_(allowed))
    return db.scalars(stmt).all()


@router.post("/{meeting_id}/generate")
def generate_mom_legacy(
    meeting_id: int,
    payload: MOMGenerateRequest,
    meeting: Meeting = Depends(require_meeting_write),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not rbac.can_manage_mom(db, current_user, meeting):
        raise HTTPException(status_code=403, detail="Cannot generate minutes")
    record = intelligence.generate_mom(db, meeting, payload.transcript_or_notes, payload.meeting_info)
    return {"mom_id": record.id, "quality_report": record.quality_report}


@router.post("/{mom_id}/publish")
def publish_mom(mom_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = db.get(MOMRecord, mom_id)
    if not record:
        raise HTTPException(status_code=404, detail="MOM not found")
    meeting = db.get(Meeting, record.meeting_id)
    if not meeting or not rbac.can_manage_mom(db, current_user, meeting):
        raise HTTPException(status_code=404, detail="MOM not found")
    record.is_published = True
    record.published_by_id = current_user.id
    db.commit()
    group = db.get(Group, meeting.group_id)
    if group:
        search_service.index_mom(db, record, community_id=group.community_id, group_id=meeting.group_id)
        generate_embeddings.delay(record.id)
    return {"success": True}
