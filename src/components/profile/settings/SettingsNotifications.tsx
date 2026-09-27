"use client";

import { useEffect, useState } from "react";
import { Award, Bell, Brain, Calendar, Flame, Megaphone } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { SettingsCard, Toggle, ToggleRow } from "@/components/profile/settings-ui";

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

  return (
    <SettingsCard
      icon={Bell}
      title="შეტყობინებები"
      subtitle="აირჩიე რა შეგახსენოს SpaceEdu-მ"
      bodyClassName="pt-3"
    >
      <div className="-mx-5 border-y border-[var(--border)]">
        <ToggleRow
          icon={Flame}
          tone="amber"
          title="სტრიქის შეხსენება"
          subtitle="ყოველდღიური სასწავლო შეხსენება"
          control={<Toggle checked={prefs.streak} onChange={(v) => set("streak", v)} label="სტრიქის შეხსენება" />}
        />
        <ToggleRow
          icon={Brain}
          tone="purple"
          title="Quiz შედეგები"
          subtitle="Quiz-ის დასრულების შემდეგ"
          control={<Toggle checked={prefs.quiz} onChange={(v) => set("quiz", v)} label="Quiz შედეგები" />}
        />
        <ToggleRow
          icon={Award}
          tone="teal"
          title="ახალი ბეჯი"
          subtitle="ბეჯის განბლოკვისას"
          control={<Toggle checked={prefs.badge} onChange={(v) => set("badge", v)} label="ახალი ბეჯი" />}
        />
        <ToggleRow
          icon={Calendar}
          tone="blue"
          title="სასწავლო გეგმა"
          subtitle="დღევანდელი გეგმის შეხსენება"
          control={<Toggle checked={prefs.studyPlan} onChange={(v) => set("studyPlan", v)} label="სასწავლო გეგმა" />}
        />
        <ToggleRow
          icon={Megaphone}
          tone="coral"
          title="SpaceEdu სიახლეები"
          subtitle="ახალი ფუნქციები და განახლებები"
          control={<Toggle checked={prefs.news} onChange={(v) => set("news", v)} label="SpaceEdu სიახლეები" />}
        />
      </div>

      <div className="mt-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-[0.04em] text-[var(--text-secondary)]">
            შეხსენების დრო (თბილისი)
          </span>
          <input
            type="time"
            value={prefs.reminderTime}
            onChange={(e) => set("reminderTime", e.target.value)}
            className="w-36 rounded-lg border border-[var(--border-hover)] bg-[var(--bg-secondary)] px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none focus:border-[#7F77DD]"
          />
        </label>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={state === "saving"}
          className="mt-3 inline-flex items-center justify-center rounded-lg bg-[#7F77DD] px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#534AB7] disabled:opacity-60"
        >
          {state === "saving" ? "ინახება..." : "შენახვა"}
        </button>
        {state === "saved" && (
          <span role="status" className="ml-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            შენახულია
          </span>
        )}
        {state === "error" && (
          <span role="alert" className="ml-3 text-xs font-medium text-rose-600 dark:text-rose-400">
            ვერ შევინახე
          </span>
        )}
      </div>
    </SettingsCard>
  );
}
