import { getServerWorkingSpace } from "@/lib/auth-server";
import { SettingsSpace } from "@/components/profile/settings/SettingsSpace";

export default async function SettingsSpacePage() {
  const { space } = await getServerWorkingSpace();
  return <SettingsSpace space={space} />;
}
