from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from backend.app.core.security import decode_token
from backend.app.websocket.manager import manager

router = APIRouter()


@router.websocket("/ws/meetings/{meeting_id}")
async def meeting_channel(websocket: WebSocket, meeting_id: int, token: str = Query(...)):
  try:
    payload = decode_token(token)
    if payload.get("type") != "access":
      await websocket.close(code=4401)
      return
  except ValueError:
    await websocket.close(code=4401)
    return

  await manager.connect(meeting_id, websocket)
  try:
    while True:
      message = await websocket.receive_json()
      await manager.broadcast(meeting_id, {"meeting_id": meeting_id, "event": "update", "data": message})
  except WebSocketDisconnect:
    manager.disconnect(meeting_id, websocket)
