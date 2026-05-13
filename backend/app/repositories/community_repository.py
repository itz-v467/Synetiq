from sqlalchemy import select

from backend.app.models.platform import Community
from backend.app.repositories.base import BaseRepository


class CommunityRepository(BaseRepository):
    def get_by_slug(self, slug: str) -> Community | None:
        return self.db.scalar(select(Community).where(Community.slug == slug, Community.deleted_at.is_(None)))
