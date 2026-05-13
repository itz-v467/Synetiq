from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.auth.dependencies import get_current_user
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.services.semantic_search_service import SemanticSearchService

router = APIRouter(prefix="/api/v1/search", tags=["semantic-search"])
service = SemanticSearchService()


@router.get("")
def semantic_search(q: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return {"results": service.search(db, q)}
