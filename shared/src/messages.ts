export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface ChatMessage {
  id?: string;
  role: MessageRole;
  content: string;
  tool_call_id?: string;
  name?: string;
  created_at?: string;
}

export interface Conversation {
  id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}
