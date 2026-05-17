from datetime import datetime, timezone
from typing import Any

from dobby_tools.base import Tool, ToolContext


class GetTimeTool(Tool):
    name = "get_time"
    description = "Get the current date and time in UTC."

    def get_parameters_schema(self) -> dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "timezone": {
                    "type": "string",
                    "description": "IANA timezone name (e.g. Europe/London). Defaults to UTC.",
                }
            },
            "required": [],
        }

    async def execute(self, arguments: dict[str, Any], context: ToolContext) -> str:
        tz_name = arguments.get("timezone")
        now = datetime.now(timezone.utc)
        if tz_name:
            try:
                from zoneinfo import ZoneInfo

                now = now.astimezone(ZoneInfo(str(tz_name)))
            except Exception:
                return f"Invalid timezone: {tz_name}"
        return now.strftime("%Y-%m-%d %H:%M:%S %Z")
