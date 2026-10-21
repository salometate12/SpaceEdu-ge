"use client";

import { useState, useSyncExternalStore } from "react";
import { Laptop, LogOut, MonitorSmartphone } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { SETTINGS_ROW, SETTINGS_ROW_TEXT, SettingsCard, SettingsRows } from "@/components/profile/settings-ui";
import { nbButtonClass } from "@/lib/nb-button";

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
  return { name: `${os} — ${browser}`, mobile };
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

  const DeviceIcon = device.mobile ? MonitorSmartphone : Laptop;

  return (
    <SettingsCard
      icon={MonitorSmartphone}
      title="აქტიური სესიები"
      subtitle="Supabase-ი სესიების სრულ სიას არ აბრუნებს — ჩანს მხოლოდ ეს მოწყობილობა"
      flush
    >
      <SettingsRows className="border-b">
        <div className={SETTINGS_ROW}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
            <DeviceIcon className="h-[18px] w-[18px] stroke-[1.75]" aria-hidden />
          </span>
          <div className={SETTINGS_ROW_TEXT}>
            <div className="text-[13px] text-[var(--text-primary)]">{device.name}</div>
            <div className="text-[11px] text-[var(--text-secondary)]">მიმდინარე სესია</div>
          </div>
          <span className="shrink-0 rounded-full bg-[#E1F5EE] px-2 py-0.5 text-[10px] font-medium text-[#0F6E56] dark:bg-[rgba(29,158,117,0.16)] dark:text-[#4fd1a5]">
            მიმდინარე
          </span>
        </div>
      </SettingsRows>

      <div className="px-4 py-5 sm:px-5">
        <button
          type="button"
          onClick={() => void handleSignOutOthers()}
          disabled={state === "working"}
          className={nbButtonClass({ variant: "secondary", block: true })}
        >
          <LogOut aria-hidden />
          {state === "working" ? "მიმდინარეობს..." : "ყველა სხვა სესიიდან გასვლა"}
        </button>
        {state === "done" && (
          <p role="status" className="mt-2 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
            ყველა სხვა სესია დასრულდა
          </p>
        )}
        {state === "error" && (
          <p role="alert" className="mt-2 text-center text-xs font-medium text-rose-600 dark:text-rose-400">
            ვერ მოხერხდა. სცადე თავიდან.
          </p>
        )}
      </div>
    </SettingsCard>
  );
}
