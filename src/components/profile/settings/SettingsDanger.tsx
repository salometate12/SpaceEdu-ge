"use client";

import { useState } from "react";
import { Download, Trash2, TriangleAlert } from "lucide-react";
import { SettingsCard, SoonBadge } from "@/components/profile/settings-ui";
import { ConfirmDialog } from "@/components/profile/settings/ConfirmDialog";

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

  const rowClass =
    "flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-3.5 last:border-b-0";

  return (
    <SettingsCard
      icon={TriangleAlert}
      title="საშიში ზონა"
      subtitle="ეს მოქმედებები შეუქცევადია"
      danger
      bodyClassName="pt-3"
    >
      <div className="-mx-5 -mb-5 border-t border-[var(--border)]">
        <div className={rowClass}>
          <div className="min-w-0">
            <div className="text-[13px] text-[var(--text-primary)]">მონაცემების ექსპორტი</div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              ყველა პროგრესი და კონსპექტი ერთ ფაილად
            </div>
          </div>
          <button
            type="button"
            disabled
            title="მალე"
            className="inline-flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] opacity-60"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            ექსპორტი
            <SoonBadge />
          </button>
        </div>

        <div className={rowClass}>
          <div className="min-w-0">
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
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              გასუფთავება
            </button>
          )}
        </div>

        <div className={rowClass}>
          <div className="min-w-0">
            <div className="text-[13px] text-[var(--text-primary)]">ანგარიშის წაშლა</div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              ყველა მონაცემი სამუდამოდ წაიშლება
            </div>
          </div>
          <button
            type="button"
            disabled
            title="მალე"
            className="inline-flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            ანგარიშის წაშლა
            <SoonBadge />
          </button>
        </div>
      </div>

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
