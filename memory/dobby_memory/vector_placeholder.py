from typing import Any

from dobby_memory.store import VectorMemoryStore


class NoOpVectorMemoryStore(VectorMemoryStore):
    """Placeholder until a vector DB is added."""

    async def embed_and_store(self, text: str, metadata: dict[str, Any]) -> str:
        raise NotImplementedError("Vector memory is not enabled yet.")

    async def similarity_search(self, query: str, limit: int = 5) -> list[dict[str, Any]]:
        raise NotImplementedError("Vector memory is not enabled yet.")
