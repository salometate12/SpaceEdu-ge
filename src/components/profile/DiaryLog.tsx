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
    <section className="dashboard-glass-card relative overflow-hidden rounded-[32px] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="headline text-xl font-black text-[var(--text-primary)]">დღიური</h3>
        <Link
          href="/profile/stats"
          className="text-xs font-bold text-violet-600 transition-colors hover:text-violet-700 dark:text-cyan-300 dark:hover:text-cyan-200"
        >
          ყველა ნახვა →
        </Link>
      </div>
      <div className="space-y-2.5">
        {entries.slice(0, 10).map((entry) => {
          const Icon = TYPE_ICON[entry.type];
          return (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3 transition-transform hover:-translate-y-0.5"
              style={{ background: `color-mix(in oklab, ${entry.color}, white 90%)` }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${entry.color}, white 65%)`,
                    color: entry.color,
                  }}
                >
                  <Icon className="h-4 w-4 stroke-[2.25]" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--text-primary)]">{entry.title}</p>
                  <p className="text-xs font-medium text-[var(--text-muted)]">{entry.detail}</p>
                </div>
              </div>
              <span className="mono shrink-0 text-xs font-bold text-[var(--text-muted)]">
                {entry.timestamp}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
