from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.platform import CommunityMembership, Group, GroupMembership, MembershipRole
from backend.app.domain.rbac.platform_roles import is_platform_super
from backend.app.models.user import User, UserRole


class GroupsService:
    def create_group(
        self,
        db: Session,
        *,
        community_id: int,
        name: str,
        description: str | None,
        parent_group_id: int | None,
        creator: User,
    ) -> Group:
        if not is_platform_super(creator):
            membership = db.scalar(
                select(CommunityMembership).where(
                    CommunityMembership.community_id == community_id,
                    CommunityMembership.user_id == creator.id,
                    CommunityMembership.deleted_at.is_(None),
                )
            )
            if not membership:
                raise ValueError("Not a member of this community")
        group = Group(
            community_id=community_id,
            name=name,
            description=description,
            parent_group_id=parent_group_id,
            created_by_id=creator.id,
        )
        db.add(group)
        db.flush()
        db.add(GroupMembership(group_id=group.id, user_id=creator.id, role=MembershipRole.ORGANIZER))
        db.commit()
        db.refresh(group)
        return group

    def list_groups(self, db: Session, community_id: int) -> list[Group]:
        return list(db.scalars(select(Group).where(Group.community_id == community_id, Group.deleted_at.is_(None))).all())

    def add_member(self, db: Session, group_id: int, email: str, role: MembershipRole, organizer_user: User) -> None:
        # Check if organizer is admin or an organizer of this group
        if not is_platform_super(organizer_user):
            organizer_membership = db.scalar(
                select(GroupMembership).where(GroupMembership.group_id == group_id, GroupMembership.user_id == organizer_user.id)
            )
            if not organizer_membership or organizer_membership.role.value != "ORGANIZER":
                raise ValueError("Only Organizers can add members to groups")
            
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
            
        # Ensure user is part of the community
        group = db.scalar(select(Group).where(Group.id == group_id))
        if not group:
             raise ValueError("Group not found")
             
        comm_membership = db.scalar(
            select(CommunityMembership)
            .where(CommunityMembership.community_id == group.community_id, CommunityMembership.user_id == target_user.id)
        )
        if not comm_membership and not is_platform_super(organizer_user):
            # Auto-add to community if invited to a group
            db.add(CommunityMembership(community_id=group.community_id, user_id=target_user.id, role=MembershipRole.MEMBER))
            db.flush()
             
        existing = db.scalar(
            select(GroupMembership)
            .where(GroupMembership.group_id == group_id, GroupMembership.user_id == target_user.id)
        )
        if existing:
            existing.role = role
        else:
            db.add(GroupMembership(group_id=group_id, user_id=target_user.id, role=role))
            
            # Send invitation email
            from backend.app.services.notifications_service import NotificationsService
            from backend.app.workers.tasks.ai_tasks import send_notification
            
            notif_service = NotificationsService()
            body = f"<p>You have been invited to join the group <strong>{group.name}</strong> on Synetiq.</p><p>Please log in to access the platform.</p>"
            row = notif_service.queue(db, target_user.id, "group_invite", f"Invitation: {group.name}", body)
            try:
                send_notification.delay(row.id)
            except Exception:
                pass

        db.commit()

    def remove_member(self, db: Session, group_id: int, user_id: int, organizer_user: User) -> None:
        if not is_platform_super(organizer_user):
            organizer_membership = db.scalar(
                select(GroupMembership).where(GroupMembership.group_id == group_id, GroupMembership.user_id == organizer_user.id)
            )
            if not organizer_membership or organizer_membership.role.value != "ORGANIZER":
                raise ValueError("Only Organizers can remove members from groups")
            
        membership = db.scalar(
            select(GroupMembership)
            .where(GroupMembership.group_id == group_id, GroupMembership.user_id == user_id)
        )
        if membership:
            db.delete(membership)
            db.commit()

    def list_members(self, db: Session, group_id: int) -> list[dict]:
        memberships = db.execute(
            select(GroupMembership, User)
            .join(User, User.id == GroupMembership.user_id)
            .where(GroupMembership.group_id == group_id)
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
