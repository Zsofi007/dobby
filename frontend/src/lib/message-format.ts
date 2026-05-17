export type MessageBlock =
  | { type: "paragraph"; lines: string[] }
  | { type: "ol"; items: string[] }
  | { type: "ul"; items: string[] };

/** Matches `1. item` and `1.item` (models often omit the space). */
const ORDERED_LIST_LINE = /^\d+\./;
const stripOrderedListPrefix = (line: string) => line.replace(/^\d+\.\s*/, "");

export function parseMessageBlocks(text: string): MessageBlock[] {
  const lines = text.split("\n");
  const blocks: MessageBlock[] = [];
  let i = 0;

  const pushParagraph = (chunk: string[]) => {
    const joined = chunk.join("\n").trim();
    if (joined) blocks.push({ type: "paragraph", lines: chunk });
  };

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (ORDERED_LIST_LINE.test(line)) {
      const items: string[] = [];
      while (i < lines.length) {
        while (i < lines.length && !(lines[i] ?? "").trim()) {
          i += 1;
        }
        if (i >= lines.length) break;
        const current = lines[i] ?? "";
        if (!ORDERED_LIST_LINE.test(current)) break;
        items.push(stripOrderedListPrefix(current));
        i += 1;
      }
      if (items.length > 0) blocks.push({ type: "ol", items });
      continue;
    }

    if (/^[-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length) {
        while (i < lines.length && !(lines[i] ?? "").trim()) {
          i += 1;
        }
        if (i >= lines.length) break;
        const current = lines[i] ?? "";
        if (!/^[-*+]\s/.test(current)) break;
        items.push(current.replace(/^[-*+]\s+/, ""));
        i += 1;
      }
      if (items.length > 0) blocks.push({ type: "ul", items });
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      (lines[i] ?? "").trim() &&
      !ORDERED_LIST_LINE.test(lines[i] ?? "") &&
      !/^[-*+]\s/.test(lines[i] ?? "")
    ) {
      para.push(lines[i] ?? "");
      i += 1;
    }
    pushParagraph(para);
  }

  return blocks;
}

/** Plain-text preview of how blocks render in the UI. */
export function formatMessageBlocksPreview(blocks: MessageBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === "ol") {
        return block.items.map((item, index) => `${index + 1}. ${item}`).join("\n");
      }
      if (block.type === "ul") {
        return block.items.map((item) => `• ${item}`).join("\n");
      }
      return block.lines.join("\n");
    })
    .join("\n\n");
}
