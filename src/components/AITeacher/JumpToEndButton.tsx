import { ArrowDown } from "lucide-react";

/** The round "↓" that scrolls to the end of a long answer; it sits just
 * above the chat input (its parent is `relative`). */
export function JumpToEndButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="ბოლოში"
      title="ბოლოში"
      className="absolute -top-12 left-1/2 z-10 inline-flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] shadow-[0_4px_14px_-6px_rgba(15,23,42,0.3)] transition hover:bg-[var(--bg-card-hover)]"
    >
      <ArrowDown className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}
