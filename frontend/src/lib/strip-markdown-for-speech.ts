/**
 * Plain text for TTS — removes markdown syntax while keeping readable words.
 */
export function stripMarkdownForSpeech(text: string): string {
  return (
    text
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*(\d+)\.\s*/gm, "$1, ")
      .replace(/\*+/g, " ")
      .replace(/_+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}
