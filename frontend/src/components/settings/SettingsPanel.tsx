"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { listUserMemories, saveUserMemory } from "@/lib/api-client";
import {
  getAutoSendVoice,
  getVoiceInputMode,
  setAutoSendVoice,
  setVoiceInputMode,
  type VoiceInputMode,
} from "@/lib/storage";
import { X } from "lucide-react";

const PROFILE_FIELDS = [
  { key: "profile.name", label: "Name", placeholder: "Your name" },
  { key: "profile.timezone", label: "Timezone", placeholder: "e.g. Europe/London" },
  {
    key: "profile.preferences",
    label: "Preferences",
    placeholder: "How should Dobby help you?",
    multiline: true,
  },
] as const;

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  onVoiceSettingsChange?: () => void;
}

const inputClassName =
  "ring-glow w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-strong)] transition-colors duration-200 focus:border-emerald-500/50 focus:outline-none";

export function SettingsPanel({ open, onClose, onVoiceSettingsChange }: SettingsPanelProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [voiceInputMode, setVoiceInputModeState] = useState<VoiceInputMode>("hold");
  const [autoSendVoice, setAutoSendVoiceState] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const memories = await listUserMemories();
      const next: Record<string, string> = {};
      for (const field of PROFILE_FIELDS) {
        next[field.key] = memories.find((m) => m.key === field.key)?.value ?? "";
      }
      setValues(next);
      setVoiceInputModeState(getVoiceInputMode());
      setAutoSendVoiceState(getAutoSendVoice());
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void load();
    }
  }, [open, load]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      for (const field of PROFILE_FIELDS) {
        const value = values[field.key]?.trim() ?? "";
        if (value) {
          await saveUserMemory({ key: field.key, value });
        }
      }
      setVoiceInputMode(voiceInputMode);
      setAutoSendVoice(autoSendVoice);
      onVoiceSettingsChange?.();
      setMessage("Settings saved. Dobby will use these in future replies.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-pointer bg-black/60 backdrop-blur-sm"
        aria-label="Close settings"
        onClick={onClose}
      />
      <aside className="glass-panel fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--border)]/60 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-[var(--border)]/60 px-5 py-4">
          <div>
            <h2 className="font-heading text-lg font-semibold">Settings</h2>
            <p className="text-xs text-[var(--muted)]">Profile & preferences</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="ring-glow flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition-colors duration-200 hover:border-emerald-500/40 hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-4" aria-busy="true" aria-label="Loading settings">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-3 w-20 rounded bg-[var(--surface-elevated)]" />
                  <div className="h-10 rounded-xl bg-[var(--surface-elevated)]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              <fieldset className="space-y-3 rounded-xl border border-[var(--border)]/60 p-4">
                <legend className="px-1 text-sm font-medium text-[var(--foreground)]">
                  Voice
                </legend>
                <div className="space-y-2">
                  <span className="text-xs text-[var(--muted)]">Microphone mode</span>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="voiceInputMode"
                        checked={voiceInputMode === "hold"}
                        onChange={() => setVoiceInputModeState("hold")}
                      />
                      Hold to speak
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="voiceInputMode"
                        checked={voiceInputMode === "tap"}
                        onChange={() => setVoiceInputModeState("tap")}
                      />
                      Tap + auto-stop
                    </label>
                  </div>
                  <p className="text-[10px] text-[var(--muted-strong)]">
                    Tap mode uses voice detection to stop when you pause (first use downloads
                    a small model).
                  </p>
                </div>
                <label className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoSendVoice}
                    onChange={(e) => setAutoSendVoiceState(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    Auto-send voice messages
                    <span className="mt-0.5 block text-xs text-[var(--muted)]">
                      Sends immediately after transcription. STT mistakes will be sent as-is.
                    </span>
                  </span>
                </label>
              </fieldset>
              {PROFILE_FIELDS.map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                    {field.label}
                  </span>
                  {"multiline" in field && field.multiline ? (
                    <textarea
                      value={values[field.key] ?? ""}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      rows={4}
                      className={inputClassName}
                    />
                  ) : (
                    <input
                      type="text"
                      value={values[field.key] ?? ""}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      className={inputClassName}
                    />
                  )}
                </label>
              ))}
            </div>
          )}
          {message && (
            <p
              className={`mt-4 text-sm ${
                message.includes("Failed") ? "text-[var(--danger)]" : "text-emerald-400"
              }`}
              role="status"
            >
              {message}
            </p>
          )}
          <div className="mt-auto pt-6">
            <button
              type="submit"
              disabled={saving || loading}
              className="ring-glow w-full cursor-pointer rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
