from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.auth.dependencies import get_current_user
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.schemas.platform import GroupCreate, GroupOut
from backend.app.services.groups_service import GroupsService

router = APIRouter(prefix="/api/v1/groups", tags=["groups"])
service = GroupsService()


@router.post("", response_model=GroupOut)
def create_group(payload: GroupCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        return service.create_group(
            db,
            community_id=payload.community_id,
            name=payload.name,
            description=payload.description,
            parent_group_id=payload.parent_group_id,
            creator=current_user,
        )
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.get("/community/{community_id}", response_model=list[GroupOut])
def list_groups(community_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return service.list_groups(db, community_id)


from backend.app.schemas.platform import GroupMemberAdd

@router.get("/{group_id}/members")
def list_group_members(group_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return service.list_members(db, group_id)


@router.post("/{group_id}/members")
def add_group_member(
    group_id: int,
    payload: GroupMemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        service.add_member(db, group_id, payload.email, payload.role, current_user)
        return {"status": "success"}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/{group_id}/members/{user_id}")
def remove_group_member(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        service.remove_member(db, group_id, user_id, current_user)
        return {"status": "success"}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/{group_id}")
def archive_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from datetime import datetime, timezone
    from backend.app.models.platform import Group
    group = db.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    group.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "archived"}
