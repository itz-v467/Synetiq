import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.domain.rbac.platform_roles import is_platform_super
from backend.app.models.platform import Community, CommunityMembership, MembershipRole
from backend.app.models.user import User, UserRole


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
        if is_platform_super(user):
            return list(db.scalars(select(Community).where(Community.deleted_at.is_(None))).all())
        memberships = db.scalars(
            select(Community)
            .join(CommunityMembership, CommunityMembership.community_id == Community.id)
            .where(CommunityMembership.user_id == user.id, Community.deleted_at.is_(None))
        )
        return list(memberships.all())

    def add_member(self, db: Session, community_id: int, email: str, role: MembershipRole, admin_user: User) -> None:
        if not is_platform_super(admin_user):
            raise ValueError("Only platform admins can add members to communities")
            
        target_user = db.scalar(select(User).where(User.email == email))
        if not target_user:
            # Auto-create stub user
            target_user = User(
                email=email,
                full_name=email.split("@")[0],
                password_hash="invited_no_password",
                role=UserRole.PARTICIPANT,
                is_active=True,
            )
            db.add(target_user)
            db.flush()
            
        existing = db.scalar(
            select(CommunityMembership)
            .where(CommunityMembership.community_id == community_id, CommunityMembership.user_id == target_user.id)
        )
        if existing:
            existing.role = role
        else:
            db.add(CommunityMembership(community_id=community_id, user_id=target_user.id, role=role))
            
            # Send invitation email
            community = db.get(Community, community_id)
            if community:
                from backend.app.services.notifications_service import NotificationsService
                from backend.app.workers.tasks.ai_tasks import send_notification
                
                notif_service = NotificationsService()
                body = f"<p>You have been invited to join the community <strong>{community.name}</strong> on Synetiq.</p><p>Please log in to access the platform.</p>"
                row = notif_service.queue(db, target_user.id, "community_invite", f"Invitation: {community.name}", body)
                try:
                    send_notification.delay(row.id)
                except Exception:
                    pass

        db.commit()

    def remove_member(self, db: Session, community_id: int, user_id: int, admin_user: User) -> None:
        if not is_platform_super(admin_user):
            raise ValueError("Only platform admins can remove members from communities")
            
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
