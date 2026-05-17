# Dobby

A personal AI assistant — chat interface, tool-using agent, memory, and voice. Modular monorepo foundation for a production-grade assistant product.

## Monorepo structure

```
dobby/
├── frontend/          # Next.js chat UI (WebSocket streaming)
├── backend/           # FastAPI AI engine
├── shared/            # TypeScript contracts (@dobby/shared)
├── tools/             # Pluggable tool system (Python)
├── memory/            # PostgreSQL memory layer (Python)
├── voice/             # STT/TTS & automation stubs (Python)
├── docker-compose.yml # PostgreSQL for local dev
└── IDEA.md            # Product vision & roadmap
```

## Architecture

```
User → Next.js (WebSocket) → FastAPI → Agent loop → LLM
                                    ↓
                              Tool registry (get_time, mock_calendar, mock_spotify)
                                    ↓
                              PostgreSQL memory (messages + user key-value)
                                    ↓
                              Streamed tokens → UI
```

- **Modular monolith backend** — one FastAPI process, clear package boundaries
- **Pluggable tools** — register tools via `dobby_tools`
- **Replaceable memory** — `MemoryStore` interface; vector DB placeholder only
- **Swappable LLM** — OpenAI-compatible wrapper (mock mode without API key)

## Prerequisites

- Node.js 20+ (npm 10+)
- Python 3.11+
- Docker (for PostgreSQL)

## Quick start

### 1. Database

```bash
docker compose up -d postgres
```

Postgres listens on **port 5433** (not 5432) so it does not clash with a local Homebrew Postgres install.

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Optional: set OPENAI_API_KEY for live LLM responses (mock works without it)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend

```bash
npm install
npm run build -w @dobby/shared
cp frontend/.env.example frontend/.env.local
npm run dev -w @dobby/frontend
```

Open [http://localhost:3000](http://localhost:3000).

### Run both (from repo root)

```bash
npm install
npm run db:up
# Terminal 1: backend (see above)
# Terminal 2:
npm run dev:frontend
```

## MVP checklist

1. Start backend (`uvicorn` on port 8000)
2. Start frontend (`next dev` on port 3000)
3. Send a chat message
4. Receive streamed AI response over WebSocket
5. Messages persisted in PostgreSQL

## API overview

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `POST /api/chat` | Non-streaming chat |
| `POST /api/chat/conversations` | Create conversation |
| `GET /api/memory/messages/{id}` | Recent messages |
| `POST /api/memory/user` | Save user memory (key-value) |
| `GET /api/tools` | List registered tools |
| `POST /api/voice/transcribe` | Speech-to-text (multipart audio) |
| `POST /api/voice/synthesize` | Text-to-speech (returns MP3) |
| `WS /api/ws/chat` | Streaming chat (primary UI path) |

### WebSocket protocol

**Client → server**

```json
{ "type": "chat", "conversation_id": "optional-uuid", "content": "Hello" }
```

**Server → client**

- `{ "type": "conversation", "conversation_id": "..." }`
- `{ "type": "token", "content": "..." }`
- `{ "type": "tool_call", "call": { ... } }`
- `{ "type": "tool_result", "result": { ... } }`
- `{ "type": "done", "message_id": "..." }`
- `{ "type": "error", "message": "..." }`

## Environment

- `backend/.env.example` — database, OpenAI, CORS
- `frontend/.env.example` — API and WebSocket URLs

## Voice (Phase 2 + 2.5 sprint)

Requires `OPENAI_API_KEY` (Whisper + TTS use the same key).

| Feature | How |
|---------|-----|
| **Hold to speak** | Default — hold mic, release to transcribe |
| **Tap + auto-stop** | Settings → Tap mode — tap mic, pause speaking to stop (VAD); tap again to cancel |
| **Auto-send voice** | Settings → sends transcript immediately (default off) |
| **Speak replies** | Status bar toggle — TTS plays per sentence while the reply streams |
| **Replay** | Replay button under each assistant message |

Env (optional, see `backend/.env.example`):

```
VOICE_STT_MODEL=whisper-1
VOICE_TTS_MODEL=tts-1
VOICE_TTS_VOICE=alloy
```

**Mic permission:** Browser will prompt for microphone access. Production requires **HTTPS**. Tap mode downloads a small VAD model on first use.

**Further voice work:** [docs/PHASE_2_5.md](./docs/PHASE_2_5.md) (ElevenLabs, local Whisper, wake word)

## User profile memory keys

Saved via **Settings** in the UI or `POST /api/memory/user`. Injected into the system prompt:

| Key | Purpose |
|-----|---------|
| `profile.name` | User's name |
| `profile.timezone` | IANA timezone (e.g. `Europe/London`) |
| `profile.preferences` | Free-text preferences and context |

## Roadmap

- [x] Voice: OpenAI Whisper STT + TTS, hold/tap input, auto-send, streaming TTS, replay
- [ ] Voice 2.5+ — see [docs/PHASE_2_5.md](./docs/PHASE_2_5.md)
- [ ] Real calendar, Spotify, tasks integrations
- [ ] Vector memory (interface stub in `memory/`)
- [ ] Playwright browser automation (`voice/dobby_voice/automation.py`)
- [ ] Proactive scheduling & notifications
- [ ] Mobile / desktop clients

See [IDEA.md](./IDEA.md) for full product vision.
