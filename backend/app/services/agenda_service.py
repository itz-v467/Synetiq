from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.platform import AgendaItem


class AgendaService:
    def add_item(self, db: Session, payload: dict) -> AgendaItem:
        item = AgendaItem(**payload)
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    def list_for_meeting(self, db: Session, meeting_id: int) -> list[AgendaItem]:
        return list(
            db.scalars(
                select(AgendaItem)
                .where(AgendaItem.meeting_id == meeting_id, AgendaItem.deleted_at.is_(None))
                .order_by(AgendaItem.position.asc())
            ).all()
        )
