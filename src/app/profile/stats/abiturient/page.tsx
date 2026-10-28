import { getServerWorkingSpace } from "@/lib/auth-server";
import { toStatsSpace } from "@/lib/activity-log";
import { AbiturientStatsPage } from "@/components/stats/AbiturientStatsPage";
import { OtherSpaceStats } from "@/components/stats/OtherSpaceStats";

export default async function AbiturientStatsRoute() {
  const { space } = await getServerWorkingSpace();
  const working = toStatsSpace(space);
  if (working !== "abiturient") return <OtherSpaceStats page="abiturient" working={working} />;
  return <AbiturientStatsPage />;
}
