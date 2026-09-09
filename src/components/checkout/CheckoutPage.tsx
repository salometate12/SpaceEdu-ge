"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Lock, ShieldCheck } from "lucide-react";
import { NotebookSheet } from "@/components/landing/notebook/NotebookSheet";
import { Pencil, Ruler, Sparkle } from "@/components/landing/notebook/Doodles";
import {
  ACCENT_CARD,
  ACCENT_PILL,
  ACCENT_SOLID,
  ACCENT_TEXT,
  PLAIN_CARD,
  type NotebookAccent,
} from "@/components/landing/notebook/accents";
import {
  findPricingTier,
  isTrialTier,
  pricingTiersForRole,
  roleForTier,
  type PricingRole,
  type PricingTier,
} from "@/lib/landing-pricing-plans";
import { checkoutHref, checkoutSuccessHref } from "@/lib/checkout-routes";
import { PAYWALL_REASON_PARAM, TRIAL_EXPIRED_REASON } from "@/lib/subscription";
import { PAYMENT_METHODS, PaymentMethodMark } from "./PaymentMethods";

/** Same pairing the pricing section uses, so a plan keeps its colour. */
const ROLE_ACCENT: Record<PricingRole, NotebookAccent> = {
  abiturient: "violet",
  student: "blue",
};

const ROLE_LABEL: Record<PricingRole, string> = {
  abiturient: "აბიტურიენტი",
  student: "სტუდენტი",
};

function TrialExpiredNotice() {
  return (
    <div
      className={`mb-6 rounded-2xl border-2 p-5 text-center ${ACCENT_CARD.amber}`}
      role="status"
    >
      <p className="text-sm font-bold text-slate-900 dark:text-slate-50">
        საცდელი წვდომის 3 დღე ამოიწურა
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        აირჩიე პაკეტი, რომ სწავლა იქიდან გააგრძელო, სადაც შეწყვიტე.
      </p>
    </div>
  );
}

