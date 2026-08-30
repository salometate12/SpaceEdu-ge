"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Loader2, Lock, Mail, Rocket } from "lucide-react";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
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
  type RegistrationRoleParam,
} from "@/lib/registration-role";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = parseRegistrationRole(searchParams.get("role"));
  const devTarget = parseDevPortalTarget(searchParams.get("dev_target"));
  const showDevBypass = devSkipRegistrationAllowed(role);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");

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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setUnconfirmed(false);
    setResendState("idle");

    const activeRole = role ?? (isDevPortalBypass() ? "student" : null);
    if (!activeRole) {
      setError("აირჩიე სივრცე შესვლისთვის (/select-space).");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || password.length < 6) {
      if (!isDevPortalBypass()) {
        setError("შეიყვანე ელ-ფოსტა და პაროლი (მინ. 6 სიმბოლო).");
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isSupabaseBrowserConfigured() && trimmedEmail && password.length >= 6) {
        const supabase = createSupabaseBrowserClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) throw signInError;
      } else if (!isDevPortalBypass()) {
        throw new Error("auth-unavailable");
      }

      finishAuthRedirect(activeRole);
    } catch (err) {
      if (isDevPortalBypass()) {
        finishAuthRedirect(activeRole);
        return;
      }
      const code = (err as { code?: string } | null)?.code;
      const message = err instanceof Error ? err.message.toLowerCase() : "";
      if (code === "email_not_confirmed" || message.includes("not confirmed")) {
        setError(
          "ელ-ფოსტა ჯერ არ არის დადასტურებული. შეამოწმე ინბოქსი და დააჭირე დადასტურების ბმულს.",
        );
        setUnconfirmed(true);
      } else {
        setError("შესვლა ვერ მოხერხდა. შეამოწმე მონაცემები და სცადე თავიდან.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-white/[0.08] bg-[#121214]/40 p-8 shadow-2xl backdrop-blur-xl">
      <header className="space-y-3 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/25 bg-purple-600/20">
          <Rocket className="h-5 w-5 stroke-[1.5] text-purple-300" />
        </div>
        <h1 className="headline text-2xl font-bold text-white">შესვლა</h1>
        <p className="text-sm text-gray-400">{roleSubtext}</p>
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

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="relative flex flex-col space-y-1.5">
          <label htmlFor="login-email" className="text-xs font-medium text-gray-400">
            ელ-ფოსტა
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div className="relative flex flex-col space-y-1.5">
          <label htmlFor="login-password" className="text-xs font-medium text-gray-400">
            პაროლი
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
              placeholder="პაროლი"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-200/90">
            <p>{error}</p>
            {unconfirmed && (
              <div className="mt-2">
                {resendState === "sent" ? (
                  <span className="text-emerald-300/90">
                    ახალი დადასტურების ბმული გამოგზავნილია — შეამოწმე ინბოქსი.
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleResend()}
                    disabled={resendState === "sending"}
                    className="font-medium text-purple-300 underline underline-offset-2 hover:text-purple-200 disabled:opacity-50"
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
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-medium text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500 disabled:opacity-50"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          შესვლა
        </button>
      </form>

      <p className="text-center text-xs text-gray-500">
        ანგარიში არ გაქვს?{" "}
        <Link
          href={role ? `/registration?role=${role}` : "/select-space"}
          className="font-medium text-purple-400 hover:text-purple-300"
        >
          რეგისტრაცია
        </Link>
      </p>
    </div>
  );
}
