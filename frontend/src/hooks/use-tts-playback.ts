"use client";

import { useCallback, useRef, useState } from "react";
import { synthesizeSpeech } from "@/lib/api-client";
import { stripMarkdownForSpeech } from "@/lib/strip-markdown-for-speech";

export function useTtsPlayback() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const playSessionRef = useRef(0);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const stop = useCallback(() => {
    playSessionRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setPlayingMessageId(null);
    setIsLoading(false);
  }, []);

  const play = useCallback(
    async (text: string, messageId: string) => {
      const trimmed = stripMarkdownForSpeech(text);
      if (!trimmed) return;

      stop();
      const session = playSessionRef.current;
      setIsLoading(true);
      setPlayingMessageId(messageId);

      try {
        const blob = await synthesizeSpeech(trimmed);
        if (session !== playSessionRef.current) return;

        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        setIsLoading(false);
        if (session !== playSessionRef.current) {
          stop();
          return;
        }
        audio.onended = () => stop();
        audio.onerror = () => stop();
        await audio.play();
      } catch {
        stop();
      }
    },
    [stop]
  );

  return {
    play,
    stop,
    playingMessageId,
    isLoading,
  };
}
