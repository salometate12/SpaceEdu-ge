import { redirect } from "next/navigation";
import { SETTINGS_PROFILE_HREF } from "@/lib/settings-nav";

export default function SettingsIndexPage() {
  redirect(SETTINGS_PROFILE_HREF);
}
