from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from backend.app.auth.dependencies import get_current_user
from backend.app.core.rate_limit import apply_rate_limit
from backend.app.db.session import get_db
from backend.app.domain.rbac.policies import RBACService
from backend.app.models.user import User
from backend.app.services.semantic_search_service import SemanticSearchService

router = APIRouter(prefix="/api/v1/search", tags=["semantic-search"])
service = SemanticSearchService()
rbac = RBACService()


@router.get("")
async def semantic_search(
    request: Request,
    q: str,
    types: str | None = None,
    community_id: int | None = None,
    group_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await apply_rate_limit(request, "search", limit=30, window=60)
    type_list = [t.strip() for t in types.split(",")] if types else None
    allowed = rbac.accessible_group_ids(db, current_user)
    if group_id is not None:
        if allowed is not None and group_id not in allowed:
            return {"results": []}
        allowed = {group_id}
    elif community_id is not None:
        from sqlalchemy import select

        from backend.app.models.platform import Group

        gids = set(db.scalars(select(Group.id).where(Group.community_id == community_id)).all())
        allowed = gids if allowed is None else allowed & gids
    return {"results": service.search(db, q, limit=15, allowed_group_ids=allowed, types=type_list)}
