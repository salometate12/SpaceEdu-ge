"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import {
  pricingTiersForRole,
  type PricingRole,
  type PricingTier,
} from "@/lib/landing-pricing-plans";
import { registrationHref } from "@/lib/registration-role";

const ROLE_TABS: { id: PricingRole; label: string }[] = [
  { id: "abiturient", label: "აბიტურიენტი" },
  { id: "student", label: "სტუდენტი" },
];

function tierCtaHref(role: PricingRole): string {
  return registrationHref(role);
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
    <RevealOnScroll delayMs={delayMs}>
      <article
        className={`relative flex min-h-[420px] flex-col justify-between rounded-2xl border p-8 backdrop-blur-xl transition-all duration-300 ${
          popular
            ? "border-purple-500/35 bg-[#121214]/50 shadow-[0_0_40px_rgba(124,58,237,0.12)] hover:border-purple-500/50 hover:shadow-[0_0_48px_rgba(124,58,237,0.18)]"
            : "border-white/[0.08] bg-[#121214]/40 hover:border-purple-500/40"
        }`}
      >
        {popular && (
          <>
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-purple-600/[0.08] via-transparent to-transparent"
              aria-hidden
            />
            <span className="absolute -top-3 left-1/2 z-[1] -translate-x-1/2 whitespace-nowrap rounded-full border border-purple-500/30 bg-purple-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-purple-600/25">
              ყველაზე პოპულარული
            </span>
          </>
        )}

        <div className="relative z-[1]">
          <h3 className="headline text-lg font-semibold text-white">{tier.name}</h3>
          <div className="mt-4 flex flex-wrap items-end gap-x-2 gap-y-1">
            <p className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {tier.price}
            </p>
            <p className="pb-1 text-sm text-gray-400">{tier.period}</p>
          </div>
          <ul className="mt-6 space-y-3">
            {tier.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-400"
              >
                <Check
                  className={`mt-0.5 h-4 w-4 shrink-0 stroke-[2] ${
                    popular ? "text-purple-400" : "text-gray-500"
                  }`}
                  aria-hidden
                />
                <span className="min-w-0 break-words">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <Link href={tierCtaHref(role)} className="relative z-[1] mt-8 block w-full">
          <Button
            variant={popular ? "primary" : "ghost"}
            className={`w-full ${
              popular
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
                : "!border-white/[0.12] !bg-white/[0.03] hover:!border-purple-500/40"
            }`}
          >
            {tier.cta}
          </Button>
        </Link>
      </article>
    </RevealOnScroll>
  );
}

export function PricingCards() {
  const [activeRole, setActiveRole] = useState<PricingRole>("abiturient");
  const tiers = pricingTiersForRole(activeRole);

  return (
    <section id="pricing" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-400/90">
          ფასების პაკეტები
        </p>
        <h2 className="headline mt-2 text-2xl font-bold text-white sm:text-3xl">
          აირჩიე შენს სივრცეს შესაფერისი გეგმა
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-400">
          აბიტურიენტი თუ სტუდენტი — ყოველი მიმართულებისთვის ცალკე, გამჭვირვალე ფასები.
        </p>
      </div>

      <div className="mb-12 flex justify-center">
        <div
          className="inline-flex rounded-xl border border-white/[0.08] bg-white/[0.03] p-1"
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
                className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 sm:px-8 ${
                  active
                    ? tab.id === "abiturient"
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20"
                      : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/20"
                    : "text-gray-400 hover:text-white"
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
        {tiers.map((tier, idx) => (
          <PricingTierCard
            key={tier.id}
            tier={tier}
            role={activeRole}
            delayMs={80 * (idx + 1)}
          />
        ))}
      </div>
    </section>
  );
}
