"use client";

import { useEffect, useState } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { createClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import {
  ActiveBadge,
  psButton,
  ROW_SUB,
  ROW_TITLE,
  SETTINGS_ROW,
  SETTINGS_ROW_TEXT,
  SettingsCard,
  SettingsRows,
  SoonBadge,
  ToggleRow,
} from "@/components/profile/settings-ui";

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
        // Only a real Google identity counts as „connected“.
        setGoogleEmail(google ? ((google.identity_data?.email as string) ?? data.user?.email ?? null) : null);
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

  return (
    <>
      <SettingsCard title="პაროლის შეცვლა" subtitle="გამოიყენე ძლიერი პაროლი, რომელსაც სხვაგან არ იყენებ">
        {!hasPassword && (
          <p className="mb-4 rounded-[14px] bg-[var(--ps-soft)] px-4 py-3 text-[13.5px] text-[var(--ps-text)]">
            Google-ით ხარ შესული. აქ შეგიძლია პაროლი დააყენო, რომ ელ-ფოსტითაც შეხვიდე.
          </p>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="ps-label">ახალი პაროლი</span>
              <PasswordInput
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setState("idle");
                }}
                autoComplete="new-password"
                placeholder="მინიმუმ 8 სიმბოლო"
                className="ps-field !pr-11"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="ps-label">გაიმეორე პაროლი</span>
              <PasswordInput
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setState("idle");
                }}
                autoComplete="new-password"
                invalid={mismatch}
                aria-invalid={mismatch}
                className="ps-field !pr-11"
              />
              {mismatch && <span className="text-[13px] font-medium text-[var(--ps-danger)]">პაროლები არ ემთხვევა</span>}
            </label>
          </div>
          {error && (
            <p role="alert" className="mt-4 text-[13.5px] font-medium text-[var(--ps-danger)]">
              {error}
            </p>
          )}
          {state === "saved" && (
            <p role="status" className="mt-4 text-[13.5px] font-medium text-[var(--ps-ok)]">
              პაროლი განახლდა
            </p>
          )}
          {state === "error" && !error && (
            <p role="alert" className="mt-4 text-[13.5px] font-medium text-[var(--ps-danger)]">
              ვერ განახლდა. სცადე თავიდან.
            </p>
          )}
          <div className="ps-actions mt-6">
            <button type="submit" disabled={state === "saving" || !password || !confirm} className={psButton("primary")}>
              {state === "saving" ? "ნახლდება…" : "პაროლის განახლება"}
            </button>
          </div>
        </form>
      </SettingsCard>

      <SettingsCard title="ორფაქტორიანი დაცვა" subtitle="დამატებითი დაცვა შესვლისას" flush>
        <SettingsRows>
          <ToggleRow title="SMS კოდი" subtitle="შესვლისას კოდი ტელეფონზე" control={<SoonBadge />} muted />
          <ToggleRow
            title="ავთენტიფიკატორის აპი"
            subtitle="Google Authenticator ან მსგავსი აპი"
            control={<SoonBadge />}
            muted
          />
        </SettingsRows>
      </SettingsCard>

      <SettingsCard title="დაკავშირებული ანგარიშები" subtitle="სხვა გზები, რომლითაც შეგიძლია შესვლა" flush>
        <SettingsRows>
          <div className={SETTINGS_ROW}>
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--ps-border)] text-[15px] font-bold text-[var(--ps-title)]"
              aria-hidden
            >
              G
            </span>
            <div className={SETTINGS_ROW_TEXT}>
              <div className={ROW_TITLE}>Google</div>
              <div className={`${ROW_SUB} [overflow-wrap:anywhere]`}>{googleEmail ?? "არ არის დაკავშირებული"}</div>
            </div>
            {googleEmail ? <ActiveBadge>დაკავშირებულია</ActiveBadge> : null}
          </div>
        </SettingsRows>
      </SettingsCard>
    </>
  );
}
