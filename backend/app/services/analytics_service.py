from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.models.platform import ActionItem, ActionItemStatus, AttendanceRecord, Meeting, MeetingStatus


class AnalyticsService:
    def organizer_summary(self, db: Session, organizer_id: int) -> dict:
        total_meetings = db.scalar(select(func.count(Meeting.id)).where(Meeting.organizer_id == organizer_id)) or 0
        completed_actions = db.scalar(
            select(func.count(ActionItem.id)).where(ActionItem.assigned_to_id == organizer_id, ActionItem.status == ActionItemStatus.DONE)
        ) or 0
        total_actions = db.scalar(select(func.count(ActionItem.id)).where(ActionItem.assigned_to_id == organizer_id)) or 0
        attendance_records = db.scalar(select(func.count(AttendanceRecord.id))) or 0
        present_records = db.scalar(select(func.count(AttendanceRecord.id)).where(AttendanceRecord.status == "PRESENT")) or 0
        attendance_rate = (present_records / attendance_records * 100) if attendance_records else 0
        completion_rate = (completed_actions / total_actions * 100) if total_actions else 0
        return {
            "date": str(date.today()),
            "total_meetings": total_meetings,
            "action_completion_rate": round(completion_rate, 2),
            "attendance_rate": round(attendance_rate, 2),
        }

    def platform_summary(self, db: Session) -> dict:
        total_meetings = db.scalar(select(func.count(Meeting.id))) or 0
        live_meetings = db.scalar(select(func.count(Meeting.id)).where(Meeting.status == MeetingStatus.LIVE)) or 0
        return {"total_meetings": total_meetings, "live_meetings": live_meetings}
