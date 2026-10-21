"use client";

import { useState } from "react";
import { Download, Trash2, TriangleAlert } from "lucide-react";
import { SETTINGS_ROW, SETTINGS_ROW_TEXT, SettingsCard, SettingsRows, SoonBadge } from "@/components/profile/settings-ui";
import { ConfirmDialog } from "@/components/profile/settings/ConfirmDialog";
import { nbButtonClass } from "@/lib/nb-button";

// Local progress lives entirely in the browser, so clearing it is a real,
// safe client-side action. Export (needs a server bundle) and account deletion
// (needs the Supabase admin API server-side) have no route yet → "მალე".
const PROGRESS_KEYS = [
  "spaceedu-tool-usage",
  "spaceedu-daily-streak",
  "spaceedu-daily-goals",
  "spaceedu-journal-progress",
  "flashcards-progress",
];

export function SettingsDanger() {
  const [confirmClear, setConfirmClear] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleClear = () => {
    try {
      for (const key of PROGRESS_KEYS) window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    setConfirmClear(false);
    setCleared(true);
  };

  const rowClass = `${SETTINGS_ROW} justify-between`;

  return (
    <SettingsCard
      icon={TriangleAlert}
      title="საშიში ზონა"
      subtitle="ეს მოქმედებები შეუქცევადია"
      danger
      flush
    >
      <SettingsRows>
        <div className={rowClass}>
          <div className={SETTINGS_ROW_TEXT}>
            <div className="text-[13px] text-[var(--text-primary)]">მონაცემების ექსპორტი</div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              ყველა პროგრესი და კონსპექტი ერთ ფაილად
            </div>
          </div>
          <button
            type="button"
            disabled
            title="მალე"
            className={nbButtonClass({ variant: "secondary", size: "sm", className: "shrink-0" })}
          >
            <Download aria-hidden />
            ექსპორტი
            <SoonBadge />
          </button>
        </div>

        <div className={rowClass}>
          <div className={SETTINGS_ROW_TEXT}>
            <div className="text-[13px] text-[var(--text-primary)]">პროგრესის გასუფთავება</div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              Quiz ისტორია, სტრიქი და სტატისტიკა ამ მოწყობილობაზე წაიშლება
            </div>
          </div>
          {cleared ? (
            <span className="shrink-0 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              გასუფთავდა
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className={nbButtonClass({ variant: "danger", size: "sm", className: "shrink-0" })}
            >
              <Trash2 aria-hidden />
              გასუფთავება
            </button>
          )}
        </div>

        <div className={rowClass}>
          <div className={SETTINGS_ROW_TEXT}>
            <div className="text-[13px] text-[var(--text-primary)]">ანგარიშის წაშლა</div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              ყველა მონაცემი სამუდამოდ წაიშლება
            </div>
          </div>
          <button
            type="button"
            disabled
            title="მალე"
            className={nbButtonClass({ variant: "danger", size: "sm", className: "shrink-0" })}
          >
            <Trash2 aria-hidden />
            ანგარიშის წაშლა
            <SoonBadge />
          </button>
        </div>
      </SettingsRows>

      <ConfirmDialog
        open={confirmClear}
        title="პროგრესის გასუფთავება"
        message="ამ მოწყობილობაზე შენახული Quiz ისტორია, სტრიქი, დღის მიზნები და პროგრესი წაიშლება. ეს შეუქცევადია."
        confirmLabel="გასუფთავება"
        onConfirm={handleClear}
        onCancel={() => setConfirmClear(false)}
      />
    </SettingsCard>
  );
}
