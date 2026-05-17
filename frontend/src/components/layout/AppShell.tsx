import { Settings } from "lucide-react";
import { DobbyMark } from "@/components/ui/DobbyMark";

interface AppShellProps {
  children: React.ReactNode;
  onOpenSettings?: () => void;
  sidebar?: React.ReactNode;
}

export function AppShell({ children, onOpenSettings, sidebar }: AppShellProps) {
  return (
    <div className="app-mesh flex min-h-screen flex-col">
      <header className="glass-panel sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border)]/60 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <DobbyMark />
          <div>
            <h1 className="font-heading text-lg font-semibold tracking-tight text-[var(--foreground)]">
              Dobby
            </h1>
            <p className="text-xs text-[var(--muted)]">Personal AI assistant</p>
          </div>
        </div>
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open settings"
            className="ring-glow flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)]/50 px-3 py-2 text-sm text-[var(--muted)] transition-colors duration-200 hover:border-emerald-500/40 hover:text-[var(--foreground)]"
          >
            <Settings className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Settings</span>
          </button>
        )}
      </header>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {sidebar}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
