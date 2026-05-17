from typing import Any, Awaitable, Callable

from dobby_memory import PostgresMemoryStore
from dobby_tools import ToolRegistry
from dobby_tools.base import ToolContext

from app.config import Settings
from app.core.llm import LLMService
from app.core.prompt import build_system_prompt


EventEmitter = Callable[[dict[str, Any]], Awaitable[None]]


class AgentService:
    """Single-agent loop: LLM → tool calls → streamed response."""

    def __init__(
        self,
        llm: LLMService,
        memory: PostgresMemoryStore,
        tools: ToolRegistry,
        settings: Settings,
    ) -> None:
        self._llm = llm
        self._memory = memory
        self._tools = tools
        self._settings = settings

    async def run_turn(
        self,
        conversation_id: str,
        user_content: str,
        *,
        user_id: str = "default",
        emit: EventEmitter | None = None,
    ) -> str:
        await self._memory.save_message(conversation_id, "user", user_content, user_id=user_id)
        await self._memory.ensure_conversation_title(conversation_id, user_content)

        history = await self._memory.get_recent_messages(
            conversation_id, limit=self._settings.conversation_message_limit
        )
        user_memories = await self._memory.list_user_memories(user_id=user_id)
        messages = self._build_messages(history, user_memories)
        openai_tools_list = self._tools.to_openai_tools()

        full_response = ""
        for _ in range(self._settings.max_tool_iterations):
            completion = await self._llm.chat_completion(messages, tools=openai_tools_list)
            tool_calls = completion.get("tool_calls")

            if not tool_calls:
                full_response = completion.get("content", "")
                if emit and full_response:
                    await self._stream_text(full_response, emit)
                break

            # Assistant message with tool calls
            messages.append(
                {
                    "role": "assistant",
                    "content": completion.get("content") or None,
                    "tool_calls": tool_calls,
                }
            )

            for tc in tool_calls:
                fn = tc["function"]
                name = fn["name"]
                args = self._llm.parse_tool_arguments(fn.get("arguments", "{}"))
                if emit:
                    await emit(
                        {
                            "type": "tool_call",
                            "call": {"id": tc["id"], "name": name, "arguments": args},
                        }
                    )
                result = await self._tools.execute(
                    name,
                    args,
                    ToolContext(user_id=user_id, conversation_id=conversation_id),
                )
                if emit:
                    await emit(
                        {
                            "type": "tool_result",
                            "result": {
                                "tool_call_id": tc["id"],
                                "name": name,
                                "content": result,
                            },
                        }
                    )
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": result,
                    }
                )
        else:
            full_response = "I reached the maximum number of tool steps. Please try again."
            if emit:
                await self._stream_text(full_response, emit)

        if full_response:
            stored = await self._memory.save_message(
                conversation_id, "assistant", full_response, user_id=user_id
            )
            if emit:
                await emit({"type": "done", "message_id": stored.id})

        return full_response

    def _build_messages(
        self, history: list, user_memories: list | None = None
    ) -> list[dict[str, Any]]:
        system_prompt = build_system_prompt(user_memories or [])
        messages: list[dict[str, Any]] = [{"role": "system", "content": system_prompt}]
        for msg in history:
            if msg.role in ("user", "assistant"):
                messages.append({"role": msg.role, "content": msg.content})
        return messages

    async def _stream_text(self, text: str, emit: EventEmitter) -> None:
        chunk_size = 12
        for i in range(0, len(text), chunk_size):
            await emit({"type": "token", "content": text[i : i + chunk_size]})

    async def stream_simple(
        self,
        conversation_id: str,
        user_content: str,
        emit: EventEmitter,
        *,
        user_id: str = "default",
    ) -> None:
        """WebSocket-friendly entry: runs agent and emits events."""
        try:
            await self.run_turn(
                conversation_id,
                user_content,
                user_id=user_id,
                emit=emit,
            )
        except Exception as exc:
            await emit({"type": "error", "message": str(exc)})
