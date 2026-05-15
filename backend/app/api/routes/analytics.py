from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.auth.dependencies import get_current_user, require_roles
from backend.app.db.session import get_db
from backend.app.models.user import User, UserRole
from backend.app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])
service = AnalyticsService()


@router.get("/organizer")
def organizer_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.organizer_summary(db, current_user.id)


@router.get("/admin")
def admin_analytics(db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.ADMIN))):
    return service.platform_summary(db)


@router.get("/dashboard")
def dashboard_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.dashboard_summary(db, current_user.id)


@router.get("/insights")
def dashboard_insights(current_user: User = Depends(get_current_user)):
    # Mock insights for now, but served from API
    return [
        f"Welcome back, {current_user.full_name}!",
        "You have 2 meetings scheduled for today.",
        "MOM for 'Core Team Sync' is ready for review.",
        "3 action items require your attention."
    ]
