from fastapi import APIRouter

from app.api.routes import chat, health, memory, tools, voice, websocket

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(memory.router, prefix="/memory", tags=["memory"])
api_router.include_router(tools.router, prefix="/tools", tags=["tools"])
api_router.include_router(voice.router, prefix="/voice", tags=["voice"])
api_router.include_router(websocket.router, tags=["websocket"])
