"use client";

import { Loader2, Volume2 } from "lucide-react";
import { MessageContent } from "@/components/chat/MessageContent";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  messageId?: string;
  onReplay?: (messageId: string, content: string) => void;
  isReplayLoading?: boolean;
  isPlaying?: boolean;
}

export function ChatBubble({
  role,
  content,
  isStreaming,
  messageId,
  onReplay,
  isReplayLoading,
  isPlaying,
}: ChatBubbleProps) {
  const isUser = role === "user";
  const canReplay =
    !isUser && !isStreaming && Boolean(content.trim()) && onReplay && messageId;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 font-heading text-xs font-semibold text-sky-300"
          aria-hidden
        >
          D
        </div>
      )}
      <div className="flex min-w-0 max-w-[min(85%,42rem)] flex-col gap-1">
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-900/30"
              : "border border-[var(--border)]/80 bg-[var(--assistant-bubble)] text-[var(--foreground)] border-l-2 border-l-sky-500/50"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">
              {content || (isStreaming ? "…" : "")}
            </p>
          ) : (
            <MessageContent
              content={content}
              isStreaming={isStreaming}
              messageId={messageId}
            />
          )}
          {isStreaming && (
            <span
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--muted)]"
              aria-live="polite"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Thinking
            </span>
          )}
        </div>
        {canReplay && (
          <button
            type="button"
            onClick={() => onReplay(messageId, content)}
            disabled={isReplayLoading}
            aria-label={isPlaying ? "Playing reply" : "Replay reply"}
            className="ring-glow flex w-fit cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-[var(--muted)] transition-colors duration-200 hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isReplayLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Volume2
                className={`h-3.5 w-3.5 ${isPlaying ? "text-emerald-400" : ""}`}
                aria-hidden
              />
            )}
            <span>{isPlaying ? "Playing…" : "Replay"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
