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
import { NotebookSheet } from "./notebook/NotebookSheet";
import "./landing.css";

const ROLE_TABS: { id: PricingRole; label: string; dot: string }[] = [
  { id: "abiturient", label: "აბიტურიენტი", dot: "bg-[#facc15]" },
  { id: "student", label: "სტუდენტი", dot: "bg-[#ec4899]" },
];

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

  return (
    <RevealOnScroll delayMs={delayMs} className="h-full">
      <article
        className={`relative flex h-full flex-col gap-5 rounded-[24px] bg-[var(--ld-card)] p-7 ${
          popular ? "border-2 border-[#1c1a17] dark:border-[#fafaf9]" : "border border-[var(--ld-card-border)]"
        }`}
      >
        {popular && (
          <span className="absolute -top-3.5 left-6 -rotate-2 whitespace-nowrap rounded-[6px] bg-[#fde68a] px-2.5 py-1 text-[12.5px] font-bold text-[#713f12]">
            ყველაზე პოპულარული
          </span>
        )}

        <h3 className="text-[17px] font-bold text-[var(--ld-title)]">{tier.name}</h3>
        <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
          <p className="text-[40px] font-bold leading-none tracking-tight text-[var(--ld-title)]">{tier.price}</p>
          <p className="pb-1 text-[14px] text-[var(--ld-muted)]">{tier.period}</p>
        </div>
        <ul className="space-y-2.5">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-[14.5px] leading-relaxed text-[var(--ld-text)]">
              <Check
                className={`mt-1 h-4 w-4 shrink-0 ${popular ? "text-[#e11d74]" : "text-[var(--ld-muted)]"}`}
                strokeWidth={2.5}
                aria-hidden
              />
              <span className="min-w-0 break-words">{feature}</span>
            </li>
          ))}
        </ul>

        <Link
          href={tierCtaHref(tier, role)}
          className={`ld-focus mt-auto flex h-12 w-full items-center justify-center rounded-full px-4 text-center text-[15px] font-semibold transition-colors ${
            popular ? "ld-primary" : "ld-secondary"
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
    <section id="pricing" className="landing relative scroll-mt-24">
      <NotebookSheet>
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0 max-w-xl">
            <h2 className="text-[26px] font-bold leading-tight tracking-tight text-[var(--ld-title)] sm:text-[34px]">
              აირჩიე შენი სივრცის <span className="mark-pink">პაკეტი</span>
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--ld-text)] sm:text-[16px]">
              აბიტურიენტისა და სტუდენტისთვის ცალკე პაკეტები, დამალული გადასახადების გარეშე.
            </p>
          </div>
          <div
            className="inline-flex h-[46px] shrink-0 items-center rounded-full bg-[var(--ld-soft)] p-1"
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
                  className={`ld-focus inline-flex h-full items-center gap-2 rounded-full px-4 text-[14px] font-semibold transition-colors sm:px-5 ${
                    active
                      ? "bg-[var(--ld-segment-on)] text-[var(--ld-title)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                      : "text-[var(--ld-muted)] hover:text-[var(--ld-title)]"
                  }`}
                >
                  <span aria-hidden className={`h-2 w-2 rounded-full ${tab.dot}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div key={activeRole} className="mt-10 grid grid-cols-1 items-stretch gap-5 md:grid-cols-3" role="tabpanel">
          {tiers.map((tier, index) => (
            <PricingTierCard key={tier.id} tier={tier} role={activeRole} delayMs={80 * (index + 1)} />
          ))}
        </div>
      </NotebookSheet>
    </section>
  );
}
