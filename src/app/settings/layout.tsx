import { ProfileShell } from "@/components/profile/ProfileShell";
import { loadProfileShellData } from "@/lib/profile-shell-data";
import { getServerWorkingSpace } from "@/lib/auth-server";

/**
 * /settings/* belongs to no space, so the menu follows the *working* space
 * (where the user just came from), not the account's: an admin who opened
 * settings from the student profile keeps the student menu.
 */
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const [shell, working] = await Promise.all([loadProfileShellData(), getServerWorkingSpace()]);
  return (
    <ProfileShell {...shell} space={working.space} isAdmin={working.isAdmin}>
      {children}
    </ProfileShell>
  );
}
