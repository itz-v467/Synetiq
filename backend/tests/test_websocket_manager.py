from backend.app.websocket.manager import MeetingConnectionManager


def test_manager_initial_state():
    manager = MeetingConnectionManager()
    assert manager.connections == {}
