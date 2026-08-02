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
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#13131A]/60 p-6 backdrop-blur-xl transition-colors hover:border-white/[0.15]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="headline text-lg font-semibold text-white">დღიური</h3>
        <Link
          href="/profile/stats"
          className="text-xs font-medium text-cyan-300 transition-colors hover:text-cyan-200"
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
              className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-colors hover:border-white/[0.12]"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${entry.color}, transparent 85%)`,
                    borderColor: `color-mix(in oklab, ${entry.color}, transparent 60%)`,
                    color: entry.color,
                  }}
                >
                  <Icon className="h-3.5 w-3.5 stroke-[2]" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm text-zinc-200">{entry.title}</p>
                  <p className="text-xs text-zinc-500">{entry.detail}</p>
                </div>
              </div>
              <span className="mono shrink-0 text-xs text-zinc-500">
                {entry.timestamp}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
