import Link from "next/link";
import { ChartNoAxesColumn, Pencil } from "lucide-react";
import { DEFAULT_BADGES } from "@/lib/badges";
import { getProfileData, getSpaceLabel, type DailyGoal } from "@/lib/profile";
import { buildWeekStreak } from "@/lib/streak";
import { getCurrentServerUserName } from "@/lib/auth-server";
import { BadgeGrid } from "@/components/profile/BadgeGrid";
import { DailyGoals } from "@/components/profile/DailyGoals";
import { DiaryLog } from "@/components/profile/DiaryLog";
import { MetricCards } from "@/components/profile/MetricCards";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { StreakTracker } from "@/components/profile/StreakTracker";
import { SubjectProgress } from "@/components/profile/SubjectProgress";

const INITIAL_GOALS: DailyGoal[] = [
  { id: "goal-1", text: "ბიოლოგიის 1 quiz", done: true, type: "quiz" },
  { id: "goal-2", text: "ქიმიის კონსპექტის გამეორება", done: false, type: "read" },
  { id: "goal-3", text: "AI ჩატი — რთული თემა", done: true, type: "chat" },
  { id: "goal-4", text: "Study plan task #4", done: false, type: "study" },
  { id: "goal-5", text: "ისტორიის მოკლე ტესტი", done: false, type: "quiz" },
];

export default async function ProfilePage() {
  const { user, subjects, diary } = await getProfileData();
  const serverUserName = await getCurrentServerUserName();
  if (serverUserName) {
    const fullName = [serverUserName.firstName, serverUserName.lastName]
      .filter(Boolean)
      .join(" ");
    if (fullName) user.name = fullName;
    const initials = `${serverUserName.firstName.charAt(0)}${serverUserName.lastName.charAt(0)}`
      .trim()
      .toUpperCase();
    if (initials) user.initials = initials;
  }
  const week = buildWeekStreak(user.currentStreak);
  const spaceLabel = getSpaceLabel(user.space);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="headline text-2xl font-bold text-white">პროფილი</h1>
        <div className="flex gap-2">
          <Link
            href="/profile/stats"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/85 transition-all hover:border-cyan-500/40 hover:bg-cyan-500/5 hover:text-white"
          >
            <ChartNoAxesColumn className="h-4 w-4 stroke-[1.75]" />
            სტატისტიკა
          </Link>
          <Link
            href="/profile/edit"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/85 transition-all hover:border-cyan-500/40 hover:bg-cyan-500/5 hover:text-white"
          >
            <Pencil className="h-4 w-4 stroke-[1.75]" />
            რედაქტირება
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] px-4 py-2.5 text-sm text-zinc-400">
        შენი სფეისი: <span className="headline font-semibold text-cyan-300">{spaceLabel}</span>
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ProfileCard user={user} />
        <div className="space-y-4">
          <MetricCards user={user} />
          <StreakTracker
            currentStreak={user.currentStreak}
            personalBest={user.personalBestStreak}
            week={week}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <SubjectProgress subjects={subjects} />
        <DiaryLog entries={diary} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <BadgeGrid badges={DEFAULT_BADGES} />
        <DailyGoals initialGoals={INITIAL_GOALS} />
      </section>
    </main>
  );
}
