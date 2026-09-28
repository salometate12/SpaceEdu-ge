import { ProfileShell } from "@/components/profile/ProfileShell";
import { loadProfileShellData } from "@/lib/profile-shell-data";

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const shell = await loadProfileShellData();
  return (
    <ProfileShell {...shell} space="student">
      {children}
    </ProfileShell>
  );
}
