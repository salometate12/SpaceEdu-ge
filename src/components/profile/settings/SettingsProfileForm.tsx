"use client";

import { useState } from "react";
import { Check, IdCard, Trash2, Upload } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { SettingsCard, SoonBadge } from "@/components/profile/settings-ui";

export interface ProfileFormValues {
  firstName: string;
  lastName: string;
  bio: string;
  city: string;
  institution: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function SettingsProfileForm({
  initial,
  email,
  initials,
}: {
  initial: ProfileFormValues;
  email: string;
  initials: string;
}) {
  const [values, setValues] = useState<ProfileFormValues>(initial);
  const [state, setState] = useState<SaveState>("idle");

  const set = (key: keyof ProfileFormValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!isSupabaseBrowserConfigured()) {
      setState("error");
      return;
    }
    setState("saving");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          bio: values.bio.trim(),
          city: values.city.trim(),
          institution: values.institution.trim(),
        },
      });
      if (error) throw error;
      setState("saved");
    } catch {
      setState("error");
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-[var(--border-hover)] bg-[var(--bg-secondary)] px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none focus:border-[#7F77DD]";
  const labelClass =
    "text-[11px] uppercase tracking-[0.04em] text-[var(--text-secondary)]";

  return (
    <SettingsCard bodyClassName="p-0">
      {/* Avatar block */}
      <div className="flex items-center gap-4 border-b border-[var(--border)] p-5">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[2.5px] border-[#7F77DD] bg-[#EEEDFE] text-[22px] font-medium text-[#3C3489] dark:bg-[rgba(127,119,221,0.16)] dark:text-[#c9c4fb]">
          {initials || "მე"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-medium text-[var(--text-primary)]">
            {[values.firstName, values.lastName].filter(Boolean).join(" ") || "მომხმარებელი"}
          </div>
          <div className="truncate text-xs text-[var(--text-secondary)]">{email || "—"}</div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled
              title="მალე"
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] opacity-60"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden />
              ფოტოს ატვირთვა
              <SoonBadge />
            </button>
            <button
              type="button"
              disabled
              title="მალე"
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              წაშლა
            </button>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="p-5">
        <h2 className="flex items-center gap-2 text-[15px] font-medium text-[var(--text-primary)]">
          <IdCard className="h-4 w-4 stroke-[1.75] text-[#7F77DD]" aria-hidden />
          პირადი ინფო
        </h2>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">სახელი, კონტაქტი და ბიო</p>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>სახელი</span>
            <input className={fieldClass} value={values.firstName} onChange={(e) => set("firstName", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>გვარი</span>
            <input className={fieldClass} value={values.lastName} onChange={(e) => set("lastName", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelClass}>ელ-ფოსტა</span>
            <input
              className={`${fieldClass} cursor-not-allowed opacity-70`}
              value={email}
              type="email"
              readOnly
              aria-readonly="true"
            />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelClass}>ბიო</span>
            <textarea
              className={`${fieldClass} min-h-[70px] resize-y`}
              placeholder="რამდენიმე სიტყვა შენს შესახებ..."
              value={values.bio}
              onChange={(e) => set("bio", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>ქალაქი</span>
            <input className={fieldClass} placeholder="თბილისი" value={values.city} onChange={(e) => set("city", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>სკოლა / უნივ.</span>
            <input className={fieldClass} placeholder="სახელი" value={values.institution} onChange={(e) => set("institution", e.target.value)} />
          </label>
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={state === "saving"}
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#7F77DD] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#534AB7] disabled:opacity-60"
        >
          <Check className="h-3.5 w-3.5" aria-hidden />
          {state === "saving" ? "ინახება..." : "ცვლილებების შენახვა"}
        </button>

        {state === "saved" && (
          <p role="status" className="mt-2 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
            ცვლილებები შენახულია
          </p>
        )}
        {state === "error" && (
          <p role="alert" className="mt-2 text-center text-xs font-medium text-rose-600 dark:text-rose-400">
            ვერ შევინახე. სცადე თავიდან.
          </p>
        )}
      </div>
    </SettingsCard>
  );
}
