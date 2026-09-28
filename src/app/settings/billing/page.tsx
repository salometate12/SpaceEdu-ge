import Link from "next/link";
import { CreditCard, Plus } from "lucide-react";
import { SettingsCard, SoonBadge } from "@/components/profile/settings-ui";

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
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#7F77DD] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#534AB7]"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        გადახდაზე გადასვლა
      </Link>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled
          title="მალე"
          className="inline-flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] px-4 py-2.5 text-[13px] font-medium text-[var(--text-secondary)] opacity-60"
        >
          <CreditCard className="h-3.5 w-3.5" aria-hidden />
          BOG Pay
          <SoonBadge />
        </button>
        <button
          type="button"
          disabled
          title="მალე"
          className="inline-flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] px-4 py-2.5 text-[13px] font-medium text-[var(--text-secondary)] opacity-60"
        >
          <CreditCard className="h-3.5 w-3.5" aria-hidden />
          TBC Pay
          <SoonBadge />
        </button>
      </div>
    </SettingsCard>
  );
}
