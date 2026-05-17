from fastapi import APIRouter, Depends

from app.deps import get_tool_registry
from app.schemas import ToolDefinitionResponse
from dobby_tools import ToolRegistry

router = APIRouter()


@router.get("", response_model=list[ToolDefinitionResponse])
async def list_tools(registry: ToolRegistry = Depends(get_tool_registry)) -> list[ToolDefinitionResponse]:
    return [
        ToolDefinitionResponse(
            name=t.name,
            description=t.description,
            parameters=t.get_parameters_schema(),
        )
        for t in registry.list_tools()
    ]
