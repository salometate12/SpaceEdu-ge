"use client";

import { CloudOff, Loader2, Check, HardDrive, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUserDataStatus } from "@/hooks/useUserDataStatus";
import type { SyncStatus } from "@/lib/user-store";
import { ROW_SUB, ROW_TITLE, SETTINGS_ROW, SETTINGS_ROW_TEXT, SettingsCard, SettingsRows } from "@/components/profile/settings-ui";

const STATUS: Record<SyncStatus, { icon: LucideIcon; text: string; spin?: boolean }> = {
  synced: { icon: Check, text: "მონაცემები სინქრონიზებულია" },
  syncing: { icon: Loader2, text: "სინქრონიზაცია…", spin: true },
  offline: { icon: CloudOff, text: "ინტერნეტი არ არის: შეინახება, როცა დაბრუნდება" },
  error: { icon: TriangleAlert, text: "ვერ შევინახეთ, ვცდით თავიდან" },
  local: { icon: HardDrive, text: "ინახება მხოლოდ ამ მოწყობილობაზე" },
};

/** One line on whether the student's data is on their account yet. */
export function SettingsDataSync() {
  const status = useUserDataStatus();
  const { icon: Icon, text, spin } = STATUS[status];
  return (
    <SettingsCard title="მონაცემები" subtitle="საგნები, კალენდარი, ჩანაწერები და საუბრები შენს ანგარიშზე" flush>
      <SettingsRows>
        <div className={SETTINGS_ROW} role="status" aria-live="polite">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ps-soft)] text-[var(--ps-text)]">
            <Icon className={`h-[18px] w-[18px] ${spin ? "animate-spin" : ""}`} strokeWidth={1.8} aria-hidden />
          </span>
          <div className={SETTINGS_ROW_TEXT}>
            <div className={ROW_TITLE}>{text}</div>
            <div className={ROW_SUB}>ყველა მოწყობილობაზე, სადაც ამ ანგარიშით შეხვალ</div>
          </div>
        </div>
      </SettingsRows>
    </SettingsCard>
  );
}
