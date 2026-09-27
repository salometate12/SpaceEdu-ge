import Link from "next/link";
import { Check, Crown } from "lucide-react";
import { getServerAccountMeta } from "@/lib/auth-server";
import { getPlanStatus } from "@/lib/subscription";
import { SettingsCard } from "@/components/profile/settings-ui";

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
      <div className="flex items-center gap-3.5 rounded-xl border-2 border-[#7F77DD] bg-[#EEEDFE] p-4 dark:bg-[rgba(127,119,221,0.12)]">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7F77DD] text-white">
          <Check className="h-[18px] w-[18px] stroke-[2]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-[#3C3489] dark:text-[#c9c4fb]">
            {plan.label}
          </div>
          <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{statusText}</div>
        </div>
        <span className="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-[#534AB7] dark:bg-white/10 dark:text-[#c9c4fb]">
          აქტიური
        </span>
      </div>

      <p className="mt-4 text-xs text-[var(--text-secondary)]">
        პლანების სრული სია, ფასები და შესაძლებლობები იხილე ფასების გვერდზე.
      </p>
      <Link
        href="/pricing"
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#7F77DD] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#534AB7]"
      >
        <Crown className="h-3.5 w-3.5" aria-hidden />
        პლანების ნახვა და განახლება
      </Link>
    </SettingsCard>
  );
}
