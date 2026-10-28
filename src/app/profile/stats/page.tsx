import { redirect } from "next/navigation";
import { getServerWorkingSpace } from "@/lib/auth-server";
import { NO_SPACE_ADMIN_HREF, SELECT_SPACE_HREF, statsPageForSpace } from "@/lib/access-control";

/** „სტატისტიკა“ everywhere links here: on to the working space's own page. */
export default async function ProfileStatsPage() {
  const { space, isAdmin } = await getServerWorkingSpace();
  if (!space) redirect(isAdmin ? NO_SPACE_ADMIN_HREF : SELECT_SPACE_HREF);
  redirect(statsPageForSpace(space));
}
