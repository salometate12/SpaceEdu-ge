"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useLayoutEffect, useState, type FormEvent } from "react";
import { KeyRound, Loader2, Lock, Mail } from "lucide-react";
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
import { parseRegistrationRole, type RegistrationRoleParam } from "@/lib/registration-role";
import { isAdminEmail, resolvePostLoginHref } from "@/lib/access-control";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Alert, FieldError } from "@/components/ui/Alert";
import {
  AuthCard,
  AuthDivider,
  AuthSpaceChip,
  authIconClass,
  authInputClass,
  authLabelClass,
  authLinkClass,
  authPrimaryButtonClass,
} from "@/components/registration/AuthCard";
import {
  classifyLoginError,
  FAILED_ATTEMPTS_BEFORE_RESET_HINT,
  validateLoginFields,
  type LoginFieldError,
} from "@/lib/login-error";
import { forgotPasswordHref } from "@/lib/password-reset";
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

  // Prefilled when coming back from /forgot-password.
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<LoginFieldError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  // Bumped on every submit so the password field hides itself again.
  const [submitCount, setSubmitCount] = useState(0);
  // Wrong passwords in a row; from FAILED_ATTEMPTS_BEFORE_RESET_HINT on, the
  // reset link becomes a banner.
  const [failedAttempts, setFailedAttempts] = useState(0);

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
        // Start over on the password, keep the email.
        setPassword("");
        setFailedAttempts((count) => count + 1);
        requestAnimationFrame(() => document.getElementById(passwordId)?.focus());
      } else {
        setError("შესვლა ვერ მოხერხდა. შეამოწმე მონაცემები და სცადე თავიდან.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="შესვლა"
      subtitle="კარგია, რომ დაბრუნდი"
      chip={role ? <AuthSpaceChip role={role} /> : undefined}
      footer={
        <>
          ანგარიში არ გაქვს?{" "}
          <Link href={role ? `/registration?role=${role}` : "/select-space"} className={authLinkClass}>
            რეგისტრაცია
          </Link>
        </>
      }
    >
      {showDevBypass && role && (
        <div className="rounded-[14px] border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 text-xs leading-relaxed text-amber-800 dark:text-amber-200/90">
          <p className="font-medium">Dev რეჟიმი (მხოლოდ localhost)</p>
          <button
            type="button"
            onClick={handleDevSkip}
            className="mt-2 w-full rounded-lg border border-amber-500/30 bg-amber-500/10 py-2 text-xs font-medium transition-colors hover:bg-amber-500/20"
          >
            Dev: პორტალის გადახედვა
          </button>
        </div>
      )}

      {/* Google works without a pre-chosen space — the account's space is read
          at /auth/complete, so a returning user isn't asked to choose again. */}
      <GoogleAuthButton role={role ?? "abiturient"} label="შესვლა Google-ით" />
      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={emailId} className={authLabelClass}>
            ელ-ფოსტა
          </label>
          <div className="relative">
            <Mail className={authIconClass(emailInvalid)} aria-hidden />
            <input
              id={emailId}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailInvalid) setFieldError(null);
              }}
              aria-invalid={emailInvalid || undefined}
              aria-describedby={emailInvalid ? emailErrorId : undefined}
              className={authInputClass(emailInvalid)}
              placeholder="name@example.com"
            />
          </div>
          {emailInvalid ? <FieldError id={emailErrorId}>{fieldError?.message}</FieldError> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={passwordId} className={authLabelClass}>
              პაროლი
            </label>
            <Link href={forgotPasswordHref(email)} className={`text-[13px] ${authLinkClass}`}>
              დაგავიწყდა?
            </Link>
          </div>
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
            icon={<Lock className={authIconClass(passwordInvalid)} aria-hidden />}
            className={authInputClass(passwordInvalid)}
            placeholder="შენი პაროლი"
          />
          {passwordInvalid && (
            <div id={passwordErrorId} className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-[13px]">
              <p className="font-medium text-rose-600 dark:text-rose-400">{fieldError?.message}</p>
              {failedAttempts > 0 && (
                <Link href={forgotPasswordHref(email)} className={authLinkClass}>
                  დაგავიწყდა პაროლი?
                </Link>
              )}
            </div>
          )}
        </div>

        {failedAttempts >= FAILED_ATTEMPTS_BEFORE_RESET_HINT && (
          <Link
            href={forgotPasswordHref(email)}
            className="auth-focus flex items-center gap-3 rounded-[14px] border border-pink-200 bg-pink-50 px-3.5 py-3 text-sm text-pink-800 transition hover:border-pink-300 dark:border-pink-400/25 dark:bg-pink-500/10 dark:text-pink-200"
          >
            <KeyRound className="h-4 w-4 shrink-0" aria-hidden />
            <span>
              ვერ შედიხარ? <span className="font-semibold underline underline-offset-2">აღადგინე პაროლი ელ-ფოსტით</span>
            </span>
          </Link>
        )}

        {error && (
          <Alert
            tone="error"
            action={
              unconfirmed ? (
                resendState === "sent" ? (
                  <span className="text-emerald-700 dark:text-emerald-300/90">
                    ახალი დადასტურების ბმული გამოგზავნილია — შეამოწმე ინბოქსი.
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleResend()}
                    disabled={resendState === "sending"}
                    className="font-semibold underline underline-offset-2 disabled:opacity-50"
                  >
                    {resendState === "sending"
                      ? "იგზავნება..."
                      : resendState === "error"
                        ? "ვერ გაიგზავნა, სცადე თავიდან"
                        : "ხელახლა გამოგზავნა"}
                  </button>
                )
              ) : undefined
            }
          >
            {error}
          </Alert>
        )}

        <button type="submit" disabled={isLoading} className={authPrimaryButtonClass}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              შესვლა…
            </>
          ) : (
            "შესვლა"
          )}
        </button>
      </form>
    </AuthCard>
  );
}
