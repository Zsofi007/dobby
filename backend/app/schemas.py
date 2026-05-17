from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str


class SaveMemoryRequest(BaseModel):
    key: str = Field(..., min_length=1, max_length=255)
    value: str


class MemoryEntryResponse(BaseModel):
    key: str
    value: str
    updated_at: str


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: str


class GetMessagesResponse(BaseModel):
    conversation_id: str
    messages: list[MessageResponse]


class CreateConversationResponse(BaseModel):
    conversation_id: str


class ConversationSummaryResponse(BaseModel):
    id: str
    title: str | None
    updated_at: str


class ToolDefinitionResponse(BaseModel):
    name: str
    description: str
    parameters: dict
