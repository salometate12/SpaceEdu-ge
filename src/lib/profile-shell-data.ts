import { getProfileData } from "@/lib/profile";
import {
  getCurrentServerUserName,
  getServerAccountMeta,
} from "@/lib/auth-server";
import { getPlanStatus } from "@/lib/subscription";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";

export interface ProfileShellData {
  userName: string;
  initials: string;
  planLabel: string;
  streakDays: number;
}

/**
 * The values the profile/settings sidebar shows: the real registered name and
 * initials, the current plan label, and the streak length. Everything falls
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

  return { userName, initials, planLabel, streakDays: user.currentStreak };
}

/** Read the account space, defaulting to abiturient when unknown. */
export function resolveShellSpace(space: SpaceeduSpace | null): SpaceeduSpace {
  return space ?? "abiturient";
}
