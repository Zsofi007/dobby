const ACTIVE_CONVERSATION_KEY = "dobby:activeConversationId";
const SPEAK_REPLIES_KEY = "dobby:speakReplies";
const VOICE_INPUT_MODE_KEY = "dobby:voiceInputMode";
const AUTO_SEND_VOICE_KEY = "dobby:autoSendVoice";

export type VoiceInputMode = "hold" | "tap";

export function getActiveConversationId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_CONVERSATION_KEY);
}

export function setActiveConversationId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem(ACTIVE_CONVERSATION_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
  }
}

export function getSpeakReplies(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SPEAK_REPLIES_KEY) === "true";
}

export function setSpeakReplies(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SPEAK_REPLIES_KEY, enabled ? "true" : "false");
}

export function getVoiceInputMode(): VoiceInputMode {
  if (typeof window === "undefined") return "hold";
  const v = localStorage.getItem(VOICE_INPUT_MODE_KEY);
  return v === "tap" ? "tap" : "hold";
}

export function setVoiceInputMode(mode: VoiceInputMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VOICE_INPUT_MODE_KEY, mode);
}

export function getAutoSendVoice(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTO_SEND_VOICE_KEY) === "true";
}

export function setAutoSendVoice(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTO_SEND_VOICE_KEY, enabled ? "true" : "false");
}
