from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from dobby_memory.models import Base, ConversationModel, MessageModel, UserMemoryModel
from dobby_memory.store import (
    ConversationSummary,
    MemoryStore,
    StoredMessage,
    UserMemoryEntry,
)


def _iso(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


class PostgresMemoryStore(MemoryStore):
    def __init__(self, database_url: str) -> None:
        self._engine = create_async_engine(database_url, echo=False)
        self._session_factory = async_sessionmaker(
            self._engine, class_=AsyncSession, expire_on_commit=False
        )

    async def connect(self) -> None:
        async with self._engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def disconnect(self) -> None:
        await self._engine.dispose()

    async def create_conversation(self, user_id: str = "default") -> str:
        conv_id = str(uuid4())
        async with self._session_factory() as session:
            session.add(ConversationModel(id=conv_id, user_id=user_id))
            await session.commit()
        return conv_id

    async def list_conversations(
        self, *, user_id: str = "default", limit: int = 50
    ) -> list[ConversationSummary]:
        async with self._session_factory() as session:
            stmt = (
                select(ConversationModel)
                .where(ConversationModel.user_id == user_id)
                .order_by(ConversationModel.updated_at.desc())
                .limit(limit)
            )
            rows = (await session.execute(stmt)).scalars().all()
            return [
                ConversationSummary(
                    id=r.id,
                    title=r.title,
                    updated_at=_iso(r.updated_at),
                )
                for r in rows
            ]

    async def update_conversation_title(self, conversation_id: str, title: str) -> None:
        async with self._session_factory() as session:
            conv = await session.get(ConversationModel, conversation_id)
            if conv is None:
                return
            conv.title = title[:255]
            conv.updated_at = datetime.now(timezone.utc)
            await session.commit()

    async def ensure_conversation_title(self, conversation_id: str, content: str) -> None:
        text = content.strip().replace("\n", " ")
        if not text:
            return
        title = text[:50] + ("…" if len(text) > 50 else "")
        async with self._session_factory() as session:
            conv = await session.get(ConversationModel, conversation_id)
            if conv is None or conv.title:
                return
            conv.title = title
            conv.updated_at = datetime.now(timezone.utc)
            await session.commit()

    async def _touch_conversation(self, session: AsyncSession, conversation_id: str) -> None:
        conv = await session.get(ConversationModel, conversation_id)
        if conv is not None:
            conv.updated_at = datetime.now(timezone.utc)

    async def save_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        *,
        user_id: str = "default",
    ) -> StoredMessage:
        msg_id = str(uuid4())
        async with self._session_factory() as session:
            session.add(
                MessageModel(
                    id=msg_id,
                    conversation_id=conversation_id,
                    user_id=user_id,
                    role=role,
                    content=content,
                )
            )
            await self._touch_conversation(session, conversation_id)
            await session.commit()
            result = await session.get(MessageModel, msg_id)
            assert result is not None
            return StoredMessage(
                id=result.id,
                conversation_id=result.conversation_id,
                role=result.role,
                content=result.content,
                created_at=_iso(result.created_at),
            )

    async def get_recent_messages(
        self,
        conversation_id: str,
        limit: int = 50,
    ) -> list[StoredMessage]:
        async with self._session_factory() as session:
            stmt = (
                select(MessageModel)
                .where(MessageModel.conversation_id == conversation_id)
                .order_by(MessageModel.created_at.desc())
                .limit(limit)
            )
            rows = (await session.execute(stmt)).scalars().all()
            rows = list(reversed(rows))
            return [
                StoredMessage(
                    id=r.id,
                    conversation_id=r.conversation_id,
                    role=r.role,
                    content=r.content,
                    created_at=_iso(r.created_at),
                )
                for r in rows
            ]

    async def save_user_memory(
        self,
        key: str,
        value: str,
        *,
        user_id: str = "default",
    ) -> UserMemoryEntry:
        async with self._session_factory() as session:
            stmt = select(UserMemoryModel).where(
                UserMemoryModel.user_id == user_id,
                UserMemoryModel.key == key,
            )
            existing = (await session.execute(stmt)).scalar_one_or_none()
            if existing:
                existing.value = value
                existing.updated_at = datetime.now(timezone.utc)
                await session.commit()
                await session.refresh(existing)
                row = existing
            else:
                row = UserMemoryModel(id=str(uuid4()), user_id=user_id, key=key, value=value)
                session.add(row)
                await session.commit()
                await session.refresh(row)
            return UserMemoryEntry(
                key=row.key,
                value=row.value,
                user_id=row.user_id,
                updated_at=_iso(row.updated_at),
            )

    async def get_user_memory(
        self, key: str, *, user_id: str = "default"
    ) -> UserMemoryEntry | None:
        async with self._session_factory() as session:
            stmt = select(UserMemoryModel).where(
                UserMemoryModel.user_id == user_id,
                UserMemoryModel.key == key,
            )
            row = (await session.execute(stmt)).scalar_one_or_none()
            if row is None:
                return None
            return UserMemoryEntry(
                key=row.key,
                value=row.value,
                user_id=row.user_id,
                updated_at=_iso(row.updated_at),
            )

    async def list_user_memories(self, *, user_id: str = "default") -> list[UserMemoryEntry]:
        async with self._session_factory() as session:
            stmt = select(UserMemoryModel).where(UserMemoryModel.user_id == user_id)
            rows = (await session.execute(stmt)).scalars().all()
            return [
                UserMemoryEntry(
                    key=r.key,
                    value=r.value,
                    user_id=r.user_id,
                    updated_at=_iso(r.updated_at),
                )
                for r in rows
            ]
