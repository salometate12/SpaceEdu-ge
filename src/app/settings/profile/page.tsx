import { getServerAccountMeta } from "@/lib/auth-server";
import {
  SettingsProfileForm,
  type ProfileFormValues,
} from "@/components/profile/settings/SettingsProfileForm";

function str(meta: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export default async function SettingsProfilePage() {
  const account = await getServerAccountMeta();
  const meta = account?.metadata ?? {};
  const initial: ProfileFormValues = {
    firstName: str(meta, "firstName", "first_name"),
    lastName: str(meta, "lastName", "last_name"),
    bio: str(meta, "bio"),
    city: str(meta, "city"),
    institution: str(meta, "institution", "school", "university"),
  };
  const initials =
    `${initial.firstName.charAt(0)}${initial.lastName.charAt(0)}`.trim().toUpperCase();

  return (
    <SettingsProfileForm
      initial={initial}
      email={account?.email ?? ""}
      initials={initials}
    />
  );
}
