import Link from "next/link";
import { Check } from "lucide-react";
import { getServerAccountMeta, getServerWorkingSpace } from "@/lib/auth-server";
import { getPlanStatus, readEntitlement } from "@/lib/subscription";
import { findPricingTier, pricingTiersForRole } from "@/lib/landing-pricing-plans";
import { MONTH_LONG } from "@/lib/study-day";
import { ActiveBadge, psButton, SettingsCard, SettingsPageTitle } from "@/components/profile/settings-ui";

function untilLabel(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getDate()} ${MONTH_LONG[date.getMonth()]}, ${date.getFullYear()}`;
}

export default async function SettingsPlanPage() {
  const [account, working] = await Promise.all([getServerAccountMeta(), getServerWorkingSpace()]);
  const metadata = account?.metadata ?? null;
  const plan = getPlanStatus(metadata, account?.createdAt ?? null);
  const entitlement = readEntitlement(metadata);
  const role = working.space === "student" ? "student" : "abiturient";
  // The paid tier on the account, or this space's trial.
  const tier =
    (plan.kind === "active" && entitlement.plan ? findPricingTier(entitlement.plan) : null) ??
    pricingTiersForRole(role)[0];
  const until = untilLabel(entitlement.paidUntil);

  const status =
    plan.kind === "active"
      ? until
        ? `მოქმედებს ${until}-მდე`
        : "აქტიური ფასიანი პლანი"
      : plan.kind === "trial"
        ? `დარჩა ${plan.trialDaysLeft} დღე`
        : "საცდელი პერიოდი დასრულდა";

  return (
    <>
      <SettingsPageTitle>პლანი და გადახდა</SettingsPageTitle>

      <SettingsCard title="მიმდინარე პლანი">
        <div className="rounded-[18px] border border-[var(--ps-border)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[19px] font-bold text-[var(--ps-title)]">{tier.name}</span>
                {plan.kind !== "free" ? <ActiveBadge /> : null}
              </div>
              <p className="mt-1 text-[13.5px] text-[var(--ps-muted)]">{status}</p>
            </div>
            <p className="text-right">
              <span className="text-[28px] font-bold leading-none text-[var(--ps-title)]">{tier.price}</span>
              <span className="ml-1.5 text-[13.5px] text-[var(--ps-muted)]">{tier.period}</span>
            </p>
          </div>
          <ul className="mt-4 space-y-2">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-[14.5px] text-[var(--ps-text)]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#e11d74]" strokeWidth={2.5} aria-hidden />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <div className="ps-actions mt-5">
          <Link href="/pricing" className={psButton(plan.kind === "active" ? "secondary" : "primary")}>
            {plan.kind === "active" ? "პლანის შეცვლა" : "პლანის არჩევა"}
          </Link>
        </div>
      </SettingsCard>

      <SettingsCard id="billing" title="გადახდის ისტორია" subtitle="გადახდები და ქვითრები">
        {/* No payment records are stored yet, so the history is always empty. */}
        <div className="rounded-[18px] border border-dashed border-[var(--ps-field-border)] px-5 py-8 text-center">
          <p className="text-[15px] font-semibold text-[var(--ps-title)]">გადახდები ჯერ არ არის</p>
          <p className="mt-1 text-[13.5px] text-[var(--ps-muted)]">პლანის შეძენის შემდეგ აქ გამოჩნდება.</p>
        </div>
      </SettingsCard>
    </>
  );
}
