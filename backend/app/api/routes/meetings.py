from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.api.deps import get_rbac, require_meeting_read, require_meeting_write
from backend.app.auth.dependencies import get_current_user
from backend.app.core.config import get_settings
from backend.app.core.rate_limit import apply_rate_limit
from backend.app.db.session import get_db
from backend.app.domain.rbac.policies import RBACService
from backend.app.models.platform import (
  AttendanceRecord,
  AttendanceStatus,
  Meeting,
  MeetingInvitation,
  MOMRecord,
  TranscriptSource,
)
from backend.app.models.user import User
from backend.app.schemas.platform import (
  AttendanceCreate,
  InvitationCreate,
  MeetingCreate,
  MeetingOut,
  MeetingTransition,
  MeetingUpdate,
  MOMGenerateRequest,
  RSVPUpdate,
)
from backend.app.services.audit_service import AuditService
from backend.app.services.meeting_dashboard_service import MeetingDashboardService
from backend.app.services.meeting_intelligence_service import MeetingIntelligenceService
from backend.app.services.meetings_service import MeetingsService
from backend.app.services.mom_service import MOMService
from backend.app.services.semantic_search_service import SemanticSearchService

router = APIRouter(prefix="/api/v1/meetings", tags=["meetings"])
service = MeetingsService()
dashboard_service = MeetingDashboardService()
intelligence_service = MeetingIntelligenceService()
mom_service = MOMService()
search_service = SemanticSearchService()
audit = AuditService()


def _meeting_out(meeting: Meeting) -> MeetingOut:
  return MeetingOut.model_validate(meeting)


@router.get("", response_model=list[MeetingOut])
def list_meetings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
  return service.list_meetings(db, current_user)


