"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Loader2, Lock, Mail, MailCheck, User } from "lucide-react";
import { signUpWithEmail } from "@/lib/auth";
import { GoogleAuthButton } from "@/components/registration/GoogleAuthButton";
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
  authSecondaryButtonClass,
} from "@/components/registration/AuthCard";
import {
  devSkipRegistrationAllowed,
  isDevPortalBypass,
  parseDevPortalTarget,
  persistSpaceForRole,
  resolveAuthRedirectHref,
} from "@/lib/dev-portal-bypass";
import {
  parseRegistrationRole,
  registrationRoleSubtext,
  roleToRegisterSpace,
  type RegistrationRoleParam,
} from "@/lib/registration-role";
import {
  splitFullName,
  validateRegistrationForm,
  type RegistrationErrors,
  type RegistrationField,
} from "@/lib/registration-validation";
interface FormFieldProps {
  id: string;
  label: string;
  icon: typeof User;
  error?: string;
  children: ReactNode;
}

function FormField({ id, label, icon: Icon, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={authLabelClass}>
        {label}
      </label>
      <div className="relative">
        <Icon className={authIconClass(Boolean(error))} aria-hidden />
        {children}
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

export function RegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = parseRegistrationRole(searchParams.get("role"));
  const devTarget = parseDevPortalTarget(searchParams.get("dev_target"));
  const showDevBypass = devSkipRegistrationAllowed(role);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  // Bumped on every submit so the password field hides itself again.
  const [submitCount, setSubmitCount] = useState(0);

  // Unique per component instance. The App Router keeps the previous route
  // mounted (hidden, via React Activity) when only the ?role search param
  // changes, so two copies of this form can coexist in the DOM. useId gives
  // each copy its own field ids, keeping <label htmlFor>, aria-describedby and
  // browser password managers pointed at the right (visible) inputs.
  const fieldId = useId();
  const nameId = `${fieldId}-name`;
  const emailId = `${fieldId}-email`;
  const passwordId = `${fieldId}-password`;

  // When Activity hides this form (navigating away), wipe the password and any
  // errors from the hidden copy so a typed password never lingers off-screen.
  // The name and email are harmless to keep, so a returning user finds them.
  useLayoutEffect(() => {
    return () => {
      setPassword("");
      setErrors({});
      setSubmitError(null);
    };
  }, []);

  const roleSubtext = useMemo(
    () => (role ? registrationRoleSubtext(role) : null),
    [role],
  );

  const clearFieldError = useCallback((field: RegistrationField) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const finishAuthRedirect = useCallback(
    (activeRole: RegistrationRoleParam) => {
      persistSpaceForRole(activeRole);
      router.push(resolveAuthRedirectHref(activeRole, devTarget));
    },
    [devTarget, router],
  );

  const handleDevSkip = useCallback(() => {
    if (!role) return;
    finishAuthRedirect(role);
  }, [finishAuthRedirect, role]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitCount((n) => n + 1);

    const nextErrors = validateRegistrationForm({
      name,
      email,
      password,
      termsAccepted,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!role) {
      setSubmitError("აირჩიე სივრცე რეგისტრაციის დასაწყებად.");
      return;
    }

    const space = roleToRegisterSpace(role);
    const { firstName, lastName } = splitFullName(name);

    setIsLoading(true);
    try {
      const { hasSession } = await signUpWithEmail({
        email: email.trim(),
        password,
        firstName,
        lastName: lastName || firstName,
        space,
      });

      if (hasSession) {
        finishAuthRedirect(role);
      } else {
        setAwaitingConfirmation(true);
      }
    } catch {
      if (isDevPortalBypass() && role) {
        finishAuthRedirect(role);
        return;
      }
      setSubmitError("რეგისტრაცია ვერ დასრულდა. სცადე თავიდან ან გამოიყენე სხვა ელ-ფოსტა.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!role) {
    return (
      <AuthCard title="შექმენი ანგარიში" subtitle="რეგისტრაციისთვის ჯერ აირჩიე სასწავლო სივრცე.">
        <Link href="/select-space" className={authPrimaryButtonClass}>
          სივრცის არჩევაზე გადასვლა
        </Link>
      </AuthCard>
    );
  }

  if (awaitingConfirmation) {
    return (
      <AuthCard
        title="დაადასტურე ელ-ფოსტა"
        chip={<AuthSpaceChip role={role} />}
        subtitle={
          <>
            გამოგიგზავნეთ დადასტურების ბმული მისამართზე{" "}
            <span className="font-semibold text-[var(--au-title)]">{email.trim()}</span>. გახსენი ის და დააჭირე ბმულს, რომ
            შესვლა შესაძლებელი გახდეს.
          </>
        }
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
          <MailCheck className="h-6 w-6" strokeWidth={1.6} aria-hidden />
        </div>
        <Link href={`/login?role=${role}`} className={authSecondaryButtonClass}>
          შესვლის გვერდზე გადასვლა
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="შექმენი ანგარიში"
      subtitle={roleSubtext}
      eyebrow="ნაბიჯი 2 / 2"
      chip={<AuthSpaceChip role={role} />}
      footer={
        <>
          უკვე გაქვს ანგარიში?{" "}
          <Link href={`/login?role=${role}`} className={authLinkClass}>
            შესვლა
          </Link>
        </>
      }
    >
      {showDevBypass && role && (
        <div className="rounded-[14px] border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 text-xs leading-relaxed text-amber-800 dark:text-amber-200/90">
          <p className="font-medium">Dev რეჟიმი (მხოლოდ localhost)</p>
          <p className="mt-1 opacity-80">
            გადახედვისთვის Supabase-ის გარეშე გადადი პორტალზე. სტუდენტი:{" "}
            <code className="text-[10px]">/dashboard-student</code>
            {devTarget === "georgian-space" ? " ან georgian space." : "."}
          </p>
          <button
            type="button"
            onClick={handleDevSkip}
            className="mt-3 w-full rounded-lg border border-amber-500/30 bg-amber-500/10 py-2 text-xs font-medium transition-colors hover:bg-amber-500/20"
          >
            Dev: პორტალის გადახედვა (ვალიდაციის გარეშე)
          </button>
        </div>
      )}

      <GoogleAuthButton role={role} label="გააგრძელე Google-ით" />
      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField id={nameId} label="სახელი და გვარი" icon={User} error={errors.name}>
          <input
            id={nameId}
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError("name");
            }}
            aria-invalid={Boolean(errors.name) || undefined}
            aria-describedby={errors.name ? `${nameId}-error` : undefined}
            placeholder="მაგ: ნინო ბერიძე"
            className={authInputClass(Boolean(errors.name))}
          />
        </FormField>

        <FormField id={emailId} label="ელ-ფოსტა" icon={Mail} error={errors.email}>
          <input
            id={emailId}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            aria-invalid={Boolean(errors.email) || undefined}
            aria-describedby={errors.email ? `${emailId}-error` : undefined}
            placeholder="name@example.com"
            className={authInputClass(Boolean(errors.email))}
          />
        </FormField>

        <FormField id={passwordId} label="პაროლი" icon={Lock} error={errors.password}>
          <PasswordInput
            key={submitCount}
            id={passwordId}
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError("password");
            }}
            invalid={Boolean(errors.password)}
            aria-invalid={Boolean(errors.password) || undefined}
            aria-describedby={errors.password ? `${passwordId}-error` : undefined}
            placeholder="მინიმუმ 6 სიმბოლო"
            className={authInputClass(Boolean(errors.password))}
          />
        </FormField>

        <div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                clearFieldError("terms");
              }}
              aria-invalid={Boolean(errors.terms) || undefined}
              aria-describedby={errors.terms ? `${fieldId}-terms-error` : undefined}
              className="auth-focus mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer accent-[#e11d74]"
            />
            <span className="text-[14px] leading-relaxed text-[var(--au-text)]">
              ვეთანხმები SpaceEdu-ს{" "}
              <Link href="/privacy" className={authLinkClass}>
                წესებსა და პირობებს
              </Link>
            </span>
          </label>
          <FieldError id={`${fieldId}-terms-error`}>{errors.terms}</FieldError>
        </div>

        {submitError ? <Alert tone="error">{submitError}</Alert> : null}

        <button type="submit" disabled={isLoading} className={authPrimaryButtonClass}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              იქმნება ანგარიში…
            </>
          ) : (
            "ანგარიშის შექმნა"
          )}
        </button>
      </form>
    </AuthCard>
  );
}
