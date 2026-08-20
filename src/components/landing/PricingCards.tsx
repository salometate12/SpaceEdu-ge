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

const ROLE_ACCENT: Record<
  PricingRole,
  {
    border: string;
    borderHover: string;
    glow: string;
    glowHover: string;
    overlay: string;
    badgeBorder: string;
    badgeBg: string;
    badgeShadow: string;
    check: string;
    buttonGradient: string;
    buttonGradientHover: string;
    buttonShadow: string;
    plainHover: string;
    plainButtonHover: string;
  }
> = {
  abiturient: {
    border: "border-purple-500/35",
    borderHover: "hover:border-purple-500/50",
    glow: "shadow-[0_0_40px_rgba(124,58,237,0.12)]",
    glowHover: "hover:shadow-[0_0_48px_rgba(124,58,237,0.18)]",
    overlay: "from-purple-600/[0.08]",
    badgeBorder: "border-purple-500/30",
    badgeBg: "bg-purple-600",
    badgeShadow: "shadow-purple-600/25",
    check: "text-purple-400",
    buttonGradient: "from-purple-600 to-indigo-600",
    buttonGradientHover: "hover:from-purple-500 hover:to-indigo-500",
    buttonShadow: "shadow-[0_0_20px_rgba(124,58,237,0.35)]",
    plainHover: "hover:border-purple-500/40",
    plainButtonHover: "hover:!border-purple-500/40",
  },
  student: {
    border: "border-cyan-500/35",
    borderHover: "hover:border-cyan-500/50",
    glow: "shadow-[0_0_40px_rgba(8,145,178,0.14)]",
    glowHover: "hover:shadow-[0_0_48px_rgba(8,145,178,0.2)]",
    overlay: "from-cyan-600/[0.08]",
    badgeBorder: "border-cyan-500/30",
    badgeBg: "bg-cyan-600",
    badgeShadow: "shadow-cyan-600/25",
    check: "text-cyan-400",
    buttonGradient: "from-cyan-600 to-blue-600",
    buttonGradientHover: "hover:from-cyan-500 hover:to-blue-500",
    buttonShadow: "shadow-[0_0_20px_rgba(8,145,178,0.35)]",
    plainHover: "hover:border-cyan-500/40",
    plainButtonHover: "hover:!border-cyan-500/40",
  },
};

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
        className={`relative flex min-h-[420px] flex-col justify-between rounded-2xl border p-8 backdrop-blur-xl transition-all duration-300 ${
          popular
            ? `${accent.border} bg-[#121214]/50 ${accent.glow} ${accent.borderHover} ${accent.glowHover}`
            : `border-white/[0.08] bg-[#121214]/40 ${accent.plainHover}`
        }`}
      >
        {popular && (
          <>
            <div
              className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b ${accent.overlay} via-transparent to-transparent`}
              aria-hidden
            />
            <span
              className={`absolute -top-3 left-1/2 z-[1] -translate-x-1/2 whitespace-nowrap rounded-full border ${accent.badgeBorder} ${accent.badgeBg} px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg ${accent.badgeShadow}`}
            >
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
                    popular ? accent.check : "text-gray-500"
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
            className={`w-full !rounded-full ${
              popular
                ? `bg-gradient-to-r ${accent.buttonGradient} ${accent.buttonShadow} ${accent.buttonGradientHover}`
                : `!border-white/[0.12] !bg-white/[0.03] ${accent.plainButtonHover}`
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
          className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] p-1"
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
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 sm:px-8 ${
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
