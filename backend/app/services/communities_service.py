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

    def add_member(self, db: Session, community_id: int, email: str, role: MembershipRole, admin_user: User) -> None:
        if admin_user.role.value != "ADMIN":
            raise ValueError("Only Admins can add members to communities")
            
        target_user = db.scalar(select(User).where(User.email == email))
        if not target_user:
            raise ValueError("User not found")
            
        existing = db.scalar(
            select(CommunityMembership)
            .where(CommunityMembership.community_id == community_id, CommunityMembership.user_id == target_user.id)
        )
        if existing:
            existing.role = role
        else:
            db.add(CommunityMembership(community_id=community_id, user_id=target_user.id, role=role))
        db.commit()

    def remove_member(self, db: Session, community_id: int, user_id: int, admin_user: User) -> None:
        if admin_user.role.value != "ADMIN":
            raise ValueError("Only Admins can remove members from communities")
            
        membership = db.scalar(
            select(CommunityMembership)
            .where(CommunityMembership.community_id == community_id, CommunityMembership.user_id == user_id)
        )
        if membership:
            db.delete(membership)
            db.commit()

    def list_members(self, db: Session, community_id: int) -> list[dict]:
        memberships = db.execute(
            select(CommunityMembership, User)
            .join(User, User.id == CommunityMembership.user_id)
            .where(CommunityMembership.community_id == community_id)
        ).all()
        
        return [
            {
                "user_id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": mem.role.value,
            }
            for mem, user in memberships
        ]
