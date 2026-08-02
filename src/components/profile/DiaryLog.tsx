import Link from "next/link";
import {
  Bot,
  CalendarDays,
  FileText,
  ListChecks,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import type { DiaryEntry, DiaryType } from "@/lib/profile";

interface DiaryLogProps {
  entries: DiaryEntry[];
}

const TYPE_ICON: Record<DiaryType, LucideIcon> = {
  quiz: ListChecks,
  study_plan: CalendarDays,
  ai_chat: Bot,
  notes: FileText,
  presentation: Presentation,
};

export function DiaryLog({ entries }: DiaryLogProps) {
  return (
    <section className="card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="headline text-lg font-semibold">დღიური</h3>
        <Link
          href="/profile/stats"
          className="text-xs font-medium text-[var(--accent-purple)] hover:opacity-80"
        >
          ყველა ნახვა →
        </Link>
      </div>
      <div className="space-y-2">
        {entries.slice(0, 10).map((entry) => {
          const Icon = TYPE_ICON[entry.type];
          return (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 transition-colors hover:border-[var(--border-hover)]"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${entry.color}, transparent 82%)`,
                    color: entry.color,
                  }}
                >
                  <Icon className="h-3.5 w-3.5 stroke-[2]" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm">{entry.title}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{entry.detail}</p>
                </div>
              </div>
              <span className="mono shrink-0 text-xs text-[var(--text-secondary)]">
                {entry.timestamp}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
