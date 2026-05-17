from fastapi import APIRouter, Depends, HTTPException, Query

from app.deps import get_memory_store
from app.schemas import (
    GetMessagesResponse,
    MemoryEntryResponse,
    MessageResponse,
    SaveMemoryRequest,
)
from dobby_memory import PostgresMemoryStore

router = APIRouter()


@router.get("/messages/{conversation_id}", response_model=GetMessagesResponse)
async def get_messages(
    conversation_id: str,
    limit: int = Query(50, ge=1, le=200),
    memory: PostgresMemoryStore = Depends(get_memory_store),
) -> GetMessagesResponse:
    messages = await memory.get_recent_messages(conversation_id, limit=limit)
    return GetMessagesResponse(
        conversation_id=conversation_id,
        messages=[
            MessageResponse(
                id=m.id,
                role=m.role,
                content=m.content,
                created_at=m.created_at,
            )
            for m in messages
        ],
    )


@router.post("/user", response_model=MemoryEntryResponse)
async def save_user_memory(
    body: SaveMemoryRequest,
    memory: PostgresMemoryStore = Depends(get_memory_store),
) -> MemoryEntryResponse:
    entry = await memory.save_user_memory(body.key, body.value)
    return MemoryEntryResponse(key=entry.key, value=entry.value, updated_at=entry.updated_at)


@router.get("/user/{key}", response_model=MemoryEntryResponse)
async def get_user_memory(
    key: str,
    memory: PostgresMemoryStore = Depends(get_memory_store),
) -> MemoryEntryResponse:
    entry = await memory.get_user_memory(key)
    if entry is None:
        raise HTTPException(status_code=404, detail="Memory key not found")
    return MemoryEntryResponse(key=entry.key, value=entry.value, updated_at=entry.updated_at)


@router.get("/user", response_model=list[MemoryEntryResponse])
async def list_user_memories(
    memory: PostgresMemoryStore = Depends(get_memory_store),
) -> list[MemoryEntryResponse]:
    entries = await memory.list_user_memories()
    return [
        MemoryEntryResponse(key=e.key, value=e.value, updated_at=e.updated_at) for e in entries
    ]
