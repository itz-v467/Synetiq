from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.auth.dependencies import get_current_user, require_platform_admin
from backend.app.domain.rbac.platform_roles import can_assign_role, is_superadmin
from backend.app.core.config import get_settings
from backend.app.core.security import create_token, hash_password, verify_password
from backend.app.db.session import get_db
from backend.app.models.user import User, UserRole
from backend.app.domain.rbac.policies import RBACService
from backend.app.schemas.auth import (
    LoginRequest,
    ProfileUpdateRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserMeResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user = User(full_name=payload.full_name, email=payload.email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return _issue_tokens(str(user.id))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is inactive")
    return _issue_tokens(str(user.id))


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest):
    from backend.app.core.security import decode_token

    token_payload = decode_token(payload.refresh_token)
    if token_payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    return _issue_tokens(str(token_payload["sub"]))


def _user_me(current_user: User, db: Session) -> UserMeResponse:
    caps = RBACService().capabilities(db, current_user)
    return UserMeResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        language_preference=current_user.language_preference,
        capabilities=caps,
    )


@router.get("/me", response_model=UserMeResponse)
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _user_me(current_user, db)


@router.patch("/me", response_model=UserMeResponse)
def update_me(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return _user_me(current_user, db)


@router.get("/users", response_model=list[UserResponse])
def list_users(_: User = Depends(require_platform_admin()), db: Session = Depends(get_db)):
    return db.scalars(select(User).order_by(User.id)).all()


@router.patch("/users/{user_id}/role", response_model=UserResponse)
def update_role(
    user_id: int,
    role: UserRole,
    current_user: User = Depends(require_platform_admin()),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == UserRole.SUPERADMIN and not is_superadmin(current_user):
        raise HTTPException(status_code=403, detail="Only superadmin can modify another superadmin")
    if not can_assign_role(current_user, role):
        raise HTTPException(status_code=403, detail="Insufficient role to assign this role")
    user.role = role
    db.commit()
    db.refresh(user)
    return user


def _issue_tokens(subject: str) -> TokenResponse:
    settings = get_settings()
    access_token = create_token(subject, timedelta(minutes=settings.access_token_expire_minutes), "access")
    refresh_token = create_token(subject, timedelta(days=settings.refresh_token_expire_days), "refresh")
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)
