from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.models.platform import ActionItem, ActionItemStatus, AttendanceRecord, Meeting, MeetingStatus, MOMRecord
from backend.app.models.user import User


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

    def dashboard_summary(self, db: Session, user_id: int) -> dict:
        today = date.today()
        # Meetings today in any group the user is part of
        from backend.app.models.platform import GroupMembership
        meetings_today = db.scalar(
            select(func.count(Meeting.id))
            .join(GroupMembership, GroupMembership.group_id == Meeting.group_id)
            .where(GroupMembership.user_id == user_id, Meeting.meeting_date == today)
        ) or 0
        
        pending_approvals = db.scalar(
            select(func.count(Meeting.id))
            .where(Meeting.organizer_id == user_id, Meeting.status == MeetingStatus.ENDED)
        ) or 0
        
        action_items_due = db.scalar(
            select(func.count(ActionItem.id))
            .where(ActionItem.assigned_to_id == user_id, ActionItem.status != ActionItemStatus.DONE)
        ) or 0
        
        # Calculate attendance rate for meetings the user was expected at
        attendance_records = db.scalar(select(func.count(AttendanceRecord.id)).where(AttendanceRecord.user_id == user_id)) or 0
        present_records = db.scalar(select(func.count(AttendanceRecord.id)).where(AttendanceRecord.user_id == user_id, AttendanceRecord.status == "PRESENT")) or 0
        attendance_rate = (present_records / attendance_records * 100) if attendance_records else 0
        
        return {
            "meetings_today": meetings_today,
            "pending_approvals": pending_approvals,
            "action_items_due": action_items_due,
            "attendance_rate": round(attendance_rate, 2),
        }

    def dashboard_insights(self, db: Session, user: User) -> list[str]:
        insights = []
        
        # 1. Welcome insight
        insights.append(f"Institutional memory is active. Welcome back, {user.full_name.split()[0]}!")
        
        # 2. Meetings volume insight
        total_meetings = db.scalar(select(func.count(Meeting.id)).where(Meeting.organizer_id == user.id)) or 0
        if total_meetings > 0:
            insights.append(f"You have organized {total_meetings} total meetings across your groups.")
        else:
            insights.append("Start by scheduling your first meeting in a community group.")
            
        # 3. Action items insight
        pending_actions = db.scalar(select(func.count(ActionItem.id)).where(ActionItem.assigned_to_id == user.id, ActionItem.status != ActionItemStatus.DONE)) or 0
        if pending_actions > 0:
            insights.append(f"You have {pending_actions} action items requiring attention.")
        else:
            insights.append("All your action items are cleared. Great job!")
            
        # 4. MOM status insight
        moms_to_publish = db.scalar(select(func.count(MOMRecord.id)).join(Meeting).where(Meeting.organizer_id == user.id, MOMRecord.is_published == False)) or 0
        if moms_to_publish > 0:
            insights.append(f"You have {moms_to_publish} meeting minutes waiting for review and publication.")
            
        return insights
