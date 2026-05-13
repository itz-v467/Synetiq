from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.platform import CommunityMembership, Group, GroupMembership, MembershipRole
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
        if creator.role != UserRole.ADMIN:
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
