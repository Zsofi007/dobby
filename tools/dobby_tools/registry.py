from typing import Any

from dobby_tools.base import Tool, ToolContext
from dobby_tools.examples.calendar import MockCalendarTool
from dobby_tools.examples.spotify import MockSpotifyTool
from dobby_tools.examples.time_tool import GetTimeTool


class ToolRegistry:
    """Registry for pluggable tools."""

    def __init__(self) -> None:
        self._tools: dict[str, Tool] = {}

    def register(self, tool: Tool) -> None:
        if tool.name in self._tools:
            raise ValueError(f"Tool already registered: {tool.name}")
        self._tools[tool.name] = tool

    def get(self, name: str) -> Tool | None:
        return self._tools.get(name)

    def list_tools(self) -> list[Tool]:
        return list(self._tools.values())

    def to_openai_tools(self) -> list[dict[str, Any]]:
        return [t.to_openai_tool() for t in self._tools.values()]

    async def execute(
        self,
        name: str,
        arguments: dict[str, Any],
        context: ToolContext | None = None,
    ) -> str:
        tool = self.get(name)
        if tool is None:
            return f"Error: unknown tool '{name}'"
        ctx = context or ToolContext()
        try:
            return await tool.execute(arguments, ctx)
        except Exception as exc:
            return f"Error executing {name}: {exc}"


_default_registry: ToolRegistry | None = None


def get_default_registry() -> ToolRegistry:
    global _default_registry
    if _default_registry is None:
        registry = ToolRegistry()
        registry.register(GetTimeTool())
        registry.register(MockCalendarTool())
        registry.register(MockSpotifyTool())
        _default_registry = registry
    return _default_registry
