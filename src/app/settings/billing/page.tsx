import Link from "next/link";
import { CreditCard, Plus } from "lucide-react";
import { SettingsCard, SoonBadge } from "@/components/profile/settings-ui";
import { nbButtonClass } from "@/lib/nb-button";

export default function SettingsBillingPage() {
  return (
    <SettingsCard
      icon={CreditCard}
      title="გადახდის მეთოდი"
      subtitle="ბარათი ან მობაილ-ფეი"
    >
      <div className="mb-3 flex items-center gap-3 rounded-xl border border-[var(--border)] p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
          <CreditCard className="h-[18px] w-[18px] stroke-[1.75]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] text-[var(--text-primary)]">ბარათი არ არის დამატებული</div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            გადახდა ხდება შეძენისას, გადახდის გვერდზე
          </div>
        </div>
      </div>

      <Link
        href="/checkout"
        className={nbButtonClass({ variant: "primary", block: true })}
      >
        <Plus aria-hidden />
        გადახდაზე გადასვლა
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled
          title="მალე"
          className={nbButtonClass({ variant: "secondary", block: true })}
        >
          <CreditCard aria-hidden />
          BOG Pay
          <SoonBadge />
        </button>
        <button
          type="button"
          disabled
          title="მალე"
          className={nbButtonClass({ variant: "secondary", block: true })}
        >
          <CreditCard aria-hidden />
          TBC Pay
          <SoonBadge />
        </button>
      </div>
    </SettingsCard>
  );
}
