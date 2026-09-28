import { DEFAULT_BADGES } from "@/lib/badges";
import { getProfileData } from "@/lib/profile";
import { getCurrentServerUserName } from "@/lib/auth-server";
import { BadgeGrid } from "@/components/profile/BadgeGrid";
import { DailyGoals } from "@/components/profile/DailyGoals";
import { DiaryLog } from "@/components/profile/DiaryLog";
import { ProfileChallengeHero } from "@/components/profile/ProfileChallengeHero";
import { ProfileStatCards } from "@/components/profile/ProfileStatCards";
import { SubjectProgress } from "@/components/profile/SubjectProgress";
import { WeekStreakStrip } from "@/components/profile/WeekStreakStrip";

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
  // The overview, top to bottom: greeting → this week → the three numbers
  // that matter → goals → the rest. No exam countdown: the only exam date
  // is the profile mock's, not this user's, so there is nothing true to show.
  return (
    <div className="flex flex-col gap-5">
      <ProfileChallengeHero user={user} />

      <WeekStreakStrip space="student" />

      <ProfileStatCards statsHref="/profile/stats" />

      <DailyGoals showDashboardToggle />

      <SubjectProgress addHref="/dashboard-student" />

      <DiaryLog statsHref="/profile/stats" />

      <BadgeGrid badges={DEFAULT_BADGES} />
    </div>
  );
}
