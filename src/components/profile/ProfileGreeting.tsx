"use client";

import { useEffect, useState } from "react";
import { Award, Flame } from "lucide-react";
import { useStreak } from "@/hooks/useStreak";
import { DAILY_GOALS_UPDATED_EVENT, loadDailyGoals } from "@/lib/daily-goals";
import { goalsForDay } from "@/lib/goals-card";
import { localToday } from "@/lib/study-plan-board";
import { SpaceAvatar } from "./SpaceAvatar";
import { useBadges } from "./useBadges";

interface ProfileGreetingProps {
  space: "student" | "abiturient";
  name: string;
  initials: string;
}

const SPACE_CHIP = {
  student: { label: "სტუდენტის სივრცე", className: "bg-[#fdf2f8] text-[#9d174d] dark:bg-[rgba(236,72,153,0.14)] dark:text-[#f9a8d4]", dot: "bg-[#ec4899]" },
  abiturient: { label: "აბიტურიენტის სივრცე", className: "bg-[#fefce8] text-[#854d0e] dark:bg-[rgba(250,204,21,0.12)] dark:text-[#fde68a]", dot: "bg-[#facc15]" },
} as const;

/** Today's goals still open, or null until read on the client. */
function useOpenGoalsToday(): number | null {
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => {
    const read = () => setOpen(goalsForDay(loadDailyGoals(), localToday()).filter((goal) => !goal.done).length);
    read();
    window.addEventListener(DAILY_GOALS_UPDATED_EVENT, read);
    return () => window.removeEventListener(DAILY_GOALS_UPDATED_EVENT, read);
  }, []);
  return open;
}

export function greetingLine(openGoals: number | null): string {
  if (openGoals === null) return "";
  if (openGoals === 0) return "დაიწყე დღე ერთი მიზნით.";
  return `დღეს ${openGoals} მიზანი დაგრჩა. შეინარჩუნე სტრიქი.`;
}

/**
 * The overview's first card: who you are, which space, one line about today,
 * and the two numbers people come back for — the streak and the badges.
 */
export function ProfileGreeting({ space, name, initials }: ProfileGreetingProps) {
  const streak = useStreak();
  const openGoals = useOpenGoalsToday();
  const firstName = name.split(" ")[0] || name;
  const badges = useBadges(space);
  const unlocked = badges?.filter((badge) => badge.unlocked).length ?? 0;
  const chip = SPACE_CHIP[space];

  return (
    <section className="ps-card flex flex-col gap-5 p-[26px] lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <SpaceAvatar space={space} initials={initials} className="h-16 w-16 rounded-[20px] text-[22px]" />
        <div className="min-w-0">
          <span className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-semibold ${chip.className}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${chip.dot}`} aria-hidden />
            {chip.label}
          </span>
          <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-tight text-[var(--ps-title)] [overflow-wrap:anywhere]">
            {firstName ? `გამარჯობა, ${firstName}!` : "გამარჯობა!"}
          </h1>
          <p className="mt-1 min-h-[1.4em] text-[14.5px] text-[var(--ps-text)]">{greetingLine(openGoals)}</p>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-3 lg:w-[300px]">
        <div className="rounded-[18px] bg-[var(--ps-yellow-bg)] p-4 text-[var(--ps-yellow)]">
          <Flame className="h-5 w-5" strokeWidth={2} aria-hidden />
          <p className="mt-2 text-[20px] font-bold leading-none">{streak.ready ? `${streak.current} დღე` : "—"}</p>
          <p className="mt-1 text-[13px] font-medium">სტრიქი</p>
        </div>
        <div className="rounded-[18px] bg-[var(--ps-green-bg)] p-4 text-[var(--ps-green)]">
          <Award className="h-5 w-5" strokeWidth={2} aria-hidden />
          <p className="mt-2 text-[20px] font-bold leading-none">
            {badges ? `${unlocked} / ${badges.length}` : "—"}
          </p>
          <p className="mt-1 text-[13px] font-medium">ბეჯი</p>
        </div>
      </div>
    </section>
  );
}
