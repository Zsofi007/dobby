/** Sentence end — ignore periods in numbered lists (e.g. `1.`). */
const SENTENCE_END = /(?<!\d)([.?!])(?:\s+|$)/;
const MIN_CHUNK_LENGTH = 10;
const MAX_CHUNKS_PER_TURN = 20;

export class SentenceChunker {
  private buffer = "";
  private chunkCount = 0;

  reset(): void {
    this.buffer = "";
    this.chunkCount = 0;
  }

  /** Push streamed text; returns completed sentence chunks ready for TTS. */
  push(text: string): string[] {
    this.buffer += text;
    return this.drain();
  }

  /** Flush remaining buffer at end of stream. */
  flush(): string | null {
    const trimmed = this.buffer.trim();
    this.buffer = "";
    if (!trimmed || this.chunkCount >= MAX_CHUNKS_PER_TURN) return null;
    this.chunkCount += 1;
    return trimmed;
  }

  private drain(): string[] {
    const chunks: string[] = [];

    while (this.chunkCount < MAX_CHUNKS_PER_TURN) {
      const match = SENTENCE_END.exec(this.buffer);
      if (!match) break;

      const endIndex = match.index + match[1].length;
      const sentence = this.buffer.slice(0, endIndex).trim();
      this.buffer = this.buffer.slice(endIndex).trimStart();

      if (sentence.length >= MIN_CHUNK_LENGTH) {
        chunks.push(sentence);
        this.chunkCount += 1;
      }
    }

    return chunks;
  }
}
