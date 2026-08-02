export interface StreakDay {
  label: string;
  fullLabel: string;
  status: "done" | "today" | "missed" | "upcoming";
}

const LABELS = [
  { short: "ო", full: "ორშ" },
  { short: "ს", full: "სამ" },
  { short: "ო", full: "ოთხ" },
  { short: "ხ", full: "ხუთ" },
  { short: "პ", full: "პარ" },
  { short: "შ", full: "შაბ" },
  { short: "კ", full: "კვი" },
];

export function buildWeekStreak(currentStreak: number): StreakDay[] {
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  return LABELS.map((label, idx) => {
    if (idx < todayIndex) {
      return {
        label: label.short,
        fullLabel: label.full,
        status: idx >= todayIndex - Math.min(currentStreak, 6) ? "done" : "missed",
      };
    }
    if (idx === todayIndex) {
      return { label: label.short, fullLabel: label.full, status: "today" };
    }
    return { label: label.short, fullLabel: label.full, status: "upcoming" };
  });
}

export function shouldResetStreak({
  studiedToday,
  freezeUsed,
}: {
  studiedToday: boolean;
  freezeUsed: boolean;
}): boolean {
  return !studiedToday && !freezeUsed;
}
