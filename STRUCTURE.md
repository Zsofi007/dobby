# Dobby — complete folder tree

```
dobby/
├── README.md
├── STRUCTURE.md
├── IDEA.md
├── package.json          # npm workspaces (shared, frontend)
├── package-lock.json
├── docker-compose.yml
├── .gitignore
│
├── shared/                          # @dobby/shared — TS contracts
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── messages.ts
│       ├── tools.ts
│       ├── api.ts
│       └── websocket.ts
│
├── tools/                           # dobby-tools — pluggable tools
│   ├── pyproject.toml
│   └── dobby_tools/
│       ├── __init__.py
│       ├── base.py
│       ├── registry.py
│       └── examples/
│           ├── time_tool.py
│           ├── calendar.py
│           └── spotify.py
│
├── memory/                          # dobby-memory — Postgres store
│   ├── pyproject.toml
│   └── dobby_memory/
│       ├── __init__.py
│       ├── store.py
│       ├── models.py
│       ├── postgres.py
│       └── vector_placeholder.py
│
├── voice/                           # dobby-voice — STT/TTS stubs
│   ├── pyproject.toml
│   └── dobby_voice/
│       ├── __init__.py
│       ├── stt.py
│       ├── tts.py
│       └── automation.py
│
├── backend/                         # FastAPI AI engine
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── schemas.py
│       ├── deps.py
│       ├── core/
│       │   ├── llm.py
│       │   ├── prompt.py
│       │   └── agent.py
│       ├── api/
│       │   ├── router.py
│       │   └── routes/
│       │       ├── health.py
│       │       ├── chat.py
│       │       ├── memory.py
│       │       ├── tools.py
│       │       └── websocket.py
│       ├── services/
│       ├── memory/                  # package boundary marker
│       └── tools/
│
└── frontend/                        # Next.js UI
    ├── package.json
    ├── .env.example
    ├── next.config.ts
    ├── tsconfig.json
    ├── postcss.config.mjs
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx
        │   └── globals.css
        ├── components/
        │   ├── chat/
        │   │   ├── ChatBubble.tsx
        │   │   ├── ChatInput.tsx
        │   │   ├── ChatMessageList.tsx
        │   │   └── VoiceButton.tsx
        │   └── layout/
        │       └── AppShell.tsx
        ├── hooks/
        │   └── use-streaming-chat.ts
        └── lib/
            ├── config.ts
            └── websocket-client.ts
```
