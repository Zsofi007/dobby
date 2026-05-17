"use client";

import { Volume2 } from "lucide-react";

interface SpeakRepliesToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export function SpeakRepliesToggle({
  enabled,
  onChange,
  disabled,
}: SpeakRepliesToggleProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--muted)]">
      <input
        type="checkbox"
        checked={enabled}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-[var(--border)] accent-emerald-600"
      />
      <Volume2 className="h-3.5 w-3.5" aria-hidden />
      <span>Speak replies</span>
    </label>
  );
}
