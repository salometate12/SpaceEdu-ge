"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import {
  isTrialTier,
  pricingTiersForRole,
  type PricingRole,
  type PricingTier,
} from "@/lib/landing-pricing-plans";
import { checkoutHref } from "@/lib/checkout-routes";
import { registrationHref } from "@/lib/registration-role";
import { Ruler } from "./notebook/Doodles";
import {
  ACCENT_CARD,
  ACCENT_SOLID,
  ACCENT_TEXT,
  PLAIN_CARD,
  type NotebookAccent,
} from "./notebook/accents";

const ROLE_TABS: { id: PricingRole; label: string }[] = [
  { id: "abiturient", label: "აბიტურიენტი" },
  { id: "student", label: "სტუდენტი" },
];

/** One pen colour per audience — the tabs, the popular card and its badge
 *  all pick it up, so switching tabs reads as switching pens. */
const ROLE_ACCENT: Record<PricingRole, NotebookAccent> = {
  abiturient: "violet",
  student: "blue",
};

/**
 * The free tier still starts with an account; the paid ones go straight to
 * checkout, which sends anyone who isn't signed in through registration
 * first and brings them back.
 */
function tierCtaHref(tier: PricingTier, role: PricingRole): string {
  return isTrialTier(tier.id) ? registrationHref(role) : checkoutHref(tier.id, role);
}

function PricingTierCard({
  tier,
  role,
  delayMs,
}: {
  tier: PricingTier;
  role: PricingRole;
  delayMs: number;
}) {
  const popular = tier.popular === true;
  const accent = ROLE_ACCENT[role];

  return (
    <RevealOnScroll delayMs={delayMs}>
      <article
        className={`relative flex min-h-[420px] flex-col justify-between rounded-2xl border-2 p-8 ${
          popular ? ACCENT_CARD[accent] : PLAIN_CARD
        }`}
      >
        {popular && (
          <span
            className={`paper-sticker absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${ACCENT_SOLID[accent]}`}
          >
            ყველაზე პოპულარული
          </span>
        )}

        <div>
          <h3 className="headline text-lg font-bold text-slate-900 dark:text-slate-50">
            {tier.name}
          </h3>
          <div className="mt-4 flex flex-wrap items-end gap-x-2 gap-y-1">
            <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
              {tier.price}
            </p>
            <p className="pb-1 text-sm text-slate-600 dark:text-slate-400">{tier.period}</p>
          </div>
          <ul className="mt-6 space-y-3">
            {tier.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300"
              >
                <Check
                  className={`mt-0.5 h-4 w-4 shrink-0 stroke-[2.5] ${
                    popular ? ACCENT_TEXT[accent] : "text-slate-500 dark:text-slate-400"
                  }`}
                  aria-hidden
                />
                <span className="min-w-0 break-words">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <Link
          href={tierCtaHref(tier, role)}
          className={`mt-8 block w-full rounded-full border-2 px-4 py-3 text-center text-sm font-bold ${
            popular
              ? `paper-sticker ${ACCENT_SOLID[accent]}`
              : "border-slate-400 bg-white/60 text-slate-700 transition-colors hover:border-slate-600 hover:text-slate-900 dark:border-white/20 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:border-white/40 dark:hover:text-white"
          }`}
        >
          {tier.cta}
        </Link>
      </article>
    </RevealOnScroll>
  );
}

export function PricingCards() {
  const [activeRole, setActiveRole] = useState<PricingRole>("abiturient");
  const tiers = pricingTiersForRole(activeRole);

  return (
    <section
      id="pricing"
      className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20"
    >
      <Ruler className="pointer-events-none absolute left-6 top-14 hidden w-24 -rotate-12 text-slate-400 xl:block dark:text-slate-500" />

      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p
          className={`text-[10px] font-bold uppercase tracking-wider ${ACCENT_TEXT.violet}`}
        >
          ფასების პაკეტები
        </p>
        <h2 className="headline mt-2 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-50">
          აირჩიე შენს სივრცეს შესაფერისი გეგმა
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          აბიტურიენტი თუ სტუდენტი — ყოველი მიმართულებისთვის ცალკე, გამჭვირვალე ფასები.
        </p>
      </div>

      <div className="mb-12 flex justify-center">
        <div
          className={`inline-flex rounded-full border-2 p-1 ${PLAIN_CARD}`}
          role="tablist"
          aria-label="ფასების კატეგორია"
        >
          {ROLE_TABS.map((tab) => {
            const active = activeRole === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveRole(tab.id)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-200 sm:px-8 ${
                  active
                    ? `border-2 ${ACCENT_SOLID[ROLE_ACCENT[tab.id]]}`
                    : "border-2 border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        key={activeRole}
        className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3"
        role="tabpanel"
      >
        {tiers.map((tier, index) => (
          <PricingTierCard
            key={tier.id}
            tier={tier}
            role={activeRole}
            delayMs={80 * (index + 1)}
          />
        ))}
      </div>
    </section>
  );
}
