import json
from collections.abc import AsyncIterator
from typing import Any

from openai import AsyncOpenAI

from app.config import Settings


class LLMService:
    """OpenAI-compatible LLM wrapper — swap provider via settings."""

    def __init__(self, settings: Settings) -> None:
        kwargs: dict[str, Any] = {"api_key": settings.openai_api_key or "not-set"}
        if settings.openai_base_url:
            kwargs["base_url"] = settings.openai_base_url
        self._client = AsyncOpenAI(**kwargs)
        self._model = settings.openai_model
        self._has_key = bool(settings.openai_api_key)

    @property
    def is_configured(self) -> bool:
        return self._has_key

    async def chat_completion(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        if not self._has_key:
            return self._mock_completion(messages)

        kwargs: dict[str, Any] = {
            "model": self._model,
            "messages": messages,
        }
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"

        response = await self._client.chat.completions.create(**kwargs)
        choice = response.choices[0]
        message = choice.message

        result: dict[str, Any] = {
            "role": "assistant",
            "content": message.content or "",
        }
        if message.tool_calls:
            result["tool_calls"] = [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments,
                    },
                }
                for tc in message.tool_calls
            ]
        return result

    async def stream_completion(
        self,
        messages: list[dict[str, Any]],
    ) -> AsyncIterator[str]:
        if not self._has_key:
            text = self._mock_completion(messages).get("content", "")
            for word in text.split():
                yield word + " "
            return

        stream = await self._client.chat.completions.create(
            model=self._model,
            messages=messages,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content

    def _mock_completion(self, messages: list[dict[str, Any]]) -> dict[str, Any]:
        last_user = next(
            (m["content"] for m in reversed(messages) if m.get("role") == "user"),
            "",
        )
        return {
            "role": "assistant",
            "content": (
                f"[Dobby mock mode — set OPENAI_API_KEY for live responses]\n\n"
                f"You said: {last_user}\n\n"
                f"I can help with time, calendar (mock), and Spotify (mock) when tools are enabled."
            ),
        }

    @staticmethod
    def parse_tool_arguments(raw: str) -> dict[str, Any]:
        try:
            return json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            return {}
