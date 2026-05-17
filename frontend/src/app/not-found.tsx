import Link from "next/link";
import { DobbyMark } from "@/components/ui/DobbyMark";

export default function NotFound() {
  return (
    <div className="app-mesh flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <DobbyMark size="md" />
      <div className="space-y-2">
        <h1 className="font-heading text-xl font-semibold">Page not found</h1>
        <p className="text-sm text-[var(--muted)]">
          That route doesn&apos;t exist in Dobby&apos;s system.
        </p>
      </div>
      <Link
        href="/"
        className="ring-glow cursor-pointer rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-emerald-500"
      >
        Return to chat
      </Link>
    </div>
  );
}
