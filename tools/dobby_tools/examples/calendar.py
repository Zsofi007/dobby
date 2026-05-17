from typing import Any

from dobby_tools.base import Tool, ToolContext


class MockCalendarTool(Tool):
    name = "mock_calendar"
    description = "List mock calendar events for today (demo tool)."

    def get_parameters_schema(self) -> dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "date": {
                    "type": "string",
                    "description": "Date in YYYY-MM-DD format. Defaults to today.",
                }
            },
            "required": [],
        }

    async def execute(self, arguments: dict[str, Any], context: ToolContext) -> str:
        date = arguments.get("date", "today")
        events = [
            {"time": "09:00", "title": "Standup", "location": "Zoom"},
            {"time": "14:00", "title": "Deep work block", "location": "Office"},
            {"time": "17:30", "title": "Gym", "location": "Local gym"},
        ]
        lines = [f"Mock calendar for {date}:"]
        for e in events:
            lines.append(f"- {e['time']}: {e['title']} @ {e['location']}")
        return "\n".join(lines)
