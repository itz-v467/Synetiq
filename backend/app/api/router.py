from fastapi import APIRouter

from backend.app.api.routes import (
    action_items,
    agenda,
    analytics,
    auth,
    communities,
    groups,
    health,
    legacy_ai,
    meetings,
    mom,
    notifications,
    semantic_search,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(health.router)
api_router.include_router(legacy_ai.router)
api_router.include_router(communities.router)
api_router.include_router(groups.router)
api_router.include_router(meetings.router)
api_router.include_router(agenda.router)
api_router.include_router(mom.router)
api_router.include_router(notifications.router)
api_router.include_router(action_items.router)
api_router.include_router(analytics.router)
api_router.include_router(semantic_search.router)