@router.post("", response_model=MeetingOut)
def create_meeting(payload: MeetingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
  try:
    meeting = service.create_meeting(db, payload.model_dump(), current_user)
    audit.log(db, actor_id=current_user.id, action="meeting.create", resource_type="meeting", resource_id=meeting.id)
    return _meeting_out(meeting)
  except ValueError as exc:
    raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{meeting_id}", response_model=MeetingOut)
def get_meeting(meeting: Meeting = Depends(require_meeting_read)):
  return _meeting_out(meeting)


@router.get("/{meeting_id}/dashboard")
def meeting_dashboard(meeting: Meeting = Depends(require_meeting_read), db: Session = Depends(get_db)):
  data = dashboard_service.build(db, meeting)
  m = data["meeting"]
  return {
    "meeting": _meeting_out(m),
    "invitations": [{"id": i.id, "email": i.email, "rsvp_status": i.rsvp_status.value} for i in data["invitations"]],
    "attendance": [{"user_id": a.user_id, "status": a.status.value} for a in data["attendance"]],
    "attendees": [{"user_id": a.user_id, "status": a.status.value} for a in data["attendees"]],
    "absentees": [{"user_id": a.user_id, "status": a.status.value} for a in data["absentees"]],
    "agenda": data["agenda"],
    "minutes": [
      {"id": r.id, "is_published": r.is_published, "created_at": str(r.created_at), "source": r.quality_report.get("source", "ai")}
      for r in data["minutes"]
    ],
    "action_items": [
      {"id": a.id, "title": a.title, "status": a.status.value, "due_date": str(a.due_date)} for a in data["action_items"]
    ],
    "decisions": [{"id": d.id, "decision_text": d.decision_text} for d in data["decisions"]],
    "history": [
      {"from_status": h.from_status.value, "to_status": h.to_status.value, "created_at": str(h.created_at)}
      for h in data["history"]
    ],
    "transcripts": [
      {"id": t.id, "source": t.source.value, "filename": t.filename, "created_at": str(t.created_at)} for t in data["transcripts"]
    ],
    "realtime_status": data["realtime_status"],
  }


@router.put("/{meeting_id}", response_model=MeetingOut)
def update_meeting(
  payload: MeetingUpdate,
  meeting: Meeting = Depends(require_meeting_write),
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  for key, value in payload.model_dump(exclude_unset=True).items():
    setattr(meeting, key, value)
  db.commit()
  db.refresh(meeting)
  audit.log(db, actor_id=current_user.id, action="meeting.update", resource_type="meeting", resource_id=meeting.id)
  return _meeting_out(meeting)


@router.post("/{meeting_id}/transition", response_model=MeetingOut)
def transition_meeting(
  payload: MeetingTransition,
  meeting: Meeting = Depends(require_meeting_write),
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  try:
    updated = service.transition_status(db, meeting, payload.to_status, current_user)
    audit.log(
      db,
      actor_id=current_user.id,
      action="meeting.transition",
      resource_type="meeting",
      resource_id=meeting.id,
      details={"to": payload.to_status.value},
    )
    return _meeting_out(updated)
  except ValueError as exc:
    raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{meeting_id}/invite")
def invite(
  payload: InvitationCreate,
  meeting: Meeting = Depends(require_meeting_write),
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  if meeting.id != payload.meeting_id:
    raise HTTPException(status_code=400, detail="Meeting ID mismatch")
  invitations = service.invite(db, meeting.id, [str(e) for e in payload.emails])
  audit.log(db, actor_id=current_user.id, action="meeting.invite", resource_type="meeting", resource_id=meeting.id, details={"count": len(invitations)})
  return {"sent": len(invitations)}


@router.get("/{meeting_id}/invitations")
def get_invitations(meeting: Meeting = Depends(require_meeting_read), db: Session = Depends(get_db)):
  invs = db.scalars(select(MeetingInvitation).where(MeetingInvitation.meeting_id == meeting.id)).all()
  return [{"id": i.id, "email": i.email, "rsvp_status": i.rsvp_status.value} for i in invs]


@router.post("/{meeting_id}/attendance")
def record_attendance(
  payload: AttendanceCreate,
  meeting: Meeting = Depends(require_meeting_write),
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  user = db.scalar(select(User).where(User.email == payload.email))
  if not user:
    raise HTTPException(status_code=404, detail="User not found for this email")
  record = db.scalar(
    select(AttendanceRecord).where(AttendanceRecord.meeting_id == meeting.id, AttendanceRecord.user_id == user.id)
  )
  if record:
    record.status = AttendanceStatus(payload.status)
  else:
    record = AttendanceRecord(
      meeting_id=meeting.id,
      user_id=user.id,
      status=AttendanceStatus(payload.status),
      marked_by_id=current_user.id,
    )
    db.add(record)
  db.commit()
  return {"success": True}


@router.post("/rsvp/{token}")
def external_rsvp(token: str, payload: RSVPUpdate, db: Session = Depends(get_db)):
  from backend.app.core.security import decode_token

  try:
    decoded = decode_token(token)
  except ValueError as exc:
    raise HTTPException(status_code=401, detail=str(exc)) from exc
  if decoded.get("type") != "rsvp":
    raise HTTPException(status_code=401, detail="Invalid RSVP token")
  subject = decoded.get("sub", "")
  meeting_id_str, email = subject.split(":", 1)
  invitation = db.scalar(
    select(MeetingInvitation).where(
      MeetingInvitation.meeting_id == int(meeting_id_str),
      MeetingInvitation.email == email,
      MeetingInvitation.token == token,
    )
  )
  if not invitation:
    raise HTTPException(status_code=404, detail="Invitation not found")
  invitation.rsvp_status = payload.status
  db.commit()
  return {"success": True, "status": payload.status.value}


@router.post("/{meeting_id}/minutes/upload")
async def upload_minutes(
  meeting: Meeting = Depends(require_meeting_write),
  file: UploadFile = File(...),
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  settings = get_settings()
  content = await file.read()
  if len(content) > settings.max_upload_bytes:
    raise HTTPException(status_code=413, detail="File too large")
  text = content.decode("utf-8", errors="ignore")
  record = MOMRecord(
    meeting_id=meeting.id,
    generated_text=text,
    generated_html="",
    quality_report={"source": "upload", "filename": file.filename},
    is_published=False,
  )
  db.add(record)
  db.commit()
  db.refresh(record)
  intelligence_service.save_transcript(db, meeting.id, text, TranscriptSource.UPLOAD, current_user, file.filename)
  intelligence_service._extract_outcomes(db, meeting, text, record.id)
  return {"id": record.id, "filename": file.filename, "characters": len(text)}


@router.get("/{meeting_id}/minutes")
def list_minutes(meeting: Meeting = Depends(require_meeting_read), db: Session = Depends(get_db)):
  records = db.scalars(
    select(MOMRecord).where(MOMRecord.meeting_id == meeting.id, MOMRecord.deleted_at.is_(None)).order_by(MOMRecord.created_at.desc())
  ).all()
  return [
    {
      "id": r.id,
      "is_published": r.is_published,
      "created_at": str(r.created_at),
      "source": r.quality_report.get("source", "ai"),
      "filename": r.quality_report.get("filename"),
    }
    for r in records
  ]


@router.get("/{meeting_id}/minutes/{mom_id}")
def get_minute(meeting: Meeting = Depends(require_meeting_read), mom_id: int = 0, db: Session = Depends(get_db)):
  record = db.get(MOMRecord, mom_id)
  if not record or record.meeting_id != meeting.id:
    raise HTTPException(status_code=404, detail="Minutes not found")
  return {"id": record.id, "generated_text": record.generated_text, "is_published": record.is_published}


@router.post("/{meeting_id}/mom/generate")
def generate_mom_in_meeting(
  payload: MOMGenerateRequest,
  meeting: Meeting = Depends(require_meeting_write),
  db: Session = Depends(get_db),
  rbac_svc: RBACService = Depends(get_rbac),
  current_user: User = Depends(get_current_user),
):
  if not rbac_svc.can_manage_mom(db, current_user, meeting):
    raise HTTPException(status_code=403, detail="Cannot generate minutes")
  record = intelligence_service.generate_mom(db, meeting, payload.transcript_or_notes, payload.meeting_info)
  return {"mom_id": record.id, "quality_report": record.quality_report}


@router.post("/{meeting_id}/mom/{mom_id}/publish")
def publish_mom_in_meeting(
  mom_id: int,
  meeting: Meeting = Depends(require_meeting_write),
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  from backend.app.models.platform import Group

  record = db.get(MOMRecord, mom_id)
  if not record or record.meeting_id != meeting.id:
    raise HTTPException(status_code=404, detail="Minutes not found")
  record.is_published = True
  record.published_by_id = current_user.id
  db.commit()
  group = db.get(Group, meeting.group_id)
  if group:
    search_service.index_mom(db, record, community_id=group.community_id, group_id=meeting.group_id)
  return {"success": True}


@router.post("/{meeting_id}/intelligence/generate")
async def intelligence_generate(
  request: Request,
  meeting: Meeting = Depends(require_meeting_write),
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
  source: str = Form(...),
  meeting_info: str = Form(""),
  content: str = Form(""),
  audio: UploadFile | None = File(None),
  photo: UploadFile | None = File(None),
):
  await apply_rate_limit(request, "intelligence", limit=20, window=60)
  settings = get_settings()
  if source == "audio":
    if not audio:
      raise HTTPException(status_code=400, detail="audio file required")
    content = await audio.read()
    if len(content) > settings.max_upload_bytes:
      raise HTTPException(status_code=413, detail="File too large")
    await audio.seek(0)
    return await intelligence_service.generate_from_audio(db, meeting, audio, meeting_info, current_user)
  if source == "notes":
    record = intelligence_service.generate_mom(db, meeting, content, meeting_info)
    return {"mom_id": record.id, "mom": record.generated_text}
  if source == "image":
    if not photo:
      raise HTTPException(status_code=400, detail="photo file required")
    pipeline = intelligence_service._pipeline()
    result = await pipeline.generate_from_photo(photo_file=photo, meeting_info=meeting_info)
    if result.get("mom"):
      record = intelligence_service.generate_mom(db, meeting, result["mom"], meeting_info)
      return {**result, "mom_id": record.id}
    return result
  if source == "live":
    intelligence_service.save_transcript(db, meeting.id, content, TranscriptSource.LIVE, current_user)
    record = intelligence_service.generate_mom(db, meeting, content, meeting_info)
    return {"mom_id": record.id, "mom": record.generated_text}
  raise HTTPException(status_code=400, detail="Invalid source")


@router.get("/{meeting_id}/history")
def meeting_history(meeting: Meeting = Depends(require_meeting_read), db: Session = Depends(get_db)):
  from backend.app.models.platform import MeetingStatusAudit

  rows = db.scalars(
    select(MeetingStatusAudit).where(MeetingStatusAudit.meeting_id == meeting.id).order_by(MeetingStatusAudit.created_at.desc())
  ).all()
  return [{"from_status": r.from_status.value, "to_status": r.to_status.value, "created_at": str(r.created_at)} for r in rows]
