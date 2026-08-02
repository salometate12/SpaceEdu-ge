"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Loader2, Lock, Mail, Rocket, User } from "lucide-react";
import { signUpWithEmail } from "@/lib/auth";
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
const ERROR_LINE_CLASS = "min-h-[1.125rem] text-[11px] leading-snug text-rose-400/90";

function FieldError({ message }: { message?: string }) {
  return <p className={ERROR_LINE_CLASS}>{message ?? "\u00a0"}</p>;
}

interface FormFieldProps {
  id: string;
  label: string;
  icon: typeof User;
  error?: string;
  children: ReactNode;
}

function FormField({ id, label, icon: Icon, error, children }: FormFieldProps) {
  return (
    <div className="relative flex flex-col space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-gray-400">
        {label}
      </label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 stroke-[1.5] text-gray-500"
          aria-hidden
        />
        {children}
      </div>
      <FieldError message={error} />
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
      await signUpWithEmail({
        email: email.trim(),
        password,
        firstName,
        lastName: lastName || firstName,
        space,
      });

      finishAuthRedirect(role);
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
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/[0.08] bg-[#121214]/40 p-8 text-center backdrop-blur-xl">
        <p className="text-sm text-gray-400">
          რეგისტრაციისთვის ჯერ აირჩიე სასწავლო სივრცე.
        </p>
        <Link
          href="/select-space"
          className="inline-flex text-sm font-medium text-purple-400 transition-colors hover:text-purple-300"
        >
          სივრცის არჩევაზე გადასვლა
        </Link>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-md space-y-6 rounded-2xl border border-white/[0.08] bg-[#121214]/40 p-8 shadow-2xl backdrop-blur-xl"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.12), transparent)",
      }}
    >
      <header className="space-y-3 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/25 bg-purple-600/20 shadow-[0_0_24px_rgba(124,58,237,0.15)]">
          <Rocket className="h-5 w-5 stroke-[1.5] text-purple-300" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-400/90">
            SpaceEdu
          </p>
          <h1 className="headline mt-2 text-2xl font-bold text-white">შექმენი ანგარიში</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">{roleSubtext}</p>
        </div>
      </header>

      {showDevBypass && role && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 text-xs leading-relaxed text-amber-200/90">
          <p className="font-medium text-amber-100/95">Dev რეჟიმი (მხოლოდ localhost)</p>
          <p className="mt-1 text-amber-200/80">
            გადახედვისთვის Supabase-ის გარეშე გადადი პორტალზე. სტუდენტი:{" "}
            <code className="text-[10px] text-amber-100/90">/dashboard-student</code>
            {devTarget === "georgian-space" ? " ან georgian space." : "."}
          </p>
          <button
            type="button"
            onClick={handleDevSkip}
            className="mt-3 w-full rounded-lg border border-amber-500/30 bg-amber-500/10 py-2 text-xs font-medium text-amber-100 transition-colors hover:bg-amber-500/20"
          >
            Dev: პორტალის გადახედვა (ვალიდაციის გარეშე)
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FormField id="reg-name" label="სახელი და გვარი" icon={User} error={errors.name}>
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError("name");
            }}
            placeholder="მაგ: ნინო ბერიძე"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition-all focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
          />
        </FormField>

        <FormField id="reg-email" label="ელ-ფოსტა" icon={Mail} error={errors.email}>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            placeholder="name@example.com"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition-all focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
          />
        </FormField>

        <FormField id="reg-password" label="პაროლი" icon={Lock} error={errors.password}>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError("password");
            }}
            placeholder="მინიმუმ 6 სიმბოლო"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition-all focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
          />
        </FormField>

        <div className="space-y-1.5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                clearFieldError("terms");
              }}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/[0.1] bg-white/[0.02] text-purple-600 focus:ring-0 focus:ring-offset-0 checked:border-purple-500 checked:bg-purple-600"
            />
            <span className="text-xs leading-relaxed text-gray-400">
              ვეთანხმები SpaceEdu-ს{" "}
              <Link href="/pricing" className="text-purple-400/90 hover:text-purple-300">
                წესებსა და პირობებს
              </Link>
            </span>
          </label>
          <FieldError message={errors.terms} />
        </div>

        {submitError && (
          <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-200/90">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center space-x-2 rounded-xl bg-purple-600 py-3 text-sm font-medium text-white shadow-lg shadow-purple-600/20 transition-all duration-200 hover:bg-purple-500 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin stroke-[1.5]" aria-hidden />
              <span>იქმნება ანგარიში...</span>
            </>
          ) : (
            <span>ანგარიშის შექმნა</span>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-gray-500">
        უკვე გაქვს ანგარიში?{" "}
        <Link
          href={`/login?role=${role}`}
          className="font-medium text-purple-400 transition-colors hover:text-purple-300"
        >
          შესვლა
        </Link>
      </p>
    </div>
  );
}
