import { SettingsMenuRoute } from "@/components/profile/SettingsMenuRoute";

/**
 * Phones: the profile menu screen (drawn by ProfileShell on this path).
 * Desktop has the side menu instead, so it moves on to the profile form.
 */
export default function SettingsIndexPage() {
  return <SettingsMenuRoute />;
}
