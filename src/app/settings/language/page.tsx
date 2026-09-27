import { Languages } from "lucide-react";
import { SettingsCard, SoonBadge } from "@/components/profile/settings-ui";

const rowLabel = "flex items-center gap-2 text-[11px] uppercase tracking-[0.04em] text-[var(--text-secondary)]";
const selectClass =
  "w-full rounded-lg border border-[var(--border-hover)] bg-[var(--bg-secondary)] px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none focus:border-[#7F77DD] disabled:cursor-not-allowed disabled:opacity-60";

export default function SettingsLanguagePage() {
  return (
    <SettingsCard
      icon={Languages}
      title="ენა და რეგიონი"
      subtitle="ინტერფეისი და AI-ს პასუხების ენა"
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={rowLabel}>ინტერფეისის ენა</span>
          {/* The interface is Georgian-only for now, so English is not selectable. */}
          <select className={selectClass} defaultValue="ka">
            <option value="ka">ქართული</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={rowLabel}>
            AI-ს პასუხის ენა <SoonBadge />
          </span>
          <select className={selectClass} disabled defaultValue="ka">
            <option value="ka">ქართული</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={rowLabel}>
            თარიღის ფორმატი <SoonBadge />
          </span>
          <select className={selectClass} disabled defaultValue="dmy">
            <option value="dmy">DD/MM/YYYY</option>
          </select>
        </label>
      </div>
    </SettingsCard>
  );
}
