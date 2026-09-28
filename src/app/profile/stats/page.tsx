import { getProfileData } from "@/lib/profile";
import { StatsView } from "@/components/profile/StatsView";

export default async function ProfileStatsPage() {
  const { user } = await getProfileData();
  return <StatsView user={user} />;
}