/** Shown when we land here without a chosen plan — from the paywall. */
function PlanChooser({ reason }: { reason: string | null }) {
  const [role, setRole] = useState<PricingRole>("abiturient");
  const tiers = pricingTiersForRole(role).filter((tier) => !isTrialTier(tier.id));
  const accent = ROLE_ACCENT[role];

  return (
    <>
      {reason === TRIAL_EXPIRED_REASON && <TrialExpiredNotice />}

      <h1 className="headline text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
        აირჩიე <span className={ACCENT_TEXT[accent]}>პაკეტი</span>
      </h1>

      <div className="mb-8 mt-6 flex justify-center">
        <div className={`inline-flex rounded-full border-2 p-1 ${PLAIN_CARD}`} role="tablist">
          {(["abiturient", "student"] as const).map((option) => {
            const active = role === option;
            return (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setRole(option)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors sm:px-8 ${
                  active
                    ? `border-2 ${ACCENT_SOLID[ROLE_ACCENT[option]]}`
                    : "border-2 border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {ROLE_LABEL[option]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {tiers.map((tier) => (
          <Link
            key={tier.id}
            href={checkoutHref(tier.id, role)}
            className={`flex flex-col rounded-2xl border-2 p-6 transition-transform duration-300 hover:-translate-y-1 ${ACCENT_CARD[accent]}`}
          >
            <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{tier.name}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {tier.price}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{tier.period}</p>
            <span
              className={`mt-5 inline-flex w-fit items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-xs font-bold ${ACCENT_PILL[accent]}`}
            >
              {tier.cta}
              <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}

function Receipt({ tier, role }: { tier: PricingTier; role: PricingRole }) {
  const accent = ROLE_ACCENT[role];
  return (
    <div className={`rounded-2xl border-2 p-6 ${ACCENT_CARD[accent]}`}>
      <p className={`mono text-xs font-bold uppercase tracking-wider ${ACCENT_TEXT[accent]}`}>
        შენი ჩეკი
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-50">{tier.name}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {ROLE_LABEL[role]} · {tier.period}
          </p>
        </div>
        <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {tier.price}
        </p>
      </div>
    </div>
  );
}

function CheckoutForm({ tier, role }: { tier: PricingTier; role: PricingRole }) {
  const router = useRouter();
  const accent = ROLE_ACCENT[role];
  const [method, setMethod] = useState(PAYMENT_METHODS[0].id);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPayment = async () => {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tier.id, role, method }),
      });
      const payload = (await response.json()) as { redirectUrl?: string | null };

      if (payload.redirectUrl) {
        window.location.href = payload.redirectUrl;
        return;
      }
      // No provider yet. Locally that shouldn't block testing the rest of
      // the flow; in production it has to say so rather than pretend.
      if (process.env.NODE_ENV === "development") {
        router.push(checkoutSuccessHref(tier.id, role));
        return;
      }
      setError("გადახდის პროვაიდერი ჯერ არ არის ჩართული. სცადე მოგვიანებით.");
    } catch {
      setError("გადახდის დაწყება ვერ მოხერხდა. სცადე თავიდან.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Receipt tier={tier} role={role} />

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-50">
            აირჩიე გადახდის მეთოდი
          </h2>
          <div className="flex flex-col gap-2.5">
            {PAYMENT_METHODS.map((option) => {
              const selected = method === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setMethod(option.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-transform ${
                    selected ? `paper-sticker ${ACCENT_CARD[accent]}` : PLAIN_CARD
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-white/70 dark:bg-white/[0.08] ${
                      ACCENT_CARD[accent]
                    } ${ACCENT_TEXT[accent]}`}
                  >
                    <PaymentMethodMark icon={option.icon} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-900 dark:text-slate-50">
                      {option.name}
                    </span>
                    <span className="block truncate text-xs text-slate-600 dark:text-slate-400">
                      {option.note}
                    </span>
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 stroke-[2.5] text-slate-500 dark:text-slate-400"
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className={`flex flex-col rounded-2xl border-2 p-6 ${PLAIN_CARD}`}>
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white/70 dark:bg-white/[0.08] ${
              ACCENT_CARD[accent]
            } ${ACCENT_TEXT[accent]}`}
          >
            <ShieldCheck className="h-5 w-5 stroke-[2]" aria-hidden />
          </span>
          <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-50">
            გადახდა ბანკის დაცულ გვერდზე
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            ბარათის ნომერს SpaceEdu არასდროს ითხოვს და არ ინახავს. „გადახდაზე“
            დაჭერის შემდეგ გადახვალ შენი ბანკის საკუთარ, სერტიფიცირებულ გადახდის
            გვერდზე და იქ დაასრულებ ოპერაციას.
          </p>
          <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Lock className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden />
            3-D Secure დადასტურება ბანკის მხარეს
          </p>

          <div className="flex-1" />

          {error && (
            <p className="mt-5 text-sm font-semibold text-pink-600 dark:text-pink-300" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={startPayment}
            disabled={pending}
            className={`paper-sticker mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 px-6 py-3.5 text-base font-bold disabled:opacity-60 ${ACCENT_SOLID[accent]}`}
          >
            {pending ? "მოითმინე…" : `გადახდა — ${tier.price}`}
          </button>
          <Link
            href="/#pricing"
            className="mt-3 text-center text-xs font-semibold text-slate-600 underline underline-offset-4 dark:text-slate-400"
          >
            პაკეტის შეცვლა
          </Link>
        </div>
      </div>
    </>
  );
}

export function CheckoutPage() {
  const params = useSearchParams();
  const tierId = params.get("tier");
  const reason = params.get(PAYWALL_REASON_PARAM);

  const tier = tierId ? findPricingTier(tierId) : null;
  const role = tier ? roleForTier(tier.id) : null;
  const payable = tier && role && !isTrialTier(tier.id) ? { tier, role } : null;

  return (
    <main className="px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
      <NotebookSheet>
        <section className="relative mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
          <Sparkle className="pointer-events-none absolute right-8 top-8 hidden h-5 w-5 -rotate-12 text-amber-400 lg:block" />
          <Pencil className="pointer-events-none absolute bottom-10 left-6 hidden h-12 w-12 -rotate-12 text-amber-600/70 xl:block dark:text-amber-400/60" />
          <Ruler className="pointer-events-none absolute bottom-14 right-8 hidden w-24 rotate-12 text-slate-400 xl:block dark:text-slate-500" />

          {payable ? (
            <>
              {reason === TRIAL_EXPIRED_REASON && <TrialExpiredNotice />}
              <h1 className="headline mb-6 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
                გადახდა
              </h1>
              <CheckoutForm tier={payable.tier} role={payable.role} />
            </>
          ) : (
            <PlanChooser reason={reason} />
          )}
        </section>
      </NotebookSheet>
    </main>
  );
}
