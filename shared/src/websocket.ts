import type { ToolCall, ToolResult } from "./tools.js";

/** Client → server */
export type WsClientEvent =
  | { type: "chat"; conversation_id?: string; content: string }
  | { type: "ping" };

/** Server → client */
export type WsServerEvent =
  | { type: "conversation"; conversation_id: string }
  | { type: "token"; content: string }
  | { type: "tool_call"; call: ToolCall }
  | { type: "tool_result"; result: ToolResult }
  | { type: "done"; message_id?: string }
  | { type: "error"; message: string }
  | { type: "pong" };
