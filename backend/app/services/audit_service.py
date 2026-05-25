from sqlalchemy.orm import Session

from backend.app.models.platform import AuditLog


class AuditService:
  def log(
    self,
    db: Session,
    *,
    actor_id: int | None,
    action: str,
    resource_type: str,
    resource_id: int | None = None,
    details: dict | None = None,
  ) -> AuditLog:
    row = AuditLog(
      actor_id=actor_id,
      action=action,
      resource_type=resource_type,
      resource_id=resource_id,
      details=details or {},
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
