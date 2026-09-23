"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useLayoutEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, Lock, Mail } from "lucide-react";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";
import { GoogleAuthButton } from "@/components/registration/GoogleAuthButton";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import {
  devSkipRegistrationAllowed,
  isDevPortalBypass,
  parseDevPortalTarget,
  persistSpaceForRole,
  readPersistedSpace,
  resolveAuthRedirectHref,
} from "@/lib/dev-portal-bypass";
import {
  parseRegistrationRole,
  registrationRoleSubtext,
  type RegistrationRoleParam,
} from "@/lib/registration-role";
import { isAdminEmail, resolvePostLoginHref } from "@/lib/access-control";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { classifyLoginError, validateLoginFields, type LoginFieldError } from "@/lib/login-error";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";

/** The account's registered space, read from Supabase user metadata. */
function accountSpaceFromMetadata(metadata: unknown): SpaceeduSpace | null {
  const value = (metadata as Record<string, unknown> | null | undefined)?.space;
  if (value === "school" || value === "abiturient" || value === "student") return value;
  return null;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = parseRegistrationRole(searchParams.get("role"));
  const devTarget = parseDevPortalTarget(searchParams.get("dev_target"));
  const showDevBypass = devSkipRegistrationAllowed(role);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<LoginFieldError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  // Bumped on every submit so the password field hides itself again.
  const [submitCount, setSubmitCount] = useState(0);

  const emailInvalid = fieldError?.field === "email";
  const passwordInvalid = fieldError?.field === "password";

  // Unique per component instance. The App Router keeps the previous route
  // mounted (hidden, via React Activity) when navigating between auth pages, so
  // two copies of this form can share the DOM. useId gives each copy its own
  // field/error ids so labels, aria-describedby and password managers target
  // the visible inputs, not the hidden ones.
  const fieldId = useId();
  const emailId = `${fieldId}-email`;
  const passwordId = `${fieldId}-password`;
  const emailErrorId = `${emailId}-error`;
  const passwordErrorId = `${passwordId}-error`;

  // Wipe the password and any error state when Activity hides this form, so a
  // typed password never lingers in an off-screen copy. Email may stay.
  useLayoutEffect(() => {
    return () => {
      setPassword("");
      setFieldError(null);
      setError(null);
      setUnconfirmed(false);
    };
  }, []);

  const roleSubtext = useMemo(() => {
    if (role) return registrationRoleSubtext(role);
    return "შედი შენს სასწავლო სივრცეში";
  }, [role]);

  const finishAuthRedirect = (activeRole: RegistrationRoleParam) => {
    persistSpaceForRole(activeRole);
    router.push(resolveAuthRedirectHref(activeRole, devTarget));
  };

  const handleDevSkip = () => {
    if (!role) return;
    finishAuthRedirect(role);
  };

  const handleResend = async () => {
    const trimmedEmail = email.trim();
    if (!isSupabaseBrowserConfigured() || !trimmedEmail) return;
    setResendState("sending");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: trimmedEmail,
      });
      if (resendError) throw resendError;
      setResendState("sent");
    } catch {
      setResendState("error");
    }
  };

  /**
   * Send a signed-in user to their space's dashboard. Space priority is
   * account metadata → URL ?role → this device's stored preference. An admin
   * is never sent to the chooser; a normal user with no space anywhere is.
   * When a normal user's space came from the URL/storage rather than the
   * account, it's written back so the next login reads it straight off the
   * account. See resolvePostLoginHref for the full rule.
   */
  const redirectAfterLogin = async (user: {
    email?: string | null;
    user_metadata?: unknown;
  }) => {
    const resolution = resolvePostLoginHref({
      metadataSpace: accountSpaceFromMetadata(user.user_metadata),
      roleSpace: role,
      storedSpace: readPersistedSpace(),
      isAdmin: isAdminEmail(user.email),
    });

    if (resolution.persistSpace) {
      persistSpaceForRole(resolution.persistSpace);
    }

    if (resolution.writeSpaceToAccount) {
      try {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.updateUser({ data: { space: resolution.writeSpaceToAccount } });
      } catch {
        // Non-fatal: the space is already persisted locally and the URL role
        // still routes them correctly this session. Don't block the redirect.
      }
    }

    router.push(resolution.href);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setFieldError(null);
    setUnconfirmed(false);
    setResendState("idle");
    setSubmitCount((n) => n + 1);

    const trimmedEmail = email.trim();

    // Client-side validation turns the specific field red. Skipped in the dev
    // bypass, which lets you in without real credentials.
    if (!isDevPortalBypass()) {
      const invalid = validateLoginFields(trimmedEmail, password);
      if (invalid) {
        setFieldError(invalid);
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isSupabaseBrowserConfigured() && trimmedEmail && password.length >= 6) {
        const supabase = createSupabaseBrowserClient();
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) throw signInError;
        await redirectAfterLogin({
          email: data.user?.email,
          user_metadata: data.user?.user_metadata,
        });
        return;
      }

      // No real auth available: dev keeps its password-free bypass; otherwise error.
      if (isDevPortalBypass()) {
        finishAuthRedirect(role ?? "student");
        return;
      }
      throw new Error("auth-unavailable");
    } catch (err) {
      if (isDevPortalBypass()) {
        finishAuthRedirect(role ?? "student");
        return;
      }
      const outcome = classifyLoginError(err);
      if (outcome.kind === "unconfirmed") {
        // Unchanged: the fields don't go red for an unconfirmed address.
        setError(
          "ელ-ფოსტა ჯერ არ არის დადასტურებული. შეამოწმე ინბოქსი და დააჭირე დადასტურების ბმულს.",
        );
        setUnconfirmed(true);
      } else if (outcome.kind === "field") {
        setFieldError(outcome.error);
      } else {
        setError("შესვლა ვერ მოხერხდა. შეამოწმე მონაცემები და სცადე თავიდან.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-2xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#121214]/40">
      <header className="space-y-3 text-center">
        <img
          src="/spaceedu-mark.png"
          alt="SpaceEdu"
          width={48}
          height={48}
          className="mx-auto h-12 w-auto"
        />
        <h1 className="headline text-2xl font-bold text-slate-900 dark:text-white">შესვლა</h1>
        <p className="text-sm text-slate-600 dark:text-gray-400">{roleSubtext}</p>
      </header>

      {showDevBypass && role && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 text-xs leading-relaxed text-amber-200/90">
          <p className="font-medium text-amber-100/95">Dev რეჟიმი (მხოლოდ localhost)</p>
          <button
            type="button"
            onClick={handleDevSkip}
            className="mt-2 w-full rounded-lg border border-amber-500/30 bg-amber-500/10 py-2 text-xs font-medium text-amber-100 transition-colors hover:bg-amber-500/20"
          >
            Dev: პორტალის გადახედვა
          </button>
        </div>
      )}

      {/* Google works without a pre-chosen space — the account's space is read
          at /auth/complete, so a returning user isn't asked to choose again. */}
      <GoogleAuthButton role={role ?? "abiturient"} label="შესვლა Google-ით" />
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200 dark:bg-white/[0.08]" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-gray-500">
          ან
        </span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-white/[0.08]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="relative flex flex-col space-y-1.5">
          <label htmlFor={emailId} className="text-xs font-medium text-slate-600 dark:text-gray-400">
            ელ-ფოსტა
          </label>
          <div className="relative">
            <Mail
              className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${
                emailInvalid ? "text-rose-500" : "text-slate-400 dark:text-gray-500"
              }`}
            />
            <input
              id={emailId}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailInvalid) setFieldError(null);
              }}
              aria-invalid={emailInvalid || undefined}
              aria-describedby={emailInvalid ? emailErrorId : undefined}
              className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none dark:bg-white/[0.03] dark:text-white dark:placeholder-gray-500 ${
                emailInvalid
                  ? "border-rose-500 ring-1 ring-rose-500/40 focus:border-rose-500 focus:ring-rose-500/40 dark:border-rose-500"
                  : "border-slate-200 focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 dark:border-white/[0.08]"
              }`}
              placeholder="name@example.com"
            />
          </div>
          {emailInvalid && (
            <p id={emailErrorId} className="text-xs font-medium text-rose-500">
              {fieldError?.message}
            </p>
          )}
        </div>

        <div className="relative flex flex-col space-y-1.5">
          <label htmlFor={passwordId} className="text-xs font-medium text-slate-600 dark:text-gray-400">
            პაროლი
          </label>
          <PasswordInput
            key={submitCount}
            id={passwordId}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordInvalid) setFieldError(null);
            }}
            autoComplete="current-password"
            invalid={passwordInvalid}
            aria-invalid={passwordInvalid || undefined}
            aria-describedby={passwordInvalid ? passwordErrorId : undefined}
            icon={
              <Lock
                className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${
                  passwordInvalid ? "text-rose-500" : "text-slate-400 dark:text-gray-500"
                }`}
              />
            }
            className={`w-full rounded-xl border bg-white py-3 pl-10 text-sm text-slate-900 placeholder-slate-400 focus:outline-none dark:bg-white/[0.03] dark:text-white dark:placeholder-gray-500 ${
              passwordInvalid
                ? "border-rose-500 ring-1 ring-rose-500/40 focus:border-rose-500 focus:ring-rose-500/40 dark:border-rose-500"
                : "border-slate-200 focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 dark:border-white/[0.08]"
            }`}
            placeholder="პაროლი"
          />
          {passwordInvalid && (
            <p id={passwordErrorId} className="text-xs font-medium text-rose-500">
              {fieldError?.message}
            </p>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
          >
            <p>{error}</p>
            {unconfirmed && (
              <div className="mt-2">
                {resendState === "sent" ? (
                  <span className="text-emerald-700 dark:text-emerald-300/90">
                    ახალი დადასტურების ბმული გამოგზავნილია — შეამოწმე ინბოქსი.
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleResend()}
                    disabled={resendState === "sending"}
                    className="font-medium text-pink-700 underline underline-offset-2 hover:text-pink-600 disabled:opacity-50 dark:text-pink-300 dark:hover:text-pink-200"
                  >
                    {resendState === "sending"
                      ? "იგზავნება..."
                      : resendState === "error"
                        ? "ვერ გაიგზავნა, სცადე თავიდან"
                        : "ხელახლა გამოგზავნა"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-pink-600 py-3 text-sm font-medium text-white shadow-lg shadow-pink-600/20 hover:bg-pink-500 disabled:opacity-50"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          შესვლა
        </button>
      </form>

      <p className="text-center text-xs text-slate-500 dark:text-gray-500">
        ანგარიში არ გაქვს?{" "}
        <Link
          href={role ? `/registration?role=${role}` : "/select-space"}
          className="font-medium text-pink-400 hover:text-pink-300"
        >
          რეგისტრაცია
        </Link>
      </p>
    </div>
  );
}
