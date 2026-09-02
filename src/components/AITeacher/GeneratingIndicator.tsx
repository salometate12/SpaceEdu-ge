"use client";

interface GeneratingIndicatorProps {
  visible?: boolean;
  className?: string;
}

export function GeneratingIndicator({ visible = true, className = "" }: GeneratingIndicatorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="AI ფიქრობს"
      className={`flex items-center gap-2.5 transition-all duration-300 ease-out ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-1 opacity-0"
      } ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="ai-sparkle-icon h-6 w-6 shrink-0"
        fill="var(--accent-primary)"
      >
        <path d="M12 2.5l1.45 4.46a1 1 0 00.76.63l4.64 1.34-3.55 3.05a1 1 0 00-.33 1.01L16.2 18l-4.2-2.2a1 1 0 00-.93 0L6.87 18l1.36-4.01a1 1 0 00-.33-1.01L4.35 8.93l4.64-1.34a1 1 0 00.76-.63L12 2.5z" />
        <path
          opacity="0.85"
          d="M18.5 3.5l.55 1.68a.55.55 0 00.42.35l1.75.5-1.34 1.15a.55.55 0 00-.18.56l.51 1.51-1.58-.83a.55.55 0 00-.51 0l-1.58.83.51-1.51a.55.55 0 00-.18-.56l-1.34-1.15 1.75-.5a.55.55 0 00.42-.35l.55-1.68z"
        />
      </svg>

      <span className="inline-flex items-baseline gap-0.5 text-sm font-medium">
        <span className="text-[var(--accent-primary)]">AI ფიქრობს</span>
        <span className="inline-flex w-[1.1rem]" aria-hidden>
          <span className="ai-typing-dot">.</span>
          <span className="ai-typing-dot [animation-delay:0.2s]">.</span>
          <span className="ai-typing-dot [animation-delay:0.4s]">.</span>
        </span>
      </span>
    </div>
  );
}
