import { getProfileData } from "@/lib/profile";
import { StatsView } from "@/components/profile/StatsView";

export default async function ProfileStatsPage() {
  const { user } = await getProfileData();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <StatsView user={user} />
    </main>
  );
}
