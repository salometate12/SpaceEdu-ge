import { ProfileShell } from "@/components/profile/ProfileShell";
import { getServerWorkingSpace } from "@/lib/auth-server";
import { loadProfileShellData } from "@/lib/profile-shell-data";

/**
 * /profile is the student overview (space-guarded), /profile/stats/* is
 * shared by both spaces: the menu follows the working space either way.
 */
export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const [shell, working] = await Promise.all([loadProfileShellData(), getServerWorkingSpace()]);
  return (
    <ProfileShell {...shell} space={working.space ?? "student"} isAdmin={working.isAdmin}>
      {children}
    </ProfileShell>
  );
}
