import { ProfileShell } from "@/components/profile/ProfileShell";
import { loadProfileShellData } from "@/lib/profile-shell-data";

export default async function AbiturientProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shell = await loadProfileShellData();
  return (
    <ProfileShell {...shell} space="abiturient">
      {children}
    </ProfileShell>
  );
}
