"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SETTINGS_PROFILE_HREF } from "@/lib/settings-nav";

/** /settings on a wide screen: the side menu is already there, so open the profile form. */
export function SettingsMenuRoute() {
  const router = useRouter();
  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) router.replace(SETTINGS_PROFILE_HREF);
  }, [router]);
  return null;
}
