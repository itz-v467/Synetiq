"""Platform-level role helpers (distinct from community/group membership roles)."""

from backend.app.models.user import User, UserRole

# Full platform access — unrestricted meetings, communities, analytics
PLATFORM_SUPER_ROLES: frozenset[UserRole] = frozenset({UserRole.SUPERADMIN, UserRole.ADMIN})

# Can manage users and assign roles below SUPERADMIN
PLATFORM_ADMIN_ROLES: frozenset[UserRole] = frozenset({UserRole.SUPERADMIN, UserRole.ADMIN})


def is_platform_super(user: User) -> bool:
    return user.role in PLATFORM_SUPER_ROLES


def is_superadmin(user: User) -> bool:
    return user.role == UserRole.SUPERADMIN


def can_assign_role(actor: User, target_role: UserRole) -> bool:
    if target_role == UserRole.SUPERADMIN:
        return is_superadmin(actor)
    if actor.role in PLATFORM_ADMIN_ROLES:
        return True
    return False
