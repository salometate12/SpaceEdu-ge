import { DEFAULT_BADGES } from "@/lib/badges";
import { getProfileData } from "@/lib/profile";
import { buildWeekStreak } from "@/lib/streak";
import { getCurrentServerUserName } from "@/lib/auth-server";
import { BadgeGrid } from "@/components/profile/BadgeGrid";
import { DailyGoals } from "@/components/profile/DailyGoals";
import { DiaryLog } from "@/components/profile/DiaryLog";
import { MetricCards } from "@/components/profile/MetricCards";
import { OverviewHeader } from "@/components/profile/OverviewHeader";
import { ProfileChallengeHero } from "@/components/profile/ProfileChallengeHero";
import { StreakTracker } from "@/components/profile/StreakTracker";
import { SubjectProgress } from "@/components/profile/SubjectProgress";

export default async function ProfilePage() {
  const { user } = await getProfileData();
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

  return (
    <>
      <OverviewHeader name={user.name} initials={user.initials} space="student" />

      <ProfileChallengeHero user={user} week={week} />

      <DailyGoals showDashboardToggle />

      <MetricCards examDate={user.examDate} />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <StreakTracker />
        <SubjectProgress />
      </section>

      <DiaryLog />

      <BadgeGrid badges={DEFAULT_BADGES} />
    </>
  );
}
