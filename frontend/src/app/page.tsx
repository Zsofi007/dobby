"use client";

import { useEffect, useState } from "react";
import { getVoiceInputMode, type VoiceInputMode } from "@/lib/storage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { ToolActivityBar } from "@/components/chat/ToolActivityBar";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { Menu } from "lucide-react";
import { SpeakRepliesToggle } from "@/components/chat/SpeakRepliesToggle";
import { useStreamingChat } from "@/hooks/use-streaming-chat";

export default function ChatPage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceInputMode, setVoiceInputMode] = useState<VoiceInputMode>("hold");

  useEffect(() => {
    setVoiceInputMode(getVoiceInputMode());
  }, []);

  const {
    messages,
    conversations,
    conversationId,
    isConnected,
    isLoading,
    isHydrating,
    error,
    toolActivity,
    sendMessage,
    loadConversation,
    startNewChat,
    speakReplies,
    toggleSpeakReplies,
    stopPlayback,
    replayMessage,
    playingMessageId,
    ttsLoading,
    isTtsQueueSpeaking,
    cancelTtsQueue,
  } = useStreamingChat();

  const handleSelectConversation = async (id: string) => {
    setSidebarOpen(false);
    await loadConversation(id);
  };

  const handleNewChat = async () => {
    setSidebarOpen(false);
    await startNewChat();
  };

  const sidebar = (
    <>
      <ConversationSidebar
        conversations={conversations}
        activeId={conversationId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        className="hidden md:flex"
      />
      {sidebarOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-pointer bg-black/60 backdrop-blur-sm md:hidden"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          />
          <ConversationSidebar
            conversations={conversations}
            activeId={conversationId}
            onSelect={handleSelectConversation}
            onNewChat={handleNewChat}
            onClose={() => setSidebarOpen(false)}
            className="fixed inset-y-0 left-0 z-40 shadow-2xl shadow-black/50 md:hidden"
          />
        </>
      )}
    </>
  );

  return (
    <AppShell onOpenSettings={() => setSettingsOpen(true)} sidebar={sidebar}>
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onVoiceSettingsChange={() => setVoiceInputMode(getVoiceInputMode())}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-[var(--border)]/60 bg-[var(--surface)]/40 px-4 py-2.5 text-xs md:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open conversations"
            className="ring-glow flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)]/60 px-2.5 py-1.5 text-[var(--muted)] transition-colors duration-200 hover:text-[var(--foreground)] md:hidden"
          >
            <Menu className="h-4 w-4" aria-hidden />
            Chats
          </button>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
              isConnected
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-amber-500/15 text-amber-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isConnected ? "bg-emerald-400" : "animate-pulse bg-amber-400"
              }`}
            />
            {isConnected ? "Connected" : "Reconnecting…"}
          </span>
          {isHydrating && (
            <span className="text-[var(--muted)]">Loading conversation…</span>
          )}
          {isTtsQueueSpeaking && <span className="text-sky-400">Speaking…</span>}
          <div className="ml-auto">
            <SpeakRepliesToggle
              enabled={speakReplies}
              onChange={toggleSpeakReplies}
              disabled={isLoading}
            />
          </div>
        </div>

        {error && (
          <div
            className="mx-4 mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300 md:mx-6"
            role="alert"
          >
            {error}
          </div>
        )}

        <ToolActivityBar activities={toolActivity} />
        <ChatMessageList
          messages={messages}
          onSuggestionClick={sendMessage}
          onReplayMessage={replayMessage}
          playingMessageId={playingMessageId}
          ttsLoading={ttsLoading}
        />
        <ChatInput
          onSend={sendMessage}
          disabled={isLoading || isHydrating}
          voiceInputMode={voiceInputMode}
          onRecordingChange={(recording) => {
            if (recording) {
              stopPlayback();
              cancelTtsQueue();
            }
          }}
        />
      </div>
    </AppShell>
  );
}
