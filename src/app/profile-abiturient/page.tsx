import { loadProfileShellData } from "@/lib/profile-shell-data";
import { BadgeGrid } from "@/components/profile/BadgeGrid";
import { DailyGoals } from "@/components/profile/DailyGoals";
import { DiaryLog } from "@/components/profile/DiaryLog";
import { ProfileGreeting } from "@/components/profile/ProfileGreeting";
import { ProfileStatCards } from "@/components/profile/ProfileStatCards";
import { WeekStreakStrip } from "@/components/profile/WeekStreakStrip";

export default async function AbiturientProfilePage() {
  const { userName, initials } = await loadProfileShellData();
  // The overview, top to bottom: greeting → this week → the three numbers
  // that matter → goals → badges → the latest activity. Per-subject progress
  // lives on the stats page.
  return (
    <>
      <ProfileGreeting space="abiturient" name={userName} initials={initials} />

      <WeekStreakStrip />

      <ProfileStatCards statsHref="/profile/stats" />

      <DailyGoals />

      <BadgeGrid space="abiturient" />

      <DiaryLog statsHref="/profile/stats" />
    </>
  );
}
