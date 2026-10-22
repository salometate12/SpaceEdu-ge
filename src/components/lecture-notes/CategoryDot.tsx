import { journalCategory } from "@/lib/journal-categories";
import type { JournalSection } from "@/lib/lecture-notes";

/** A journal category's colour dot (lib/journal-categories). */
export function CategoryDot({ section, className = "" }: { section: JournalSection; className?: string }) {
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${className}`}
      style={{ background: journalCategory(section).color }}
      aria-hidden
    />
  );
}
