import json
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.deps import get_agent_service, get_memory_store

router = APIRouter()


@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket) -> None:
    agent = get_agent_service()
    memory = get_memory_store()
    await websocket.accept()
    conversation_id: str | None = None

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data: dict[str, Any] = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON"})
                continue

            event_type = data.get("type")

            if event_type == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            if event_type != "chat":
                await websocket.send_json({"type": "error", "message": f"Unknown event: {event_type}"})
                continue

            content = (data.get("content") or "").strip()
            if not content:
                await websocket.send_json({"type": "error", "message": "Empty message"})
                continue

            conversation_id = data.get("conversation_id") or conversation_id
            if not conversation_id:
                conversation_id = await memory.create_conversation()
                await websocket.send_json(
                    {"type": "conversation", "conversation_id": conversation_id}
                )

            async def emit(event: dict[str, Any]) -> None:
                await websocket.send_json(event)

            await agent.stream_simple(conversation_id, content, emit)

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        try:
            await websocket.send_json({"type": "error", "message": str(exc)})
        except Exception:
            pass
