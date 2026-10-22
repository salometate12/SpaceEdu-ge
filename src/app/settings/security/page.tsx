import { SettingsDataSync } from "@/components/profile/settings/SettingsDataSync";
import { SettingsSecurity } from "@/components/profile/settings/SettingsSecurity";

export default function SettingsSecurityPage() {
  return (
    <>
      <SettingsSecurity />
      <SettingsDataSync />
    </>
  );
}
