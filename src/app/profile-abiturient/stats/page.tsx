import { getProfileData } from "@/lib/profile";
import { AbiturientStatsView } from "@/components/profile/AbiturientStatsView";

export default async function AbiturientProfileStatsPage() {
  const { user } = await getProfileData();
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <AbiturientStatsView user={user} />
    </main>
  );
}
