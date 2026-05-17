# Phase 2.5 Sprint — Voice enhancements (items 1, 2, 5)

This sprint implements three items from [PHASE_2_5.md](./PHASE_2_5.md). Items 3 (ElevenLabs), 4 (local Whisper), 6 (wake word), and 7 (production hardening) are deferred.

## Scope

| # | Feature | Summary |
|---|---------|---------|
| 5 | Tap + VAD | Tap-to-toggle recording; `@ricky0123/vad-web` auto-stop on silence; 60s cap; hold mode preserved |
| 2 | Auto-send voice | Settings toggle; send transcript immediately without pressing Send (default off) |
| 1 | Streaming TTS | Sentence-chunked synthesis while reply streams when Speak replies is on |

## Build order

1. Item 5 — voice input modes + VAD  
2. Item 2 — auto-send toggle  
3. Item 1 — sentence chunker + TTS queue  

## Architecture

```
Tap mic → VAD (tap mode) → transcribe → [auto-send?] → WebSocket chat
                                              ↓
                                    token stream → sentence chunks → TTS queue → audio
```

Backend unchanged: existing `POST /api/voice/transcribe` and `POST /api/voice/synthesize`.

## Settings (localStorage)

| Key | Values | Default |
|-----|--------|---------|
| `dobby:voiceInputMode` | `hold` \| `tap` | `hold` |
| `dobby:autoSendVoice` | `true` \| `false` | `false` |
| `dobby:speakReplies` | (existing) | `false` |

## Definition of done

- [x] Hold and tap mic modes work; tap + VAD auto-stops on silence
- [x] Auto-send off → transcript in input; on → sends immediately
- [x] Speak replies streams TTS per sentence before reply completes
- [x] New message / mic press cancels TTS queue
- [x] Replay button still plays full message

## Files

| File | Purpose |
|------|---------|
| `frontend/src/hooks/use-voice-input.ts` | Hold/tap/VAD recording |
| `frontend/src/hooks/use-tts-queue.ts` | Sequential sentence playback |
| `frontend/src/lib/sentence-chunker.ts` | Token → sentence chunks |
| `frontend/src/lib/storage.ts` | Voice prefs |
| `frontend/src/components/settings/SettingsPanel.tsx` | Voice settings UI |
