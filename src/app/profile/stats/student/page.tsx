import { getServerWorkingSpace } from "@/lib/auth-server";
import { toStatsSpace } from "@/lib/activity-log";
import { OtherSpaceStats } from "@/components/stats/OtherSpaceStats";
import { StudentStatsPage } from "@/components/stats/StudentStatsPage";

export default async function StudentStatsRoute() {
  const { space } = await getServerWorkingSpace();
  const working = toStatsSpace(space);
  if (working !== "student") return <OtherSpaceStats page="student" working={working} />;
  return <StudentStatsPage />;
}
