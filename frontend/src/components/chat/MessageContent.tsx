"use client";

import { Fragment, useEffect, useRef, type ReactNode } from "react";
import {
  formatMessageBlocksPreview,
  parseMessageBlocks,
} from "@/lib/message-format";
import { stripMarkdownForSpeech } from "@/lib/strip-markdown-for-speech";

interface MessageContentProps {
  content: string;
  isStreaming?: boolean;
  messageId?: string;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="font-semibold text-[var(--foreground)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={key}
          className="rounded bg-[var(--surface-elevated)] px-1 py-0.5 font-mono text-[0.85em] text-sky-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

function logMessageFormat(
  messageId: string | undefined,
  raw: string,
  isStreaming: boolean | undefined
): void {
  if (process.env.NODE_ENV !== "development") return;

  const blocks = parseMessageBlocks(raw);
  const formatted = formatMessageBlocksPreview(blocks);
  const tts = stripMarkdownForSpeech(raw);

  console.group(
    `[Dobby] message format${messageId ? ` (${messageId.slice(0, 8)}…)` : ""}${isStreaming ? " · streaming" : ""}`
  );
  console.log("raw:", raw);
  console.log("parsed blocks:", blocks);
  console.log("formatted preview:\n" + formatted);
  console.log("TTS:", tts);
  console.groupEnd();
}

export function MessageContent({
  content,
  isStreaming,
  messageId,
}: MessageContentProps) {
  const lastLoggedRef = useRef<string>("");

  useEffect(() => {
    if (!content.trim()) return;
    if (isStreaming) return;

    const fingerprint = `${messageId ?? ""}:${content}`;
    if (fingerprint === lastLoggedRef.current) return;
    lastLoggedRef.current = fingerprint;

    logMessageFormat(messageId, content, false);
  }, [content, isStreaming, messageId]);

  if (!content.trim()) {
    return <span className="text-[var(--muted)]">{isStreaming ? "…" : ""}</span>;
  }

  const blocks = parseMessageBlocks(content);

  if (blocks.length === 0) {
    return <p className="whitespace-pre-wrap break-words">{renderInline(content, "plain")}</p>;
  }

  return (
    <div className="message-content space-y-3">
      {blocks.map((block, blockIndex) => {
        const key = `block-${blockIndex}`;

        if (block.type === "ol") {
          return (
            <ol key={key} className="list-decimal space-y-2 pl-5 marker:text-sky-400/90">
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`} className="pl-1 leading-relaxed">
                  {renderInline(item, `${key}-li-${itemIndex}`)}
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === "ul") {
          return (
            <ul key={key} className="list-disc space-y-2 pl-5 marker:text-emerald-400/80">
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`} className="pl-1 leading-relaxed">
                  {renderInline(item, `${key}-li-${itemIndex}`)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={key} className="whitespace-pre-wrap break-words leading-relaxed">
            {block.lines.map((line, lineIndex) => (
              <Fragment key={`${key}-line-${lineIndex}`}>
                {lineIndex > 0 && <br />}
                {renderInline(line, `${key}-line-${lineIndex}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
