from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.auth.dependencies import get_current_user
from backend.app.db.session import get_db
from backend.app.models.platform import Meeting
from backend.app.models.user import User
from backend.app.schemas.platform import InvitationCreate, MeetingCreate, MeetingOut, MeetingTransition, RSVPUpdate
from backend.app.services.meetings_service import MeetingsService

router = APIRouter(prefix="/api/v1/meetings", tags=["meetings"])
service = MeetingsService()


@router.post("", response_model=MeetingOut)
def create_meeting(payload: MeetingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.create_meeting(db, payload.model_dump(), current_user)


@router.post("/{meeting_id}/transition", response_model=MeetingOut)
def transition_meeting(meeting_id: int, payload: MeetingTransition, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    try:
        return service.transition_status(db, meeting, payload.to_status, current_user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{meeting_id}/invite")
def invite(meeting_id: int, payload: InvitationCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    if meeting_id != payload.meeting_id:
        raise HTTPException(status_code=400, detail="Meeting ID mismatch")
    invitations = service.invite(db, meeting_id, [str(e) for e in payload.emails])
    return {"sent": len(invitations)}


@router.post("/rsvp/{token}")
def external_rsvp(token: str, payload: RSVPUpdate, db: Session = Depends(get_db)):
    from backend.app.core.security import decode_token
    from backend.app.models.platform import MeetingInvitation
    from sqlalchemy import select

    try:
        decoded = decode_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    if decoded.get("type") != "rsvp":
        raise HTTPException(status_code=401, detail="Invalid RSVP token")
    subject = decoded.get("sub", "")
    meeting_id_str, email = subject.split(":", 1)
    invitation = db.scalar(
        select(MeetingInvitation).where(MeetingInvitation.meeting_id == int(meeting_id_str), MeetingInvitation.email == email, MeetingInvitation.token == token)
    )
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    invitation.rsvp_status = payload.status
    db.commit()
    return {"success": True, "status": payload.status}
