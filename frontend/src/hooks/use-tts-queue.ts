"use client";

import { useCallback, useRef, useState } from "react";
import { synthesizeSpeech } from "@/lib/api-client";
import { stripMarkdownForSpeech } from "@/lib/strip-markdown-for-speech";

interface QueueItem {
  text: string;
  messageId: string;
}

export function useTtsQueue() {
  const queueRef = useRef<QueueItem[]>([]);
  const processingRef = useRef(false);
  /** Bumped on cancel so in-flight synthesis/playback from a prior turn is dropped. */
  const sessionRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    sessionRef.current += 1;
    queueRef.current = [];
    processingRef.current = false;
    cleanupAudio();
    setIsSpeaking(false);
  }, [cleanupAudio]);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    const session = sessionRef.current;
    setIsSpeaking(true);

    while (queueRef.current.length > 0) {
      if (session !== sessionRef.current) break;

      const item = queueRef.current.shift()!;
      try {
        const blob = await synthesizeSpeech(item.text);
        if (session !== sessionRef.current) break;

        cleanupAudio();
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;

        await new Promise<void>((resolve, reject) => {
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error("playback failed"));
          void audio.play().catch(reject);
        });
        if (session !== sessionRef.current) break;
      } catch {
        // skip failed chunk
      }
    }

    cleanupAudio();
    processingRef.current = false;
    if (session === sessionRef.current) {
      setIsSpeaking(false);
    }
  }, [cleanupAudio]);

  const enqueue = useCallback(
    (text: string, messageId: string) => {
      const trimmed = stripMarkdownForSpeech(text);
      if (!trimmed) return;
      queueRef.current.push({ text: trimmed, messageId });
      void processQueue();
    },
    [processQueue]
  );

  return { enqueue, cancel, isSpeaking };
};
