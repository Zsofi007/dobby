"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/hooks/use-streaming-chat";
import { Sparkles } from "lucide-react";
import { ChatBubble } from "./ChatBubble";

const SUGGESTIONS = [
  "What time is it?",
  "What's on my calendar?",
  "Summarize my day",
] as const;

interface ChatMessageListProps {
  messages: ChatMessage[];
  onSuggestionClick?: (text: string) => void;
  onReplayMessage?: (messageId: string, content: string) => void;
  playingMessageId?: string | null;
  ttsLoading?: boolean;
}

export function ChatMessageList({
  messages,
  onSuggestionClick,
  onReplayMessage,
  playingMessageId,
  ttsLoading,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          <Sparkles className="h-8 w-8" aria-hidden />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="font-heading text-xl font-semibold text-glow text-[var(--foreground)]">
            Hello, I&apos;m Dobby
          </h2>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Your personal AI layer — ask questions, run tools, and manage your digital life.
          </p>
        </div>
        {onSuggestionClick && (
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => onSuggestionClick(text)}
                className="ring-glow cursor-pointer rounded-full border border-[var(--border)] bg-[var(--surface-elevated)]/60 px-4 py-2 text-sm text-[var(--muted)] transition-colors duration-200 hover:border-emerald-500/40 hover:text-[var(--foreground)]"
              >
                {text}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-6 md:px-8"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            isStreaming={msg.isStreaming}
            messageId={msg.id}
            onReplay={onReplayMessage}
            isReplayLoading={ttsLoading && playingMessageId === msg.id}
            isPlaying={playingMessageId === msg.id && !ttsLoading}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
