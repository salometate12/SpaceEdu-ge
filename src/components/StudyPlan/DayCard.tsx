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
    <article
      className={`rounded-xl border border-l-4 ${level.accent} border-[var(--border)] bg-[var(--bg-secondary)] p-3`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{day.day_name}</h3>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${level.iconWrap}`}
        >
          <LevelIcon className="h-3 w-3" strokeWidth={2} />
          {level.label}
        </span>
      </div>
      <p className="mono mt-1 text-xs text-[var(--text-muted)]">{day.date}</p>
      <p className="mt-2 text-xs text-[var(--text-secondary)]">
        თემები: {day.topics.join(", ")}
      </p>
      <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
        <Clock className="h-3 w-3" strokeWidth={2} />
        {day.hours} საათი
      </p>
    </article>
  );
}
