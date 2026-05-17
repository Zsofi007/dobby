from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel


class StoredMessage(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: str


class UserMemoryEntry(BaseModel):
    key: str
    value: str
    user_id: str
    updated_at: str


class ConversationSummary(BaseModel):
    id: str
    title: str | None
    updated_at: str


class MemoryStore(ABC):
    """Abstract memory store — swap implementations without changing callers."""

    @abstractmethod
    async def connect(self) -> None: ...

    @abstractmethod
    async def disconnect(self) -> None: ...

    @abstractmethod
    async def create_conversation(self, user_id: str = "default") -> str: ...

    @abstractmethod
    async def list_conversations(
        self, *, user_id: str = "default", limit: int = 50
    ) -> list[ConversationSummary]: ...

    @abstractmethod
    async def update_conversation_title(self, conversation_id: str, title: str) -> None: ...

    @abstractmethod
    async def ensure_conversation_title(self, conversation_id: str, content: str) -> None: ...

    @abstractmethod
    async def save_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        *,
        user_id: str = "default",
    ) -> StoredMessage: ...

    @abstractmethod
    async def get_recent_messages(
        self,
        conversation_id: str,
        limit: int = 50,
    ) -> list[StoredMessage]: ...

    @abstractmethod
    async def save_user_memory(
        self,
        key: str,
        value: str,
        *,
        user_id: str = "default",
    ) -> UserMemoryEntry: ...

    @abstractmethod
    async def get_user_memory(
        self, key: str, *, user_id: str = "default"
    ) -> UserMemoryEntry | None: ...

    @abstractmethod
    async def list_user_memories(
        self, *, user_id: str = "default"
    ) -> list[UserMemoryEntry]: ...


class VectorMemoryStore(ABC):
    """Placeholder for future vector / semantic memory."""

    @abstractmethod
    async def embed_and_store(self, text: str, metadata: dict[str, Any]) -> str: ...

    @abstractmethod
    async def similarity_search(self, query: str, limit: int = 5) -> list[dict[str, Any]]: ...
