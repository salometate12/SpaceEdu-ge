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

const LEVEL_COLORS: Record<StudyDay["focus_level"], string> = {
  high: "text-[var(--accent-orange)]",
  medium: "text-[var(--accent-secondary)]",
  review: "text-[var(--accent-green)]",
};

export function DayCard({ day }: DayCardProps) {
  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{day.day_name}</h3>
        <span className={`text-xs font-medium ${LEVEL_COLORS[day.focus_level]}`}>
          {day.focus_level}
        </span>
      </div>
      <p className="mono mt-1 text-xs text-[var(--text-muted)]">{day.date}</p>
      <p className="mt-2 text-xs text-[var(--text-secondary)]">
        თემები: {day.topics.join(", ")}
      </p>
      <p className="text-xs text-[var(--text-secondary)]">საათი: {day.hours}სთ</p>
    </article>
  );
}
