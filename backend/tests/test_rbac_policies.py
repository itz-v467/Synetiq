from backend.app.domain.rbac.platform_roles import can_assign_role, is_platform_super, is_superadmin
from backend.app.domain.rbac.policies import RBACService
from backend.app.models.user import User, UserRole


def test_superadmin_is_super_admin():
    user = User(id=1, full_name="S", email="s@t.com", password_hash="x", role=UserRole.SUPERADMIN, is_active=True)
    assert RBACService().is_super_admin(user)
    assert is_superadmin(user)
    assert is_platform_super(user)


def test_admin_is_platform_super():
    admin = User(id=2, full_name="A", email="a@t.com", password_hash="x", role=UserRole.ADMIN, is_active=True)
    assert RBACService().is_super_admin(admin)
    assert is_platform_super(admin)
    assert not is_superadmin(admin)


def test_participant_not_super_admin():
    user = User(id=3, full_name="U", email="u@t.com", password_hash="x", role=UserRole.PARTICIPANT, is_active=True)
    assert not RBACService().is_super_admin(user)


def test_only_superadmin_assigns_superadmin():
    superadmin = User(id=1, full_name="S", email="s@t.com", password_hash="x", role=UserRole.SUPERADMIN, is_active=True)
    admin = User(id=2, full_name="A", email="a@t.com", password_hash="x", role=UserRole.ADMIN, is_active=True)
    assert can_assign_role(superadmin, UserRole.SUPERADMIN)
    assert not can_assign_role(admin, UserRole.SUPERADMIN)
    assert can_assign_role(admin, UserRole.ADMIN)
