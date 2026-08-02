import Link from "next/link";
import type { DiaryEntry } from "@/lib/profile";

interface DiaryLogProps {
  entries: DiaryEntry[];
}

export function DiaryLog({ entries }: DiaryLogProps) {
  return (
    <section className="card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="headline text-lg font-semibold">დღიური</h3>
        <Link href="/profile/stats" className="text-xs text-purple-300 hover:text-purple-200">
          ყველა ნახვა →
        </Link>
      </div>
      <div className="space-y-2">
        {entries.slice(0, 10).map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2"
          >
            <div className="min-w-0 flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <div className="min-w-0">
                <p className="truncate text-sm">{entry.title}</p>
                <p className="text-xs text-[var(--text-secondary)]">{entry.detail}</p>
              </div>
            </div>
            <span className="mono shrink-0 text-xs text-[var(--text-secondary)]">
              {entry.timestamp}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
