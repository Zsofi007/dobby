# Phase 2.5 — Voice enhancements (planned)

Phase 2 ships **push-to-talk STT**, **OpenAI TTS**, and an optional **Speak replies** toggle. This document captures the next voice iteration—not yet implemented.

## Goals

Improve latency, hands-free flow, and provider flexibility without rewriting the core chat pipeline.

---

## 1. Streaming TTS

**Problem:** Speak replies waits for the full assistant message before synthesizing—noticeable delay on long answers.

**Approach:**

- Buffer tokens until sentence boundaries (`.`, `?`, `!`, newline)
- Call TTS per sentence chunk and queue `Audio` segments
- Cancel queue on new user message or recording start

**Files likely touched:** `use-streaming-chat.ts`, optional `use-tts-queue.ts`, backend optional `POST /voice/synthesize` streaming if OpenAI adds it

---

## 2. Full voice turn (auto-send)

**Problem:** User must review transcript and press Send.

**Approach:**

- Settings toggle: **Auto-send voice** (default off)
- On transcribe success → `sendMessage(text)` directly
- Optional short confirmation beep

**Risk:** STT errors send wrong messages—keep edit-before-send as default.

---

## 3. ElevenLabs TTS

**Problem:** OpenAI TTS is good enough for MVP but less expressive than ElevenLabs.

**Approach:**

- Extend `dobby_voice/factory.py` with `TTS_PROVIDER=openai|elevenlabs`
- Implement `ElevenLabsTTS` in `voice/dobby_voice/elevenlabs_tts.py`
- Env: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`

Phase 2 intentionally uses OpenAI only; this is the first multi-provider TTS step.

---

## 4. Local Whisper (privacy / offline)

**Problem:** Audio leaves the machine on every utterance.

**Approach:**

- Optional `VOICE_STT_PROVIDER=openai|local`
- Run `faster-whisper` or `whisper.cpp` in a background worker
- Higher ops cost; document GPU/CPU requirements

---

## 5. Voice activity detection (VAD)

**Problem:** Push-to-talk is awkward on mobile and desktop without a hardware key.

**Approach:**

- Tap-to-toggle record (in addition to hold)
- Client-side VAD (e.g. `@ricky0123/vad-web`) to auto-stop on silence
- Max recording duration cap (e.g. 60s)

---

## 6. Wake word / always-listening

**Problem:** Not true “Jarvis” until always available.

**Approach:**

- Defer until desktop agent or mobile app exists
- Likely requires native layer (Porcupine, openWakeWord) or OS APIs
- Heavy on battery and privacy—explicit opt-in only

**Not recommended** until Phases 3–4 (real tools + automation) are stable.

---

## 7. Production hardening

| Item | Notes |
|------|--------|
| HTTPS | `getUserMedia` requires secure context in production |
| Rate limits | Per-IP limits on `/voice/transcribe` and `/synthesize` |
| Cost caps | Log Whisper + TTS usage; daily budget alerts |
| Safari | Test `audio/mp4` fallback for MediaRecorder |
| Error UX | Inline errors instead of silent TTS failure |

---

## Suggested order

1. Tap-to-toggle + sentence-chunked TTS (biggest UX win)
2. ElevenLabs provider option
3. Auto-send voice toggle
4. Rate limits + Safari fixes
5. Local Whisper (if privacy is a priority)
6. Wake word (with desktop/mobile agent)

---

## Out of scope for 2.5

- Multi-agent voice orchestration
- Real-time duplex conversation (OpenAI Realtime API) — evaluate as Phase 3+ alternative architecture
- Voice-specific memory (separate from text memory)

See [IDEA.md](../IDEA.md) Phase 3 for tool integrations that pair well with voice (“What’s on my calendar?”).
