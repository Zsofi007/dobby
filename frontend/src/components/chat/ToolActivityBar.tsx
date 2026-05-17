"use client";

import type { ToolActivity } from "@/hooks/use-streaming-chat";
import { Zap } from "lucide-react";

interface ToolActivityBarProps {
  activities: ToolActivity[];
}

export function ToolActivityBar({ activities }: ToolActivityBarProps) {
  if (activities.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-2 border-b border-[var(--border)]/60 bg-[var(--surface)]/50 px-4 py-2.5 md:px-6"
      aria-live="polite"
      aria-label="Tool activity"
    >
      {activities.map((activity) => (
        <span
          key={activity.id}
          className="inline-flex cursor-default items-center gap-2 rounded-full border border-[var(--border)]/80 bg-[var(--surface-elevated)]/80 px-3 py-1 text-xs text-[var(--muted)]"
        >
          <Zap
            className={`h-3.5 w-3.5 ${
              activity.status === "running" ? "text-emerald-400" : "text-[var(--muted-strong)]"
            }`}
            aria-hidden
          />
          {activity.status === "running" && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          )}
          {activity.status === "running"
            ? `Using ${activity.name}…`
            : `Used ${activity.name}`}
        </span>
      ))}
    </div>
  );
}
