"use client";

import { useState, useSyncExternalStore } from "react";
import { Laptop, LogOut, Smartphone } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import {
  ActiveBadge,
  CARD_X,
  psButton,
  ROW_SUB,
  ROW_TITLE,
  SETTINGS_ROW,
  SETTINGS_ROW_TEXT,
  SettingsCard,
  SettingsRows,
} from "@/components/profile/settings-ui";

function describeDevice(ua: string): { name: string; mobile: boolean } {
  const mobile = /iPhone|iPad|Android|Mobile/i.test(ua);
  let os = "მოწყობილობა";
  if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Macintosh|Mac OS/i.test(ua)) os = "Mac";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Linux/i.test(ua)) os = "Linux";
  let browser = "ბრაუზერი";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  return { name: `${os} · ${browser}`, mobile };
}

const DEFAULT_DEVICE = { name: "ეს მოწყობილობა", mobile: false };
const subscribeNoop = () => () => {};

// useSyncExternalStore needs the same object back for the same input;
// a fresh one on every call made React loop („Maximum update depth“).
let deviceCache: { ua: string; device: { name: string; mobile: boolean } } | null = null;
function currentDevice() {
  const ua = navigator.userAgent;
  if (deviceCache?.ua !== ua) deviceCache = { ua, device: describeDevice(ua) };
  return deviceCache.device;
}

export function SettingsSessions() {
  // Client-only read of the current device — no state sync needed, so
  // useSyncExternalStore keeps SSR and hydration consistent without an effect.
  const device = useSyncExternalStore(
    subscribeNoop,
    currentDevice,
    () => DEFAULT_DEVICE,
  );
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");

  const handleSignOutOthers = async () => {
    if (!isSupabaseBrowserConfigured()) {
      setState("error");
      return;
    }
    setState("working");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) throw error;
      setState("done");
    } catch {
      setState("error");
    }
  };

  const DeviceIcon = device.mobile ? Smartphone : Laptop;

  // Only this device is listed: the others can't be named from the browser,
  // but they can all be signed out at once.
  return (
    <SettingsCard id="sessions" title="აქტიური სესიები" subtitle="მოწყობილობები, სადაც ანგარიშში ხარ შესული" flush>
      <SettingsRows>
        <div className={SETTINGS_ROW}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ps-soft)] text-[var(--ps-text)]">
            <DeviceIcon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
          </span>
          <div className={SETTINGS_ROW_TEXT}>
            <div className={ROW_TITLE}>{device.name}</div>
            <div className={ROW_SUB}>ეს მოწყობილობა</div>
          </div>
          <ActiveBadge>მიმდინარე</ActiveBadge>
        </div>
      </SettingsRows>

      <div className={`${CARD_X} pb-6 pt-3`}>
        {state === "done" && (
          <p role="status" className="mb-3 text-[13.5px] font-medium text-[var(--ps-ok)]">
            სხვა მოწყობილობებიდან გამოხვედი
          </p>
        )}
        {state === "error" && (
          <p role="alert" className="mb-3 text-[13.5px] font-medium text-[var(--ps-danger)]">
            ვერ მოხერხდა. სცადე თავიდან.
          </p>
        )}
        <div className="ps-actions">
          <button
            type="button"
            onClick={() => void handleSignOutOthers()}
            disabled={state === "working"}
            className={psButton("secondary")}
          >
            <LogOut aria-hidden />
            {state === "working" ? "მიმდინარეობს…" : "სხვა მოწყობილობებიდან გასვლა"}
          </button>
        </div>
      </div>
    </SettingsCard>
  );
}
