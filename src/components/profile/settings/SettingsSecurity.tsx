"use client";

import { useEffect, useState } from "react";
import { Smartphone, Lock, MessageSquare, ShieldCheck } from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { createClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { SettingsCard, SoonBadge, ToggleRow } from "@/components/profile/settings-ui";

type SaveState = "idle" | "saving" | "saved" | "error";

export function SettingsSecurity() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<SaveState>("idle");
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(true);

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) return;
    let active = true;
    void (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (!active) return;
        const identities = data.user?.identities ?? [];
        const google = identities.find((i) => i.provider === "google");
        setGoogleEmail((google?.identity_data?.email as string) ?? data.user?.email ?? null);
        setHasPassword(identities.some((i) => i.provider === "email"));
      } catch {
        /* leave defaults */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async () => {
    setError(null);
    if (password.length < 8) {
      setError("პაროლი უნდა შეიცავდეს მინიმუმ 8 სიმბოლოს");
      return;
    }
    if (password !== confirm) {
      setError("პაროლები არ ემთხვევა");
      return;
    }
    if (!isSupabaseBrowserConfigured()) {
      setState("error");
      return;
    }
    setState("saving");
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setState("saved");
      setPassword("");
      setConfirm("");
    } catch {
      setState("error");
    }
  };

  const mismatch = confirm.length > 0 && password !== confirm;
  const fieldWrap = "flex flex-col gap-1.5";
  const labelClass = "text-[11px] uppercase tracking-[0.04em] text-[var(--text-secondary)]";
  const inputClass =
    "w-full rounded-lg border bg-[var(--bg-secondary)] px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none focus:border-[#7F77DD]";

  return (
    <>
      <SettingsCard
        icon={Lock}
        title="პაროლის შეცვლა"
        subtitle="გამოიყენე ძლიერი, უნიკალური პაროლი"
      >
        {!hasPassword && (
          <p className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            შენ Google-ით ხარ შესული. აქ შეგიძლია დააყენო პაროლი, რომ ელ-ფოსტითაც შეხვიდე.
          </p>
        )}
        <div className="flex flex-col gap-2.5">
          <div className={fieldWrap}>
            <span className={labelClass}>ახალი პაროლი</span>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="მინ. 8 სიმბოლო"
              className={`${inputClass} border-[var(--border-hover)]`}
            />
          </div>
          <div className={fieldWrap}>
            <span className={labelClass}>გაიმეორე</span>
            <PasswordInput
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              invalid={mismatch}
              placeholder="••••••••"
              className={`${inputClass} ${mismatch ? "border-rose-500" : "border-[var(--border-hover)]"}`}
            />
            {mismatch && (
              <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                პაროლები არ ემთხვევა
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={state === "saving"}
          className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-[#7F77DD] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#534AB7] disabled:opacity-60"
        >
          {state === "saving" ? "ნახლდება..." : "პაროლის განახლება"}
        </button>
        {error && (
          <p role="alert" className="mt-2 text-center text-xs font-medium text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}
        {state === "saved" && (
          <p role="status" className="mt-2 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
            პაროლი განახლდა
          </p>
        )}
        {state === "error" && !error && (
          <p role="alert" className="mt-2 text-center text-xs font-medium text-rose-600 dark:text-rose-400">
            ვერ განახლდა. სცადე თავიდან.
          </p>
        )}
      </SettingsCard>

      <SettingsCard
        icon={ShieldCheck}
        title="ორფაქტორიანი დაცვა"
        subtitle="დაამატე დაცვის დამატებითი ფენა"
        bodyClassName="pt-3"
      >
        <div className="-mx-5 -mb-5 border-t border-[var(--border)]">
          <ToggleRow
            icon={MessageSquare}
            tone="purple"
            title="SMS კოდი"
            subtitle="ტელეფონზე კოდის გაგზავნა"
            control={<SoonBadge />}
          />
          <ToggleRow
            icon={Smartphone}
            tone="teal"
            title="Authenticator App"
            subtitle="Google Authenticator / Authy"
            control={<SoonBadge />}
          />
          {googleEmail && (
            <div className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FAECE7] text-[#D85A30] dark:bg-[rgba(216,90,48,0.16)] dark:text-[#f0916e]">
                <span className="text-sm font-bold">G</span>
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-[var(--text-primary)]">Google</div>
                <div className="truncate text-[11px] text-[var(--text-secondary)]">
                  {googleEmail} — დაკავშირებულია
                </div>
              </div>
            </div>
          )}
        </div>
      </SettingsCard>
    </>
  );
}
