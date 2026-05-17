import type { ChatMessage } from "./messages.js";
import type { ToolDefinition } from "./tools.js";

export interface HealthResponse {
  status: "ok";
  version: string;
}

export interface MemoryEntry {
  key: string;
  value: string;
  updated_at: string;
}

export interface SaveMemoryRequest {
  key: string;
  value: string;
}

export interface GetMessagesResponse {
  conversation_id: string;
  messages: ChatMessage[];
}

export interface ListToolsResponse {
  tools: ToolDefinition[];
}

export interface CreateConversationResponse {
  conversation_id: string;
}

export interface ConversationSummary {
  id: string;
  title: string | null;
  updated_at: string;
}

export interface TranscribeResponse {
  text: string;
}

export interface SynthesizeRequest {
  text: string;
}
