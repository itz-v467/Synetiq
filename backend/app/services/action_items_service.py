from sqlalchemy.orm import Session

from backend.app.models.platform import ActionItem, ActionItemAudit


class ActionItemsService:
    def create_item(self, db: Session, payload: dict) -> ActionItem:
        item = ActionItem(**payload)
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    def update_status(self, db: Session, item: ActionItem, status, actor_id: int) -> ActionItem:
        old_status = item.status
        item.status = status
        db.add(ActionItemAudit(action_item_id=item.id, from_status=old_status, to_status=status, changed_by_id=actor_id))
        db.commit()
        db.refresh(item)
        return item
