import Link from "next/link";
import { ChartNoAxesColumn, Pencil } from "lucide-react";
import { DEFAULT_BADGES } from "@/lib/badges";
import { getProfileData, INITIAL_DAILY_GOALS } from "@/lib/profile";
import { buildWeekStreak } from "@/lib/streak";
import { getCurrentServerUserName } from "@/lib/auth-server";
import { AbiturientProfileHero } from "@/components/profile/AbiturientProfileHero";
import { BadgeGrid } from "@/components/profile/BadgeGrid";
import { DailyGoals } from "@/components/profile/DailyGoals";
import { DiaryLog } from "@/components/profile/DiaryLog";
import { MetricCards } from "@/components/profile/MetricCards";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { StreakTracker } from "@/components/profile/StreakTracker";
import { SubjectProgress } from "@/components/profile/SubjectProgress";

export default async function AbiturientProfilePage() {
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
  const goalsRemaining = INITIAL_DAILY_GOALS.filter((goal) => !goal.done).length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="headline text-2xl font-bold text-[var(--text-primary)]">პროფილი</h1>
        <div className="flex gap-2">
          <Link
            href="/profile-abiturient/stats"
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-all hover:border-emerald-400 hover:text-emerald-600"
          >
            <ChartNoAxesColumn className="h-4 w-4 stroke-[1.75]" />
            სტატისტიკა
          </Link>
          <Link
            href="/profile/edit"
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-all hover:border-emerald-400 hover:text-emerald-600"
          >
            <Pencil className="h-4 w-4 stroke-[1.75]" />
            რედაქტირება
          </Link>
        </div>
      </div>

      <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-[var(--text-secondary)] dark:border-emerald-500/20 dark:bg-emerald-500/[0.04]">
        შენი სფეისი: <span className="headline font-semibold text-emerald-700 dark:text-emerald-300">აბიტურიენტი</span>
      </div>

      <AbiturientProfileHero user={user} week={week} goalsRemaining={goalsRemaining} />

      <DailyGoals initialGoals={INITIAL_DAILY_GOALS} />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ProfileCard user={user} />
        <div className="space-y-4">
          <MetricCards user={user} />
          <StreakTracker
            currentStreak={user.currentStreak}
            personalBest={user.personalBestStreak}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <SubjectProgress subjects={subjects} />
        <DiaryLog entries={diary} />
      </section>

      <BadgeGrid badges={DEFAULT_BADGES} />
    </main>
  );
}
