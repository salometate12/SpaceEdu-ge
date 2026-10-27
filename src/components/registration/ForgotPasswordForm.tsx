"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Mail, Smartphone } from "lucide-react";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import {
  loginHref,
  phoneResetEnabled,
  RESEND_COOLDOWN_SECONDS,
  RESET_FAILED_MESSAGE,
  RESET_PASSWORD_HREF,
  resetRequestOutcome,
  type ResetRequestOutcome,
} from "@/lib/password-reset";
import { AuthCard, authBackClass, authIconClass, authInputClass, authLabelClass, authLinkClass, authPrimaryButtonClass, authSecondaryButtonClass } from "./AuthCard";

type ResetMethod = "email" | "phone";

const METHOD_LABEL: Record<ResetMethod, string> = { email: "ელ-ფოსტა", phone: "ტელეფონი" };

/**
 * /forgot-password: asks Supabase to email a reset link. Laid out for a
 * second method — „ელ-ფოსტა | ტელეფონი“ tabs appear once
 * NEXT_PUBLIC_PHONE_RESET_ENABLED is on (SMS code reset isn't built yet).
 */
export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const methods: ResetMethod[] = phoneResetEnabled() ? ["email", "phone"] : ["email"];
  const [method, setMethod] = useState<ResetMethod>("email");
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [outcome, setOutcome] = useState<ResetRequestOutcome | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const fieldId = useId();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const send = async () => {
    const trimmed = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setEmailError("შეიყვანე სწორი ელ-ფოსტა");
      return;
    }
    setEmailError(null);
    setSending(true);
    try {
      if (!isSupabaseBrowserConfigured()) throw new Error("auth-unavailable");
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(RESET_PASSWORD_HREF)}`,
      });
      const next = resetRequestOutcome(error);
      setOutcome(next);
      if (next.kind === "sent") setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      setOutcome(error instanceof Error && error.message === "auth-unavailable" ? { kind: "failed", message: RESET_FAILED_MESSAGE } : resetRequestOutcome(error));
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send();
  };

  const sent = outcome?.kind === "sent";

  return (
    <AuthCard
      title="პაროლის აღდგენა"
      subtitle="შეიყვანე ელ-ფოსტა და გამოგიგზავნით ბმულს ახალი პაროლის დასაყენებლად."
      back={
        <Link href={loginHref(email)} className={authBackClass}>
          <ArrowLeft className="h-3.5 w-3.5" />
          უკან
        </Link>
      }
    >
      {methods.length > 1 ? (
        <div role="tablist" aria-label="აღდგენის გზა" className="grid grid-cols-2 gap-1 rounded-full bg-[var(--au-field)] p-1">
          {methods.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={method === item}
              onClick={() => setMethod(item)}
              className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-[13px] font-semibold transition ${
                method === item ? "bg-[var(--au-card)] text-[var(--au-title)] shadow-sm" : "text-[var(--au-muted)]"
              }`}
            >
              {item === "email" ? <Mail className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
              {METHOD_LABEL[item]}
            </button>
          ))}
        </div>
      ) : null}

      {method === "phone" ? (
        <p className="rounded-[14px] border border-[var(--au-card-border)] px-4 py-3 text-[14px] text-[var(--au-text)]">
          ტელეფონით აღდგენა მალე დაემატება — ნომერზე 6-ნიშნა კოდი მოვა.
        </p>
      ) : sent ? (
        <div className="space-y-4">
          <div role="status" className="flex gap-3 rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{outcome.message}</p>
          </div>
          <button
            type="button"
            onClick={() => void send()}
            disabled={cooldown > 0 || sending}
            className={authSecondaryButtonClass}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {cooldown > 0 ? `ხელახლა გაგზავნა (${cooldown} წმ)` : "ხელახლა გაგზავნა"}
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${fieldId}-email`} className={authLabelClass}>
              ელ-ფოსტა
            </label>
            <div className="relative">
              <Mail
                className={authIconClass(Boolean(emailError))}
              />
              <input
                id={`${fieldId}-email`}
                type="email"
                autoComplete="email"
                autoFocus={!email}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (emailError) setEmailError(null);
                }}
                aria-invalid={Boolean(emailError) || undefined}
                aria-describedby={emailError ? `${fieldId}-email-error` : undefined}
                className={authInputClass(Boolean(emailError))}
                placeholder="name@example.com"
              />
            </div>
            {emailError ? (
              <p id={`${fieldId}-email-error`} className="mt-1.5 text-[13px] font-medium text-rose-600 dark:text-rose-400">
                {emailError}
              </p>
            ) : null}
          </div>

          {outcome ? (
            <p role="alert" className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] text-rose-900 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-100">
              {outcome.message}
            </p>
          ) : null}

          <button type="submit" disabled={sending} className={authPrimaryButtonClass}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            ბმულის გაგზავნა
          </button>
        </form>
      )}

      <p className="text-center text-[14px]">
        <Link href={loginHref(email)} className={authLinkClass}>
          ← შესვლაზე დაბრუნება
        </Link>
      </p>
    </AuthCard>
  );
}
