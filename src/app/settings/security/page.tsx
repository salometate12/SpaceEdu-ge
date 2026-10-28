import { SettingsPageTitle } from "@/components/profile/settings-ui";
import { SettingsDataSync } from "@/components/profile/settings/SettingsDataSync";
import { SettingsSecurity } from "@/components/profile/settings/SettingsSecurity";
import { SettingsSessions } from "@/components/profile/settings/SettingsSessions";

export default function SettingsSecurityPage() {
  return (
    <>
      <SettingsPageTitle>უსაფრთხოება და სესიები</SettingsPageTitle>
      <SettingsSecurity />
      <SettingsSessions />
      <SettingsDataSync />
    </>
  );
}
