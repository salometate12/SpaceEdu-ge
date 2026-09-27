import { getProfileData } from "@/lib/profile";
import { AbiturientStatsView } from "@/components/profile/AbiturientStatsView";

export default async function AbiturientProfileStatsPage() {
  const { user } = await getProfileData();
  return <AbiturientStatsView user={user} />;
}
