"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Lock } from "lucide-react";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { isAdminEmail, resolvePostLoginHref } from "@/lib/access-control";
import { readPersistedSpace } from "@/lib/dev-portal-bypass";
import {
  FORGOT_PASSWORD_HREF,
  loginHref,
  newPasswordErrorMessage,
  RESET_LINK_INVALID,
  RESET_SUCCESS_REDIRECT_SECONDS,
  validateNewPassword,
  type NewPasswordError,
} from "@/lib/password-reset";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { AuthCard, authBackClass, authIconClass, authInputClass, authLabelClass, authLinkClass, authPrimaryButtonClass } from "./AuthCard";

type Phase = "checking" | "form" | "invalid" | "success";

function accountSpace(metadata: unknown): SpaceeduSpace | null {
  const value = (metadata as Record<string, unknown> | null | undefined)?.space;
  return value === "school" || value === "abiturient" || value === "student" ? value : null;
}

/**
 * /reset-password: reached from the emailed link through /auth/callback,
 * which has already turned it into a session. Without a session (or with
 * ?error=link_invalid, or Supabase's #error_code=otp_expired) the link is
 * dead and the page says so.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>(() => (searchParams.get("error") === RESET_LINK_INVALID ? "invalid" : "checking"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldError, setFieldError] = useState<NewPasswordError | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dashboardHref, setDashboardHref] = useState("/select-space");
  const [countdown, setCountdown] = useState(RESET_SUCCESS_REDIRECT_SECONDS);
  const leaving = useRef(false);
  const id = useId();

  useEffect(() => {
    if (phase !== "checking") return;
    if (!isSupabaseBrowserConfigured()) {
      void Promise.resolve().then(() => setPhase("invalid"));
      return;
    }
    let active = true;
    createSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!active) return;
        // Supabase puts link errors in the fragment for some flows.
        const hashError = /error_code=|error=/.test(window.location.hash);
        if (!data.user || hashError) {
          setPhase("invalid");
          return;
        }
        setEmail(data.user.email ?? "");
        setDashboardHref(
          resolvePostLoginHref({
            metadataSpace: accountSpace(data.user.user_metadata),
            roleSpace: null,
            storedSpace: readPersistedSpace(),
            isAdmin: isAdminEmail(data.user.email),
          }).href,
        );
        setPhase("form");
      })
      .catch(() => active && setPhase("invalid"));
    return () => {
      active = false;
    };
  }, [phase]);

  // After saving: on to the dashboard by itself after a few seconds.
  useEffect(() => {
    if (phase !== "success") return;
    if (countdown <= 0) {
      if (!leaving.current) router.push(dashboardHref);
      return;
    }
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, countdown, dashboardHref, router]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const invalid = validateNewPassword(password, confirm);
    setFieldError(invalid);
    if (invalid) return;
    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword("");
      setConfirm("");
      setPhase("success");
    } catch (err) {
      const result = newPasswordErrorMessage(err);
      if (result.linkInvalid) setPhase("invalid");
      else setError(result.message);
    } finally {
      setSaving(false);
    }
  };

  /** The recovery link signed them in; going back to /login means signing out first. */
  const backToLogin = async () => {
    leaving.current = true;
    try {
      if (isSupabaseBrowserConfigured()) await createSupabaseBrowserClient().auth.signOut({ scope: "local" });
    } catch {
      // still go to /login
    }
    router.push(loginHref(email));
  };

  const goToDashboard = () => {
    leaving.current = true;
    router.push(dashboardHref);
  };

  const back =
    phase === "form" || phase === "success" ? (
      <button type="button" onClick={() => void backToLogin()} className={authBackClass}>
        <ArrowLeft className="h-3.5 w-3.5" />
        შესვლაზე დაბრუნება
      </button>
    ) : (
      <Link href="/login" className={authBackClass}>
        <ArrowLeft className="h-3.5 w-3.5" />
        შესვლაზე დაბრუნება
      </Link>
    );

  if (phase === "checking") {
    return (
      <AuthCard title="ახალი პაროლი" back={back}>
        <div className="flex justify-center py-6 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AuthCard>
    );
  }

  if (phase === "invalid") {
    return (
      <AuthCard title="ბმული აღარ მოქმედებს" subtitle="ბმულს ვადა გაუვიდა ან უკვე გამოყენებულია. მოითხოვე ახალი." back={back}>
        <Link href={FORGOT_PASSWORD_HREF} className={authPrimaryButtonClass}>
          <KeyRound className="h-4 w-4" />
          ახალი ბმულის მოთხოვნა
        </Link>
        <p className="text-center text-[14px] text-[var(--au-muted)]">
          ბმული უნდა გაიხსნას იმავე ბრაუზერში, სადაც მოითხოვე, და 1 საათის განმავლობაში.
        </p>
      </AuthCard>
    );
  }

  if (phase === "success") {
    return (
      <AuthCard title="პაროლი შეიცვალა ✓" subtitle="ახალი პაროლი შენახულია. უკვე შესული ხარ." back={back}>
        <div role="status" className="flex items-center gap-3 rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <p>{countdown > 0 ? `${countdown} წამში გადაგიყვანთ შენს სივრცეში.` : "გადაგიყვანთ…"}</p>
        </div>
        <button type="button" onClick={goToDashboard} className={authPrimaryButtonClass}>
          შესვლა
        </button>
        <p className="text-center text-[14px]">
          <button type="button" onClick={() => void backToLogin()} className={authLinkClass}>
            ← შესვლის გვერდზე დაბრუნება
          </button>
        </p>
      </AuthCard>
    );
  }

  const passwordError = fieldError?.field === "password" ? fieldError.message : null;
  const confirmError = fieldError?.field === "confirm" ? fieldError.message : null;
  const field = (
    key: "password" | "confirm",
    label: string,
    value: string,
    onChange: (value: string) => void,
    message: string | null,
  ) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`${id}-${key}`} className={authLabelClass}>
        {label}
      </label>
      <PasswordInput
        id={`${id}-${key}`}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          if (fieldError?.field === key) setFieldError(null);
        }}
        autoComplete="new-password"
        autoFocus={key === "password"}
        invalid={Boolean(message)}
        aria-invalid={Boolean(message) || undefined}
        aria-describedby={message ? `${id}-${key}-error` : undefined}
        icon={
          <Lock
            className={authIconClass(Boolean(message))}
          />
        }
        className={authInputClass(Boolean(message))}
        placeholder="მინიმუმ 6 სიმბოლო"
      />
      {message ? (
        <p id={`${id}-${key}-error`} className="mt-1.5 text-[13px] font-medium text-rose-600 dark:text-rose-400">
          {message}
        </p>
      ) : null}
    </div>
  );

  return (
    <AuthCard title="ახალი პაროლი" subtitle={email ? <>ანგარიში: <span className="font-medium">{email}</span></> : undefined} back={back}>
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4" noValidate>
        {/* Lets password managers save the new password against the right account. */}
        <input type="email" name="email" autoComplete="username" value={email} readOnly hidden />
        {field("password", "ახალი პაროლი", password, setPassword, passwordError)}
        {field("confirm", "გაიმეორე პაროლი", confirm, setConfirm, confirmError)}
        {error ? (
          <p role="alert" className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] text-rose-900 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-100">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={saving} className={authPrimaryButtonClass}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          პაროლის შენახვა
        </button>
      </form>
    </AuthCard>
  );
}
