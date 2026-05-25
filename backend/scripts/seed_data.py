import sys
import os
from datetime import date, timedelta

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy.orm import Session
from backend.app.db.session import SessionLocal
from backend.app.models.user import User, UserRole
from backend.app.models.platform import Community, Group, CommunityMembership, GroupMembership, MembershipRole, Meeting, MeetingStatus

def seed():
    db = SessionLocal()
    try:
        # 1. Get or create Admin user
        admin = db.query(User).filter(User.role.in_([UserRole.SUPERADMIN, UserRole.ADMIN])).first()
        if not admin:
            print("No admin user found. Please register an admin user first.")
            return

        # 2. Create a Community
        core_comm = db.query(Community).filter(Community.name == "Core Engineering").first()
        if not core_comm:
            core_comm = Community(
                name="Core Engineering",
                slug="core-eng",
                description="The primary community for engineering excellence and platform governance.",
                created_by_id=admin.id
            )
            db.add(core_comm)
            db.flush()
            db.add(CommunityMembership(community_id=core_comm.id, user_id=admin.id, role=MembershipRole.ADMIN))
            print(f"Created Community: {core_comm.name}")

        # 3. Create Groups
        be_group = db.query(Group).filter(Group.name == "Backend Team", Group.community_id == core_comm.id).first()
        if not be_group:
            be_group = Group(
                community_id=core_comm.id,
                name="Backend Team",
                description="Focuses on FastAPI, SQLAlchemy, and AI pipeline orchestration.",
                created_by_id=admin.id
            )
            db.add(be_group)
            db.flush()
            db.add(GroupMembership(group_id=be_group.id, user_id=admin.id, role=MembershipRole.ORGANIZER))
            print(f"Created Group: {be_group.name}")

        fe_group = db.query(Group).filter(Group.name == "Design & Frontend", Group.community_id == core_comm.id).first()
        if not fe_group:
            fe_group = Group(
                community_id=core_comm.id,
                name="Design & Frontend",
                description="Focuses on Next.js, Tailwind CSS, and Premium UI/UX implementation.",
                created_by_id=admin.id
            )
            db.add(fe_group)
            db.flush()
            db.add(GroupMembership(group_id=fe_group.id, user_id=admin.id, role=MembershipRole.ORGANIZER))
            print(f"Created Group: {fe_group.name}")

        # 4. Create a Sample Meeting
        sample_meeting = db.query(Meeting).filter(Meeting.title == "Project Sync: Industrial Migration").first()
        if not sample_meeting:
            sample_meeting = Meeting(
                group_id=be_group.id,
                organizer_id=admin.id,
                title="Project Sync: Industrial Migration",
                description="Weekly sync to discuss the migration of the platform to the new industrial-grade architecture.",
                meeting_date=date.today(),
                start_time="10:00 AM",
                expected_duration_minutes=60,
                location="Main Conference Room / Google Meet",
                status=MeetingStatus.PUBLISHED
            )
            db.add(sample_meeting)
            print(f"Created Meeting: {sample_meeting.title}")

        db.commit()
        print("Seeding complete!")
    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
