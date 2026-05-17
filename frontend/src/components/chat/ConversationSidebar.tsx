"use client";

import type { ConversationSummary } from "@dobby/shared";
import { MessageSquare, Plus, X } from "lucide-react";

interface ConversationSidebarProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onClose?: () => void;
  className?: string;
}

type ConversationGroup = {
  label: string;
  items: ConversationSummary[];
};

function formatTitle(conv: ConversationSummary): string {
  const title = conv.title?.trim();
  if (title) return title;
  return "New conversation";
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return "Now";
  if (diffMins < 60) return `${diffMins}m`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function groupConversations(conversations: ConversationSummary[]): ConversationGroup[] {
  const sorted = [...conversations].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const buckets: Record<string, ConversationSummary[]> = {
    Today: [],
    Yesterday: [],
    "This week": [],
    Older: [],
  };

  for (const conv of sorted) {
    const updated = startOfDay(new Date(conv.updated_at));
    if (updated.getTime() >= today.getTime()) {
      buckets.Today.push(conv);
    } else if (updated.getTime() >= yesterday.getTime()) {
      buckets.Yesterday.push(conv);
    } else if (updated.getTime() >= weekAgo.getTime()) {
      buckets["This week"].push(conv);
    } else {
      buckets.Older.push(conv);
    }
  }

  return (["Today", "Yesterday", "This week", "Older"] as const)
    .filter((label) => buckets[label].length > 0)
    .map((label) => ({ label, items: buckets[label] }));
}

function ConversationItem({
  conv,
  isActive,
  onSelect,
}: {
  conv: ConversationSummary;
  isActive: boolean;
  onSelect: (id: string) => void;
}) {
  const title = formatTitle(conv);
  const time = formatRelativeTime(conv.updated_at);

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(conv.id)}
        className={`group relative flex w-full cursor-pointer items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-200 ${
          isActive
            ? "bg-white/[0.07]"
            : "hover:bg-white/[0.04]"
        }`}
      >
        {isActive && (
          <span
            className="absolute bottom-1.5 left-0 top-1.5 w-0.5 rounded-full bg-emerald-400"
            aria-hidden
          />
        )}
        <span
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
            isActive
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-white/[0.04] text-[var(--muted)] group-hover:text-[var(--foreground)]"
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 pt-0.5">
          <span
            className={`block truncate text-[13px] leading-snug ${
              isActive ? "font-medium text-[var(--foreground)]" : "text-[var(--foreground)]/90"
            }`}
          >
            {title}
          </span>
          <span className="mt-0.5 block text-[11px] text-[var(--muted-strong)]">{time}</span>
        </span>
      </button>
    </li>
  );
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onClose,
  className = "",
}: ConversationSidebarProps) {
  const groups = groupConversations(conversations);

  return (
    <aside
      className={`flex h-full w-[280px] shrink-0 flex-col border-r border-white/[0.06] bg-[#070d18] ${className}`}
    >
      <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
        <h2 className="font-heading text-sm font-semibold tracking-wide text-[var(--foreground)]">
          Conversations
        </h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[var(--muted)] transition-colors duration-200 hover:bg-white/[0.06] hover:text-[var(--foreground)] md:hidden"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={onNewChat}
          className="ring-glow flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors duration-200 hover:border-emerald-500/30 hover:bg-emerald-500/[0.06] hover:text-emerald-50"
        >
          <Plus className="h-4 w-4 text-emerald-400" aria-hidden />
          New chat
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4" aria-label="Conversation history">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] text-[var(--muted)]">
              <MessageSquare className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              No conversations yet.
              <br />
              Start a new chat to begin.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <section key={group.label}>
                <h3 className="mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--muted-strong)]">
                  {group.label}
                </h3>
                <ul className="space-y-0.5">
                  {group.items.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      isActive={conv.id === activeId}
                      onSelect={onSelect}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}
