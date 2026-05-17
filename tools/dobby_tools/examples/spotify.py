from typing import Any

from dobby_tools.base import Tool, ToolContext


class MockSpotifyTool(Tool):
    name = "mock_spotify"
    description = "Control mock Spotify playback (demo tool — play, pause, now playing)."

    def get_parameters_schema(self) -> dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["play", "pause", "now_playing"],
                    "description": "Action to perform.",
                },
                "query": {
                    "type": "string",
                    "description": "Search query when action is play.",
                },
            },
            "required": ["action"],
        }

    async def execute(self, arguments: dict[str, Any], context: ToolContext) -> str:
        action = arguments.get("action", "now_playing")
        if action == "play":
            query = arguments.get("query", "lo-fi beats")
            return f"Mock Spotify: now playing '{query}'"
        if action == "pause":
            return "Mock Spotify: playback paused."
        return "Mock Spotify: now playing 'Weightless' by Marconi Union"
