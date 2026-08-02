import Link from "next/link";
import { DEFAULT_BADGES } from "@/lib/badges";
import { getProfileData, type DailyGoal } from "@/lib/profile";
import { buildWeekStreak } from "@/lib/streak";
import { BadgeGrid } from "@/components/profile/BadgeGrid";
import { DailyGoals } from "@/components/profile/DailyGoals";
import { DiaryLog } from "@/components/profile/DiaryLog";
import { MetricCards } from "@/components/profile/MetricCards";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { StreakTracker } from "@/components/profile/StreakTracker";
import { SubjectProgress } from "@/components/profile/SubjectProgress";
import { Button } from "@/components/ui/Button";

const INITIAL_GOALS: DailyGoal[] = [
  { id: "goal-1", text: "ბიოლოგიის 1 quiz", done: true, type: "quiz" },
  { id: "goal-2", text: "ქიმიის კონსპექტის გამეორება", done: false, type: "read" },
  { id: "goal-3", text: "AI ჩატი — რთული თემა", done: true, type: "chat" },
  { id: "goal-4", text: "Study plan task #4", done: false, type: "study" },
  { id: "goal-5", text: "ისტორიის მოკლე ტესტი", done: false, type: "quiz" },
];

export default async function ProfilePage() {
  const { user, subjects, diary } = await getProfileData();
  const week = buildWeekStreak(user.currentStreak);
  const spaceLabel =
    user.space === "abiturient"
      ? "აბიტურიენტი"
      : user.space === "student"
        ? "სტუდენტი"
        : "სკოლა";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="headline text-2xl font-bold">პროფილი</h1>
        <div className="flex gap-2">
          <Link href="/profile/stats">
            <Button variant="ghost">სტატისტიკა</Button>
          </Link>
          <Link href="/profile/edit">
            <Button variant="ghost">რედაქტირება</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-secondary)]">
        შენი სფეისი: <span className="headline font-semibold text-[var(--text-primary)]">{spaceLabel}</span>
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
