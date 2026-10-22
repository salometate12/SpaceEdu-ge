"use client";

import { useState } from "react";
import { Download, Trash2, TriangleAlert } from "lucide-react";
import { SETTINGS_ROW, SETTINGS_ROW_TEXT, SettingsCard, SettingsRows, SoonBadge } from "@/components/profile/settings-ui";
import { ConfirmDialog } from "@/components/profile/settings/ConfirmDialog";
import { nbButtonClass } from "@/lib/nb-button";
import { userStore } from "@/lib/user-data";
import {
  CATEGORY_ACCURACY_KEY,
  DAILY_GOALS_KEY,
  DAILY_QUESTS_KEY,
  DECK_PROGRESS_KEY,
  JOURNAL_PROGRESS_KEY,
  QUIZ_STATS_KEY,
  STREAK_KEY,
  TOOL_USAGE_KEY,
} from "@/lib/user-data-keys";

// Progress lives on the account (lib/user-data): removing it through the
// store clears it here and on the account, so no device brings it back.
// Export (needs a server bundle) and account deletion (needs the Supabase
// admin API server-side) have no route yet → "მალე".
const PROGRESS_KEYS = [
  TOOL_USAGE_KEY,
  STREAK_KEY,
  DAILY_GOALS_KEY,
  DAILY_QUESTS_KEY,
  JOURNAL_PROGRESS_KEY,
  DECK_PROGRESS_KEY,
  QUIZ_STATS_KEY,
  CATEGORY_ACCURACY_KEY,
];

export function SettingsDanger() {
  const [confirmClear, setConfirmClear] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleClear = () => {
    try {
      for (const key of PROGRESS_KEYS) userStore.remove(key);
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
              Quiz ისტორია, სტრიქი და სტატისტიკა ყველა მოწყობილობაზე წაიშლება
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
        message="Quiz ისტორია, სტრიქი, დღის მიზნები და პროგრესი წაიშლება შენი ანგარიშიდან — ყველა მოწყობილობაზე. ეს შეუქცევადია."
        confirmLabel="გასუფთავება"
        onConfirm={handleClear}
        onCancel={() => setConfirmClear(false)}
      />
    </SettingsCard>
  );
}
