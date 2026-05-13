from collections import defaultdict

from fastapi import WebSocket


class MeetingConnectionManager:
    def __init__(self) -> None:
        self.connections: dict[int, list[WebSocket]] = defaultdict(list)

    async def connect(self, meeting_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections[meeting_id].append(websocket)

    def disconnect(self, meeting_id: int, websocket: WebSocket) -> None:
        sockets = self.connections.get(meeting_id, [])
        if websocket in sockets:
            sockets.remove(websocket)

    async def broadcast(self, meeting_id: int, payload: dict) -> None:
        for socket in list(self.connections.get(meeting_id, [])):
            await socket.send_json(payload)


manager = MeetingConnectionManager()
