"use client";

import { Cloud, CloudOff, Loader2, Check, HardDrive, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUserDataStatus } from "@/hooks/useUserDataStatus";
import type { SyncStatus } from "@/lib/user-store";
import { SETTINGS_ROW, SETTINGS_ROW_TEXT, SETTINGS_TONE, SettingsCard, SettingsRows } from "@/components/profile/settings-ui";

const STATUS: Record<SyncStatus, { icon: LucideIcon; text: string; spin?: boolean }> = {
  synced: { icon: Check, text: "მონაცემები სინქრონიზებულია" },
  syncing: { icon: Loader2, text: "სინქრონიზაცია…", spin: true },
  offline: { icon: CloudOff, text: "offline: შეინახება, როცა ინტერნეტი დაბრუნდება" },
  error: { icon: TriangleAlert, text: "ვერ შევინახეთ — ვცდით თავიდან" },
  local: { icon: HardDrive, text: "ინახება მხოლოდ ამ მოწყობილობაზე" },
};

/** One line on whether the student's data is on their account yet. */
export function SettingsDataSync() {
  const status = useUserDataStatus();
  const { icon: Icon, text, spin } = STATUS[status];
  return (
    <SettingsCard icon={Cloud} title="მონაცემები" subtitle="საგნები, კალენდარი, ნოტები, კონსპექტები და ჩატები შენს ანგარიშზე" flush>
      <SettingsRows>
        <div className={SETTINGS_ROW} role="status" aria-live="polite">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${SETTINGS_TONE.rowIcon}`}>
            <Icon className={`h-4 w-4 stroke-[1.75] ${spin ? "animate-spin" : ""}`} aria-hidden />
          </span>
          <div className={SETTINGS_ROW_TEXT}>
            <div className="text-[13px] text-[var(--text-primary)]">{text}</div>
            <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
              ყველა მოწყობილობაზე, სადაც ამ ანგარიშით შეხვალ
            </div>
          </div>
          {status === "synced" ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#16a34a]" aria-hidden /> : null}
        </div>
      </SettingsRows>
    </SettingsCard>
  );
}
