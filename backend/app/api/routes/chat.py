import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.core.agent import AgentService
from app.deps import get_agent_service, get_memory_store
from app.schemas import ConversationSummaryResponse
from dobby_memory import PostgresMemoryStore

router = APIRouter()


class ChatRequest(BaseModel):
    conversation_id: str | None = None
    content: str = Field(..., min_length=1)


class ChatResponse(BaseModel):
    conversation_id: str
    content: str


@router.get("/conversations", response_model=list[ConversationSummaryResponse])
async def list_conversations(
    limit: int = 50,
    memory: PostgresMemoryStore = Depends(get_memory_store),
) -> list[ConversationSummaryResponse]:
    conversations = await memory.list_conversations(limit=limit)
    return [
        ConversationSummaryResponse(id=c.id, title=c.title, updated_at=c.updated_at)
        for c in conversations
    ]


@router.post("/conversations", response_model=dict)
async def create_conversation(
    memory: PostgresMemoryStore = Depends(get_memory_store),
) -> dict:
    conv_id = await memory.create_conversation()
    return {"conversation_id": conv_id}


@router.post("", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    agent: AgentService = Depends(get_agent_service),
    memory: PostgresMemoryStore = Depends(get_memory_store),
) -> ChatResponse:
    conversation_id = body.conversation_id
    if not conversation_id:
        conversation_id = await memory.create_conversation()
    try:
        content = await agent.run_turn(conversation_id, body.content)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return ChatResponse(conversation_id=conversation_id, content=content)


@router.post("/stream")
async def chat_stream(
    body: ChatRequest,
    agent: AgentService = Depends(get_agent_service),
    memory: PostgresMemoryStore = Depends(get_memory_store),
):
    conversation_id = body.conversation_id
    if not conversation_id:
        conversation_id = await memory.create_conversation()

    async def event_generator() -> AsyncIterator[str]:
        events: list[dict] = []

        async def emit(event: dict) -> None:
            events.append(event)

        await agent.stream_simple(conversation_id, body.content, emit)
        for event in events:
            yield json.dumps(event) + "\n"

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")
