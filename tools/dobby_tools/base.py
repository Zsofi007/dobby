from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

from pydantic import BaseModel


@dataclass
class ToolContext:
    """Runtime context passed to tools during execution."""

    user_id: str = "default"
    conversation_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


class Tool(ABC):
    """Base class for all Dobby tools."""

    name: str
    description: str

    @abstractmethod
    def get_parameters_schema(self) -> dict[str, Any]:
        """Return JSON-schema style parameters for the LLM."""

    @abstractmethod
    async def execute(self, arguments: dict[str, Any], context: ToolContext) -> str:
        """Run the tool and return a string result for the model."""

    def to_openai_tool(self) -> dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.get_parameters_schema(),
            },
        }


class ToolInput(BaseModel):
    """Optional Pydantic base for tool argument validation."""

    model_config = {"extra": "forbid"}
