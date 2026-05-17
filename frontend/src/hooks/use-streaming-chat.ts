"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ConversationSummary, WsServerEvent } from "@dobby/shared";
import {
  createConversation,
  getMessages,
  listConversations,
} from "@/lib/api-client";
import { WS_URL } from "@/lib/config";
import {
  getActiveConversationId,
  getSpeakReplies,
  setActiveConversationId,
  setSpeakReplies,
} from "@/lib/storage";
import { useTtsPlayback } from "@/hooks/use-tts-playback";
import { useTtsQueue } from "@/hooks/use-tts-queue";
import { SentenceChunker } from "@/lib/sentence-chunker";
import { DobbyWebSocketClient } from "@/lib/websocket-client";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export interface ToolActivity {
  id: string;
  name: string;
  status: "running" | "done";
  result?: string;
}

const DISPLAY_ROLES = new Set(["user", "assistant"]);

export function useStreamingChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toolActivity, setToolActivity] = useState<ToolActivity[]>([]);
  const [speakReplies, setSpeakRepliesState] = useState(false);
  const clientRef = useRef<DobbyWebSocketClient | null>(null);
  const streamingIdRef = useRef<string | null>(null);
  const speakRepliesRef = useRef(false);
  const streamingTextRef = useRef("");
  const lastSpokenMessageIdRef = useRef<string | null>(null);
  const chunkerRef = useRef(new SentenceChunker());
  const { play: playTts, stop: stopPlayback, playingMessageId, isLoading: ttsLoading } =
    useTtsPlayback();
  const { enqueue: enqueueTts, cancel: cancelTtsQueue, isSpeaking: isTtsQueueSpeaking } =
    useTtsQueue();

  useEffect(() => {
    const enabled = getSpeakReplies();
    setSpeakRepliesState(enabled);
    speakRepliesRef.current = enabled;
  }, []);

  const toggleSpeakReplies = useCallback((enabled: boolean) => {
    setSpeakRepliesState(enabled);
    speakRepliesRef.current = enabled;
    setSpeakReplies(enabled);
    if (!enabled) {
      stopPlayback();
      cancelTtsQueue();
    }
  }, [stopPlayback, cancelTtsQueue]);

  const refreshConversations = useCallback(async () => {
    try {
      const list = await listConversations();
      setConversations(list);
    } catch {
      // non-fatal
    }
  }, []);

  const hydrateConversation = useCallback(async (id: string) => {
    const data = await getMessages(id);
    const hydrated: ChatMessage[] = data.messages
      .filter((m) => DISPLAY_ROLES.has(m.role))
      .map((m) => ({
        id: m.id ?? crypto.randomUUID(),
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
    setConversationId(id);
    setActiveConversationId(id);
    setMessages(hydrated);
    setToolActivity([]);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await refreshConversations();
        const savedId = getActiveConversationId();
        if (savedId) {
          await hydrateConversation(savedId);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load conversation");
        }
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [hydrateConversation, refreshConversations]);

  const handleServerEvent = useCallback(
    (event: WsServerEvent) => {
      switch (event.type) {
        case "conversation":
          setConversationId(event.conversation_id);
          setActiveConversationId(event.conversation_id);
          break;
        case "token":
          streamingTextRef.current += event.content;
          if (speakRepliesRef.current) {
            const sid = streamingIdRef.current;
            if (sid) {
              for (const chunk of chunkerRef.current.push(event.content)) {
                if (streamingIdRef.current === sid) {
                  enqueueTts(chunk, sid);
                }
              }
            }
          }
          setMessages((prev) => {
            const sid = streamingIdRef.current;
            if (!sid) return prev;
            return prev.map((m) =>
              m.id === sid ? { ...m, content: m.content + event.content } : m
            );
          });
          break;
        case "tool_call":
          setToolActivity((prev) => [
            ...prev,
            {
              id: event.call.id,
              name: event.call.name,
              status: "running",
            },
          ]);
          break;
        case "tool_result":
          setToolActivity((prev) =>
            prev.map((t) =>
              t.id === event.result.tool_call_id
                ? { ...t, status: "done", result: event.result.content }
                : t
            )
          );
          break;
        case "done": {
          const assistantId = streamingIdRef.current;
          const finalText = streamingTextRef.current;
          const serverMessageId = event.message_id ?? assistantId;
          const ttsKey = serverMessageId ?? assistantId;

          if (assistantId) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      id: serverMessageId ?? m.id,
                      content: finalText,
                      isStreaming: false,
                    }
                  : m
              )
            );
          }

          if (
            speakRepliesRef.current &&
            ttsKey &&
            assistantId &&
            lastSpokenMessageIdRef.current !== ttsKey
          ) {
            lastSpokenMessageIdRef.current = ttsKey;
            const remainder = chunkerRef.current.flush();
            if (remainder) {
              enqueueTts(remainder, ttsKey);
            }
          }

          chunkerRef.current.reset();
          streamingTextRef.current = "";
          streamingIdRef.current = null;
          setIsLoading(false);
          setToolActivity([]);
          void refreshConversations();
          break;
        }
        case "error":
          setError(event.message);
          setIsLoading(false);
          streamingIdRef.current = null;
          setToolActivity([]);
          break;
        case "pong":
          break;
      }
    },
    [refreshConversations, enqueueTts]
  );

  const replayMessage = useCallback(
    (messageId: string, text: string) => {
      cancelTtsQueue();
      void playTts(text, messageId);
    },
    [playTts, cancelTtsQueue]
  );

  useEffect(() => {
    const client = new DobbyWebSocketClient(WS_URL, handleServerEvent, setIsConnected);
    client.connect();
    clientRef.current = client;
    return () => client.disconnect();
  }, [handleServerEvent]);

  const loadConversation = useCallback(
    async (id: string) => {
      if (id === conversationId || isLoading) return;
      setError(null);
      setIsHydrating(true);
      try {
        await hydrateConversation(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load conversation");
      } finally {
        setIsHydrating(false);
      }
    },
    [conversationId, hydrateConversation, isLoading]
  );

  const startNewChat = useCallback(async () => {
    setError(null);
    setToolActivity([]);
    setMessages([]);
    streamingIdRef.current = null;
    try {
      const { conversation_id } = await createConversation();
      setConversationId(conversation_id);
      setActiveConversationId(conversation_id);
      await refreshConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start new chat");
    }
  }, [refreshConversations]);

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

      stopPlayback();
      cancelTtsQueue();
      chunkerRef.current.reset();
      setError(null);
      setIsLoading(true);
      setToolActivity([]);

      const userId = crypto.randomUUID();
      const assistantId = crypto.randomUUID();
      streamingIdRef.current = assistantId;
      streamingTextRef.current = "";
      lastSpokenMessageIdRef.current = null;

      setMessages((prev) => [
        ...prev,
        { id: userId, role: "user", content: trimmed },
        { id: assistantId, role: "assistant", content: "", isStreaming: true },
      ]);

      clientRef.current?.send({
        type: "chat",
        conversation_id: conversationId ?? undefined,
        content: trimmed,
      });
    },
    [conversationId, isLoading, stopPlayback, cancelTtsQueue]
  );

  useEffect(
    () => () => {
      stopPlayback();
      cancelTtsQueue();
    },
    [stopPlayback, cancelTtsQueue]
  );

  return {
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
    refreshConversations,
    speakReplies,
    toggleSpeakReplies,
    stopPlayback,
    replayMessage,
    playingMessageId,
    ttsLoading,
    isTtsQueueSpeaking,
    cancelTtsQueue,
  };
}
