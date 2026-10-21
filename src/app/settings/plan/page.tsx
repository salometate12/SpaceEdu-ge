import Link from "next/link";
import { Check, Crown } from "lucide-react";
import { getServerAccountMeta } from "@/lib/auth-server";
import { getPlanStatus } from "@/lib/subscription";
import { ActiveCard, SettingsCard } from "@/components/profile/settings-ui";
import { nbButtonClass } from "@/lib/nb-button";

export default async function SettingsPlanPage() {
  const account = await getServerAccountMeta();
  const plan = getPlanStatus(account?.metadata ?? null, account?.createdAt ?? null);

  const statusText =
    plan.kind === "active"
      ? "შენ გაქვს აქტიური ფასიანი პლანი."
      : plan.kind === "trial"
        ? `უფასო საცდელი პერიოდი — დარჩა ${plan.trialDaysLeft} დღე.`
        : "ამჟამად უფასო პლანზე ხარ.";

  return (
    <SettingsCard
      icon={Crown}
      title="გამოწერის პლანი"
      subtitle="მიმდინარე პლანი და განახლების ვარიანტები"
      bodyClassName="p-5"
    >
      <ActiveCard icon={Check} title={plan.label} subtitle={statusText} />

      <p className="mt-4 text-xs text-[var(--text-secondary)]">
        პლანების სრული სია, ფასები და შესაძლებლობები იხილე ფასების გვერდზე.
      </p>
      <Link
        href="/pricing"
        className={nbButtonClass({ variant: "primary", block: true, className: "mt-4" })}
      >
        <Crown aria-hidden />
        პლანების ნახვა და განახლება
      </Link>
    </SettingsCard>
  );
}
