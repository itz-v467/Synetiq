from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.auth.dependencies import get_current_user, require_roles
from backend.app.db.session import get_db
from backend.app.models.user import User, UserRole
from backend.app.schemas.platform import CommunityCreate, CommunityOut
from backend.app.services.communities_service import CommunitiesService

router = APIRouter(prefix="/api/v1/communities", tags=["communities"])
service = CommunitiesService()


@router.post("", response_model=CommunityOut)
def create_community(
    payload: CommunityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    return service.create_community(db, name=payload.name, description=payload.description, creator=current_user)


@router.get("", response_model=list[CommunityOut])
def list_communities(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.list_accessible(db, current_user)


@router.get("/{community_id}/members")
def list_community_members(community_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return service.list_members(db, community_id)


from backend.app.schemas.platform import CommunityMemberAdd
from fastapi import HTTPException

@router.post("/{community_id}/members")
def add_community_member(
    community_id: int,
    payload: CommunityMemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    try:
        service.add_member(db, community_id, payload.email, payload.role, current_user)
        return {"status": "success"}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/{community_id}/members/{user_id}")
def remove_community_member(
    community_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    try:
        service.remove_member(db, community_id, user_id, current_user)
        return {"status": "success"}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
