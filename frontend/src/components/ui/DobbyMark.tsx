interface DobbyMarkProps {
  size?: "sm" | "md";
  className?: string;
}

export function DobbyMark({ size = "md", className = "" }: DobbyMarkProps) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 font-heading font-bold text-white shadow-lg shadow-emerald-500/20 ${dim} ${className}`}
      aria-hidden
    >
      <span className="relative z-10">D</span>
      <span className="absolute inset-0 rounded-xl bg-sky-400/20 blur-sm" />
    </div>
  );
}
