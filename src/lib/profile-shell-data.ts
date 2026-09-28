import { getProfileData } from "@/lib/profile";
import {
  getCurrentServerUserName,
  getServerAccountMeta,
} from "@/lib/auth-server";
import { getPlanStatus } from "@/lib/subscription";

export interface ProfileShellData {
  userName: string;
  initials: string;
  planLabel: string;
}

/**
 * The values the profile/settings sidebar shows: the real registered name and
 * initials and the current plan label. (The streak is read on the client by
 * `useStreak`, the same as everywhere else.) Everything falls
 * back gracefully when there's no session (dev / signed-out preview).
 */
export async function loadProfileShellData(): Promise<ProfileShellData> {
  const { user } = await getProfileData();
  const [serverName, accountMeta] = await Promise.all([
    getCurrentServerUserName(),
    getServerAccountMeta(),
  ]);

  let userName = user.name;
  let initials = user.initials;
  if (serverName) {
    const fullName = [serverName.firstName, serverName.lastName].filter(Boolean).join(" ");
    if (fullName) userName = fullName;
    const nextInitials = `${serverName.firstName.charAt(0)}${serverName.lastName.charAt(0)}`
      .trim()
      .toUpperCase();
    if (nextInitials) initials = nextInitials;
  }

  const planLabel = getPlanStatus(
    accountMeta?.metadata ?? null,
    accountMeta?.createdAt ?? null,
  ).label;

  return { userName, initials, planLabel };
}
