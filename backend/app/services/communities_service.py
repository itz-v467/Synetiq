import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.platform import Community, CommunityMembership, MembershipRole
from backend.app.models.user import User


class CommunitiesService:
    @staticmethod
    def _slugify(name: str) -> str:
        slug = re.sub(r"[^a-zA-Z0-9]+", "-", name.strip().lower()).strip("-")
        return slug or "community"

    def create_community(self, db: Session, *, name: str, description: str | None, creator: User) -> Community:
        base_slug = self._slugify(name)
        slug = base_slug
        suffix = 1
        while db.scalar(select(Community).where(Community.slug == slug)):
            suffix += 1
            slug = f"{base_slug}-{suffix}"

        community = Community(name=name, slug=slug, description=description, created_by_id=creator.id)
        db.add(community)
        db.flush()
        db.add(
            CommunityMembership(
                community_id=community.id,
                user_id=creator.id,
                role=MembershipRole.ADMIN,
            )
        )
        db.commit()
        db.refresh(community)
        return community

    def list_accessible(self, db: Session, user: User) -> list[Community]:
        if user.role.value == "ADMIN":
            return list(db.scalars(select(Community).where(Community.deleted_at.is_(None))).all())
        memberships = db.scalars(
            select(Community)
            .join(CommunityMembership, CommunityMembership.community_id == Community.id)
            .where(CommunityMembership.user_id == user.id, Community.deleted_at.is_(None))
        )
        return list(memberships.all())
