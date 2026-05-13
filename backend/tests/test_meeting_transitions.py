from backend.app.models.platform import MeetingStatus
from backend.app.services.meetings_service import _ALLOWED_TRANSITIONS


def test_status_transitions_matrix():
    assert MeetingStatus.PUBLISHED in _ALLOWED_TRANSITIONS[MeetingStatus.DRAFT]
    assert MeetingStatus.LIVE in _ALLOWED_TRANSITIONS[MeetingStatus.PUBLISHED]
    assert MeetingStatus.ENDED in _ALLOWED_TRANSITIONS[MeetingStatus.LIVE]
    assert MeetingStatus.ARCHIVED in _ALLOWED_TRANSITIONS[MeetingStatus.ENDED]
