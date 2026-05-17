"use client";

import { FormEvent, useCallback, useState } from "react";
import { Send } from "lucide-react";
import { playConfirmBeep } from "@/lib/play-confirm-beep";
import { getAutoSendVoice, type VoiceInputMode } from "@/lib/storage";
import { VoiceButton } from "./VoiceButton";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  voiceInputMode: VoiceInputMode;
  onRecordingChange?: (recording: boolean) => void;
}

export function ChatInput({
  onSend,
  disabled,
  voiceInputMode,
  onRecordingChange,
}: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleTranscript = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      if (getAutoSendVoice()) {
        playConfirmBeep();
        onSend(trimmed);
        setInput("");
      } else {
        setInput((prev) => (prev ? `${prev} ${trimmed}` : trimmed));
      }
    },
    [onSend]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <div className="border-t border-[var(--border)]/60 bg-[var(--surface)]/80 px-4 py-4 backdrop-blur-sm md:px-6">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex max-w-3xl items-end gap-2"
      >
        <VoiceButton
          disabled={disabled}
          mode={voiceInputMode}
          onTranscript={handleTranscript}
          onRecordingChange={onRecordingChange}
        />
        <div className="relative min-w-0 flex-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Message Dobby…"
            rows={1}
            disabled={disabled}
            aria-label="Message"
            className="ring-glow max-h-32 min-h-[48px] w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 pr-12 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-strong)] transition-colors duration-200 focus:border-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          aria-label="Send message"
          className="ring-glow flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-emerald-600 text-white transition-colors duration-200 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-5 w-5" aria-hidden />
        </button>
      </form>
      <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-[var(--muted-strong)]">
        {voiceInputMode === "tap"
          ? "Tap mic to speak · auto-stops when you pause"
          : "Hold mic to speak"}{" "}
        · Enter to send
      </p>
    </div>
  );
}
