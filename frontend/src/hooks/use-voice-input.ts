"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { transcribeAudio } from "@/lib/api-client";
import { encodeWav } from "@/lib/encode-wav";
import { loadMicVad, VAD_ASSET_PATHS } from "@/lib/vad-loader";
import type { VoiceInputMode } from "@/lib/storage";

export type VoiceInputStatus = "idle" | "recording" | "transcribing" | "loading_vad";

const MAX_RECORDING_MS = 60_000;

function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return "audio/webm";
}

interface UseVoiceInputOptions {
  mode: VoiceInputMode;
  onTranscript: (text: string) => void;
}

export function useVoiceInput({ mode, onTranscript }: UseVoiceInputOptions) {
  const [status, setStatus] = useState<VoiceInputStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef("audio/webm");
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vadRef = useRef<{ pause: () => void; start: () => void } | null>(null);
  const finishingRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const clearMaxDurationTimer = useCallback(() => {
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
  }, []);

  const stopTracks = useCallback(() => {
    recorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
  }, []);

  const transcribeBlob = useCallback(async (blob: Blob, mime: string) => {
    setStatus("transcribing");
    try {
      const { text } = await transcribeAudio(blob, mime);
      if (!text.trim()) {
        setError("Could not understand audio. Please try again.");
      } else {
        onTranscriptRef.current(text.trim());
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcription failed");
    } finally {
      setStatus("idle");
      finishingRef.current = false;
    }
  }, []);

  const finishMediaRecording = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    clearMaxDurationTimer();

    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      finishingRef.current = false;
      return;
    }

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    stopTracks();
    recorderRef.current = null;

    const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
    chunksRef.current = [];

    if (blob.size === 0) {
      setStatus("idle");
      setError("No audio captured. Try holding the mic a bit longer.");
      finishingRef.current = false;
      return;
    }

    const baseMime = mimeTypeRef.current.split(";")[0];
    await transcribeBlob(blob, baseMime);
  }, [clearMaxDurationTimer, stopTracks, transcribeBlob]);

  const stopVad = useCallback(() => {
    try {
      vadRef.current?.pause();
    } catch {
      // ignore
    }
    vadRef.current = null;
    clearMaxDurationTimer();
  }, [clearMaxDurationTimer]);

  const finishVadRecording = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    stopVad();
    setStatus("idle");
    finishingRef.current = false;
  }, [stopVad]);

  const startMaxDurationTimer = useCallback(
    (onMax: () => void) => {
      clearMaxDurationTimer();
      maxDurationTimerRef.current = setTimeout(onMax, MAX_RECORDING_MS);
    },
    [clearMaxDurationTimer]
  );

  const startMediaRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      mimeTypeRef.current = mimeType;

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      recorderRef.current = recorder;
      setStatus("recording");
      startMaxDurationTimer(() => void finishMediaRecording());
    } catch {
      setError("Microphone access denied or unavailable.");
      setStatus("idle");
    }
  }, [finishMediaRecording, startMaxDurationTimer]);

  const startVadRecording = useCallback(async () => {
    setError(null);
    setStatus("loading_vad");
    try {
      const MicVAD = await loadMicVad();
      const vad = await MicVAD.new({
        ...VAD_ASSET_PATHS,
        onSpeechStart: () => {
          setStatus("recording");
        },
        onSpeechEnd: async (audio: Float32Array) => {
          if (finishingRef.current) return;
          finishingRef.current = true;
          clearMaxDurationTimer();
          stopVad();
          setStatus("transcribing");
          try {
            const blob = new Blob([encodeWav(audio)], { type: "audio/wav" });
            await transcribeBlob(blob, "audio/wav");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Transcription failed");
            setStatus("idle");
            finishingRef.current = false;
          }
        },
      });
      vadRef.current = vad;
      await vad.start();
      setStatus("recording");
      startMaxDurationTimer(() => {
        void finishVadRecording();
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Voice detection failed to load. Try hold mode or refresh."
      );
      setStatus("idle");
    }
  }, [
    clearMaxDurationTimer,
    finishVadRecording,
    startMaxDurationTimer,
    stopVad,
    transcribeBlob,
  ]);

  const startRecording = useCallback(async () => {
    finishingRef.current = false;
    if (mode === "tap") {
      await startVadRecording();
    } else {
      await startMediaRecording();
    }
  }, [mode, startMediaRecording, startVadRecording]);

  const stopRecording = useCallback(() => {
    if (status !== "recording" && status !== "loading_vad") return;
    if (mode === "tap" && vadRef.current) {
      void finishVadRecording();
    } else {
      void finishMediaRecording();
    }
  }, [status, mode, finishVadRecording, finishMediaRecording]);

  const toggleRecording = useCallback(() => {
    if (status === "recording" || status === "loading_vad") {
      stopRecording();
    } else if (status === "idle") {
      void startRecording();
    }
  }, [status, startRecording, stopRecording]);

  useEffect(() => {
    return () => {
      clearMaxDurationTimer();
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
      stopTracks();
      stopVad();
    };
  }, [clearMaxDurationTimer, stopTracks, stopVad]);

  return {
    status,
    error,
    mode,
    startRecording,
    stopRecording,
    toggleRecording,
    clearError: () => setError(null),
  };
}
