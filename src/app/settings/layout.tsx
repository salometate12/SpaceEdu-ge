import { ProfileShell } from "@/components/profile/ProfileShell";
import { loadProfileShellData } from "@/lib/profile-shell-data";
import { getServerAccountSpace } from "@/lib/auth-server";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const [shell, space] = await Promise.all([
    loadProfileShellData(),
    getServerAccountSpace(),
  ]);
  return (
    <ProfileShell {...shell} space={space}>
      {children}
    </ProfileShell>
  );
}
