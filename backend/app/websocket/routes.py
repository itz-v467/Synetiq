from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.app.websocket.manager import manager

router = APIRouter()


@router.websocket("/ws/meetings/{meeting_id}")
async def meeting_channel(websocket: WebSocket, meeting_id: int):
    await manager.connect(meeting_id, websocket)
    try:
        while True:
            message = await websocket.receive_json()
            await manager.broadcast(meeting_id, {"meeting_id": meeting_id, "event": "update", "data": message})
    except WebSocketDisconnect:
        manager.disconnect(meeting_id, websocket)
