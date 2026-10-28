"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { CARD_X, psButton, SettingsCard, SettingsPageTitle, SettingsRows, Toggle, ToggleRow } from "@/components/profile/settings-ui";
import { Toast } from "@/components/ui/Toast";

// These preferences are stored on the account (user_metadata.notificationPrefs)
// via updateUser. There is no server-side push/email sender yet, so nothing
// actually *sends* on this schedule — the toggles record the user's intent so a
// future sender can honour them. Reminder time is interpreted as Asia/Tbilisi.
interface NotifPrefs {
  streak: boolean;
  quiz: boolean;
  badge: boolean;
  studyPlan: boolean;
  news: boolean;
  reminderTime: string;
}

const DEFAULT_PREFS: NotifPrefs = {
  streak: true,
  quiz: true,
  badge: true,
  studyPlan: false,
  news: false,
  reminderTime: "20:00",
};

export function SettingsNotifications() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const closeToast = useCallback(() => setState("idle"), []);

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) return;
    let active = true;
    void (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        const stored = (data.user?.user_metadata as Record<string, unknown> | undefined)
          ?.notificationPrefs as Partial<NotifPrefs> | undefined;
        if (active && stored) setPrefs({ ...DEFAULT_PREFS, ...stored });
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const set = <K extends keyof NotifPrefs>(key: K, value: NotifPrefs[K]) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setState("idle");
  };

  const handleSave = async () => {
    if (!isSupabaseBrowserConfigured()) {
      setState("error");
      return;
    }
    setState("saving");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ data: { notificationPrefs: prefs } });
      if (error) throw error;
      setState("saved");
    } catch {
      setState("error");
    }
  };

  const rows: { key: "streak" | "quiz" | "badge" | "studyPlan" | "news"; title: string; subtitle: string }[] = [
    { key: "streak", title: "სტრიქის შეხსენება", subtitle: "ყოველდღე, რომ სტრიქი არ გაგიწყდეს" },
    { key: "quiz", title: "ქვიზის შედეგები", subtitle: "ქვიზის დასრულების შემდეგ" },
    { key: "badge", title: "ახალი ბეჯი", subtitle: "როცა ბეჯს მოიპოვებ" },
    { key: "studyPlan", title: "სასწავლო გეგმა", subtitle: "დღევანდელი გეგმის შეხსენება" },
    { key: "news", title: "SpaceEdu-ს სიახლეები", subtitle: "ახალი ხელსაწყოები და განახლებები" },
  ];

  return (
    <>
      <SettingsPageTitle>შეტყობინებები</SettingsPageTitle>

      <SettingsCard title="რა შეგახსენოთ" subtitle="ჩართე მხოლოდ ის, რაც გჭირდება" flush>
        <SettingsRows>
          {rows.map((row) => (
            <ToggleRow
              key={row.key}
              title={row.title}
              subtitle={row.subtitle}
              control={<Toggle checked={prefs[row.key]} onChange={(v) => set(row.key, v)} label={row.title} />}
            />
          ))}
        </SettingsRows>

        <div className={`${CARD_X} border-t border-[var(--ps-divider)] pb-6 pt-5`}>
          <label className="flex flex-col gap-2">
            <span className="ps-label">შეხსენების დრო</span>
            <span className="text-[13px] text-[var(--ps-muted)]">თბილისის დროით</span>
            <input
              type="time"
              value={prefs.reminderTime}
              onChange={(e) => set("reminderTime", e.target.value)}
              className="ps-field mt-1 !w-40"
            />
          </label>
          {state === "error" && (
            <p role="alert" className="mt-4 text-[13.5px] font-medium text-[var(--ps-danger)]">
              ვერ შევინახე. სცადე თავიდან.
            </p>
          )}
          <div className="ps-actions mt-6">
            <button type="button" onClick={() => void handleSave()} disabled={state === "saving"} className={psButton("primary")}>
              {state === "saving" ? "ინახება…" : "შენახვა"}
            </button>
          </div>
        </div>
      </SettingsCard>

      {state === "saved" ? <Toast message="შენახულია" onClose={closeToast} duration={3000} /> : null}
    </>
  );
}
