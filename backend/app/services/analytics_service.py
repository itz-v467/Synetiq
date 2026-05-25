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
        
        from backend.app.models.platform import Community, Group, ActionItem
        from backend.app.models.user import User as UserModel
        
        total_communities = db.scalar(select(func.count(Community.id)).where(Community.deleted_at.is_(None))) or 0
        total_groups = db.scalar(select(func.count(Group.id)).where(Group.deleted_at.is_(None))) or 0
        total_users = db.scalar(select(func.count(UserModel.id)).where(UserModel.is_active == True)) or 0
        
        total_actions = db.scalar(select(func.count(ActionItem.id))) or 0
        completed_actions = db.scalar(
            select(func.count(ActionItem.id)).where(ActionItem.status == ActionItemStatus.DONE)
        ) or 0
        action_completion_rate = (completed_actions / total_actions * 100) if total_actions else 0
        pending_actions = total_actions - completed_actions
        
        ended_meetings = db.scalar(select(func.count(Meeting.id)).where(Meeting.status == MeetingStatus.ENDED)) or 0
        
        return {
            "total_meetings": total_meetings,
            "live_meetings": live_meetings,
            "ended_meetings": ended_meetings,
            "total_communities": total_communities,
            "total_groups": total_groups,
            "total_users": total_users,
            "total_action_items": total_actions,
            "completed_action_items": completed_actions,
            "pending_action_items": pending_actions,
            "action_completion_rate": round(action_completion_rate, 2),
        }

    def dashboard_summary(self, db: Session, user_id: int) -> dict:
        today = date.today()
        from backend.app.models.platform import GroupMembership, Community, Group
        
        # Meetings today globally or for this user (we will provide global stats to simulate dashboard view for now, or user-specific if preferred)
        meetings_today = db.scalar(
            select(func.count(Meeting.id)).where(Meeting.meeting_date == today)
        ) or 0
        
        total_meetings = db.scalar(select(func.count(Meeting.id))) or 0
        live_meetings = db.scalar(select(func.count(Meeting.id)).where(Meeting.status == MeetingStatus.LIVE)) or 0
        
        total_communities = db.scalar(select(func.count(Community.id)).where(Community.deleted_at.is_(None))) or 0
        total_groups = db.scalar(select(func.count(Group.id)).where(Group.deleted_at.is_(None))) or 0
        
        return {
            "meetings_today": meetings_today,
            "total_meetings": total_meetings,
            "live_meetings": live_meetings,
            "total_communities": total_communities,

            "total_groups": total_groups,
        }

    def scope_meetings(self, db: Session, group_ids: list[int] | None) -> dict:
        stmt_total = select(func.count(Meeting.id))
        if group_ids is not None:
            stmt_total = stmt_total.where(Meeting.group_id.in_(group_ids))
        total = db.scalar(stmt_total) or 0
        stmt_up = select(func.count(Meeting.id)).where(
            Meeting.meeting_date >= date.today(),
            Meeting.status.in_([MeetingStatus.DRAFT, MeetingStatus.PUBLISHED]),
        )
        if group_ids is not None:
            stmt_up = stmt_up.where(Meeting.group_id.in_(group_ids))
        upcoming = db.scalar(stmt_up) or 0
        stmt_done = select(func.count(Meeting.id)).where(Meeting.status == MeetingStatus.ENDED)
        if group_ids is not None:
            stmt_done = stmt_done.where(Meeting.group_id.in_(group_ids))
        completed = db.scalar(stmt_done) or 0
        stmt_live = select(func.count(Meeting.id)).where(Meeting.status == MeetingStatus.LIVE)
        if group_ids is not None:
            stmt_live = stmt_live.where(Meeting.group_id.in_(group_ids))
        live = db.scalar(stmt_live) or 0
        return {"total_meetings": total, "upcoming_meetings": upcoming, "completed_meetings": completed, "live_meetings": live}

    def community_dashboard(self, db: Session, community_id: int) -> dict:
        from backend.app.models.platform import Group

        group_ids = list(db.scalars(select(Group.id).where(Group.community_id == community_id, Group.deleted_at.is_(None))).all())
        from backend.app.models.platform import CommunityMembership

        stats = self.scope_meetings(db, group_ids)
        member_count = db.scalar(
            select(func.count(CommunityMembership.id)).where(CommunityMembership.community_id == community_id)
        ) or 0
        return {**stats, "member_count": member_count, "group_count": len(group_ids)}

    def group_dashboard(self, db: Session, group_id: int) -> dict:
        from backend.app.models.platform import GroupMembership

        stats = self.scope_meetings(db, [group_id])
        member_count = db.scalar(select(func.count(GroupMembership.id)).where(GroupMembership.group_id == group_id)) or 0
        return {**stats, "member_count": member_count}
