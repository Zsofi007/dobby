import type {
  ConversationSummary,
  GetMessagesResponse,
  MemoryEntry,
  SaveMemoryRequest,
  TranscribeResponse,
} from "@dobby/shared";
import { API_URL } from "./config";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function listConversations(): Promise<ConversationSummary[]> {
  return request<ConversationSummary[]>("/chat/conversations");
}

export async function createConversation(): Promise<{ conversation_id: string }> {
  return request<{ conversation_id: string }>("/chat/conversations", { method: "POST" });
}

export async function getMessages(conversationId: string): Promise<GetMessagesResponse> {
  return request<GetMessagesResponse>(`/memory/messages/${conversationId}`);
}

export async function listUserMemories(): Promise<MemoryEntry[]> {
  return request<MemoryEntry[]>("/memory/user");
}

export async function saveUserMemory(body: SaveMemoryRequest): Promise<MemoryEntry> {
  return request<MemoryEntry>("/memory/user", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function transcribeAudio(
  blob: Blob,
  mimeType: string = "audio/webm"
): Promise<TranscribeResponse> {
  const form = new FormData();
  form.append("audio", blob, mimeType.includes("webm") ? "recording.webm" : "recording.wav");

  const res = await fetch(`${API_URL}/voice/transcribe`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Transcription failed: ${res.status}`);
  }
  return res.json() as Promise<TranscribeResponse>;
}

export async function synthesizeSpeech(text: string): Promise<Blob> {
  const res = await fetch(`${API_URL}/voice/synthesize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Synthesis failed: ${res.status}`);
  }
  return res.blob();
}
