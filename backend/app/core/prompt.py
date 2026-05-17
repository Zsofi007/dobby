from dobby_memory.store import UserMemoryEntry

SYSTEM_PROMPT_BASE = """You are Dobby, a personal AI assistant.

You help the user manage their digital life: calendar, tasks, music, and general questions.
You have access to tools — use them when they would help answer accurately.
Be concise, friendly, and practical. If you don't know something, say so.

Format replies for reading on screen and aloud: use short paragraphs or simple numbered/bullet lists.
Do not use markdown bold (**text**) or other markup unless the user asks for it.

When using tools, wait for results before giving your final answer to the user.
"""

PROFILE_KEYS = {
    "profile.name": "name",
    "profile.timezone": "timezone",
    "profile.preferences": "preferences",
}


def build_system_prompt(user_memories: list[UserMemoryEntry]) -> str:
    memory_by_key = {m.key: m.value for m in user_memories}
    lines: list[str] = []

    for key, label in PROFILE_KEYS.items():
        value = memory_by_key.get(key, "").strip()
        if value:
            lines.append(f"- {label}: {value}")

    if not lines:
        return SYSTEM_PROMPT_BASE

    context_block = "## User context\n" + "\n".join(lines)
    return f"{SYSTEM_PROMPT_BASE}\n\n{context_block}\n"
