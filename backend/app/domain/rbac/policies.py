"""Central RBAC policy: Super Admin (platform ADMIN), scoped admins, read-only members."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.platform import (
    CommunityMembership,
    Group,
    GroupMembership,
    Meeting,
    MembershipRole,
    MOMRecord,
)
from backend.app.domain.rbac.platform_roles import is_platform_super, is_superadmin
from backend.app.models.user import User


class RBACService:
  def is_super_admin(self, user: User) -> bool:
    return is_platform_super(user)

  def accessible_group_ids(self, db: Session, user: User) -> set[int] | None:
    """None means unrestricted (super admin)."""
    if self.is_super_admin(user):
      return None
    rows = db.scalars(select(GroupMembership.group_id).where(GroupMembership.user_id == user.id)).all()
    return set(rows)

  def is_group_admin(self, db: Session, user: User, group_id: int) -> bool:
    if self.is_super_admin(user):
      return True
    gm = db.scalar(
      select(GroupMembership).where(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == user.id,
        GroupMembership.role.in_([MembershipRole.ADMIN, MembershipRole.ORGANIZER]),
      )
    )
    if gm:
      return True
    group = db.get(Group, group_id)
    if not group:
      return False
    cm = db.scalar(
      select(CommunityMembership).where(
        CommunityMembership.community_id == group.community_id,
        CommunityMembership.user_id == user.id,
        CommunityMembership.role.in_([MembershipRole.ADMIN, MembershipRole.ORGANIZER]),
      )
    )
    return cm is not None

  def can_read_meeting(self, db: Session, user: User, meeting: Meeting) -> bool:
    if self.is_super_admin(user):
      return True
    if meeting.organizer_id == user.id:
      return True
    allowed = self.accessible_group_ids(db, user)
    return allowed is not None and meeting.group_id in allowed

  def can_write_meeting(self, db: Session, user: User, meeting: Meeting) -> bool:
    if self.is_super_admin(user):
      return True
    if meeting.organizer_id == user.id:
      return True
    return self.is_group_admin(db, user, meeting.group_id)

  def can_manage_mom(self, db: Session, user: User, meeting: Meeting) -> bool:
    return self.can_write_meeting(db, user, meeting)

  def can_read_mom(self, db: Session, user: User, mom: MOMRecord) -> bool:
    meeting = db.get(Meeting, mom.meeting_id)
    if not meeting:
      return False
    return self.can_read_meeting(db, user, meeting)

  def filter_group_ids(self, db: Session, user: User, group_ids: list[int]) -> list[int]:
    allowed = self.accessible_group_ids(db, user)
    if allowed is None:
      return group_ids
    return [gid for gid in group_ids if gid in allowed]

  def capabilities(self, db: Session, user: User) -> dict:
    is_super = self.is_super_admin(user)
    group_ids = self.accessible_group_ids(db, user)
    admin_groups = []
    if not is_super and group_ids:
      admin_groups = list(
        db.scalars(
          select(GroupMembership.group_id).where(
            GroupMembership.user_id == user.id,
            GroupMembership.group_id.in_(group_ids),
            GroupMembership.role.in_([MembershipRole.ADMIN, MembershipRole.ORGANIZER]),
          )
        ).all()
      )
    return {
      "platform_role": user.role.value,
      "is_super_admin": is_super,
      "accessible_group_ids": list(group_ids) if group_ids is not None else None,
      "admin_group_ids": admin_groups,
      "can_manage_users": is_super,
      "can_assign_superadmin": is_superadmin(user),
      "can_create_community": True,
      "can_create_meeting": is_super or bool(group_ids),
      "can_manage_mom": is_super or bool(admin_groups),
      "read_only": not is_super and not admin_groups,
    }
