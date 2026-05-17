"use client";

import { Loader2, Mic } from "lucide-react";
import { useVoiceInput } from "@/hooks/use-voice-input";
import type { VoiceInputMode } from "@/lib/storage";

interface VoiceButtonProps {
  disabled?: boolean;
  mode: VoiceInputMode;
  onTranscript: (text: string) => void;
  onRecordingChange?: (recording: boolean) => void;
}

export function VoiceButton({
  disabled,
  mode,
  onTranscript,
  onRecordingChange,
}: VoiceButtonProps) {
  const { status, error, startRecording, stopRecording, toggleRecording, clearError } =
    useVoiceInput({ mode, onTranscript });

  const isRecording = status === "recording";
  const isLoadingVad = status === "loading_vad";
  const isBusy = status === "transcribing" || isLoadingVad;
  const isDisabled = disabled || isBusy;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (mode !== "hold" || isDisabled || isRecording) return;
    e.preventDefault();
    clearError();
    onRecordingChange?.(true);
    void startRecording();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (mode !== "hold" || !isRecording) return;
    e.preventDefault();
    onRecordingChange?.(false);
    stopRecording();
  };

  const handlePointerLeave = () => {
    if (mode === "hold" && isRecording) {
      onRecordingChange?.(false);
      stopRecording();
    }
  };

  const handleClick = () => {
    if (mode !== "tap" || isDisabled) return;
    clearError();
    if (!isRecording && !isLoadingVad) {
      onRecordingChange?.(true);
    } else if (isRecording) {
      onRecordingChange?.(false);
    }
    toggleRecording();
  };

  const title =
    mode === "tap"
      ? isLoadingVad
        ? "Loading voice detection…"
        : isRecording
          ? "Tap to stop (or pause speaking)"
          : isBusy
            ? "Transcribing…"
            : "Tap to speak"
      : isRecording
        ? "Release to transcribe"
        : isBusy
          ? "Transcribing…"
          : "Hold to speak";

  return (
    <div className="relative flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={isDisabled}
        title={title}
        aria-label={title}
        aria-pressed={isRecording}
        onClick={mode === "tap" ? handleClick : undefined}
        onPointerDown={mode === "hold" ? handlePointerDown : undefined}
        onPointerUp={mode === "hold" ? handlePointerUp : undefined}
        onPointerLeave={mode === "hold" ? handlePointerLeave : undefined}
        onPointerCancel={mode === "hold" ? handlePointerLeave : undefined}
        className={`ring-glow flex h-12 w-12 shrink-0 touch-none cursor-pointer items-center justify-center rounded-2xl border transition-colors duration-200 select-none disabled:cursor-not-allowed disabled:opacity-40 ${
          isRecording
            ? "border-red-500/50 bg-red-500/20 text-red-400"
            : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--muted)] hover:border-emerald-500/40 hover:text-emerald-400"
        }`}
      >
        {isBusy ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          <Mic className={`h-5 w-5 ${isRecording ? "animate-pulse" : ""}`} aria-hidden />
        )}
      </button>
      {error && (
        <span className="absolute bottom-full z-10 mb-1 max-w-[12rem] text-center text-[10px] text-red-400">
          {error}
        </span>
      )}
    </div>
  );
}
