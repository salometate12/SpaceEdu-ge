import { Clock } from "lucide-react";
import { FOCUS_LEVEL_CONFIG } from "./focus-level-config";

interface StudyDay {
  date: string;
  day_name: string;
  topics: string[];
  hours: number;
  tasks: string[];
  focus_level: "high" | "medium" | "review";
}

interface DayCardProps {
  day: StudyDay;
}

export function DayCard({ day }: DayCardProps) {
  const level = FOCUS_LEVEL_CONFIG[day.focus_level];
  const LevelIcon = level.icon;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 pl-4 dark:border-white/10 dark:bg-white/[0.03]">
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${level.bar}`} />
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{day.day_name}</h3>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${level.iconWrap}`}
        >
          <LevelIcon className="h-3 w-3" strokeWidth={2} />
          {level.label}
        </span>
      </div>
      <p className="mono mt-1 text-xs text-slate-500 dark:text-zinc-500">{day.date}</p>
      <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400">
        თემები: {day.topics.join(", ")}
      </p>
      <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-600 dark:text-zinc-400">
        <Clock className="h-3 w-3" strokeWidth={2} />
        {day.hours} საათი
      </p>
    </article>
  );
}
