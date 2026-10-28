"use client";

import { useState } from "react";
import {
  psButton,
  ROW_SUB,
  ROW_TITLE,
  SETTINGS_ROW,
  SETTINGS_ROW_TEXT,
  SettingsCard,
  SettingsPageTitle,
  SettingsRows,
  SoonBadge,
} from "@/components/profile/settings-ui";
import { ConfirmDialog } from "@/components/profile/settings/ConfirmDialog";
import { userStore } from "@/lib/user-data";
import {
  ACTIVITY_LOG_KEY,
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
// Account deletion needs the Supabase admin API server-side and has no
// route yet → „მალე“.
const PROGRESS_KEYS = [
  ACTIVITY_LOG_KEY,
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

  return (
    <>
      <SettingsPageTitle>საშიში ზონა</SettingsPageTitle>

      <SettingsCard title="საშიში ზონა" subtitle="ამ მოქმედებების დაბრუნება შეუძლებელია" danger flush>
        <SettingsRows>
          <div className={SETTINGS_ROW}>
            <div className={SETTINGS_ROW_TEXT}>
              <div className={ROW_TITLE}>პროგრესის გასუფთავება</div>
              <div className={ROW_SUB}>ქვიზების ისტორია, სტრიქი, მიზნები და სტატისტიკა წაიშლება ყველა მოწყობილობაზე</div>
            </div>
            {cleared ? (
              <span role="status" className="shrink-0 text-[13.5px] font-semibold text-[var(--ps-ok)]">
                გასუფთავდა
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmClear(true)} className={psButton("danger")}>
                გასუფთავება
              </button>
            )}
          </div>

          <div className={SETTINGS_ROW}>
            <div className={SETTINGS_ROW_TEXT}>
              <div className={ROW_TITLE}>ანგარიშის წაშლა</div>
              <div className={ROW_SUB}>ანგარიში და ყველა მონაცემი სამუდამოდ წაიშლება</div>
            </div>
            <span className="flex shrink-0 items-center gap-2">
              <SoonBadge />
              <button type="button" disabled className={psButton("danger")}>
                ანგარიშის წაშლა
              </button>
            </span>
          </div>
        </SettingsRows>
      </SettingsCard>

      <ConfirmDialog
        open={confirmClear}
        title="გავასუფთაოთ პროგრესი?"
        message="ქვიზების ისტორია, სტრიქი, დღის მიზნები და სტატისტიკა წაიშლება შენი ანგარიშიდან, ყველა მოწყობილობაზე. ამის დაბრუნება შეუძლებელია."
        confirmLabel="გასუფთავება"
        confirmWord="წაშლა"
        onConfirm={handleClear}
        onCancel={() => setConfirmClear(false)}
      />
    </>
  );
}
