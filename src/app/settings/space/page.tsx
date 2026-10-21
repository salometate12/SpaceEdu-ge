import { Info, LayoutGrid } from "lucide-react";
import { getServerAccountSpace } from "@/lib/auth-server";
import { getSpaceLabel, type UserSpace } from "@/lib/profile";
import { STUDY_PLAN_SUBJECTS } from "@/lib/study-plan-subjects";
import { ActiveCard, SETTINGS_TONE, SettingsCard } from "@/components/profile/settings-ui";

export default async function SettingsSpacePage() {
  const space = (await getServerAccountSpace()) ?? "abiturient";
  const label = getSpaceLabel(space as UserSpace);

  return (
    <SettingsCard
      icon={LayoutGrid}
      title="სასწავლო სივრცე"
      subtitle="შენი მიმდინარე სივრცე და საგნები"
    >
      <ActiveCard icon={LayoutGrid} title={label} subtitle="აქტიური სივრცე" />

      <div className="mt-4">
        <div className="mb-2 text-[11px] uppercase tracking-[0.04em] text-[var(--text-secondary)]">
          საგნები
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STUDY_PLAN_SUBJECTS.map((subject) => (
            <span key={subject.id} className={SETTINGS_TONE.chip}>
              {subject.title}
            </span>
          ))}
        </div>
      </div>

      {/* Space switching is intentionally not offered here: it needs the same
          guarded flow as /select-space (user_metadata.space + space-guard), which
          doesn't exist from this page yet. */}
      <p className="mt-4 flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 text-xs text-[var(--text-secondary)]">
        <Info className="mt-px h-3.5 w-3.5 shrink-0 stroke-[1.75]" aria-hidden />
        სივრცის შესაცვლელად დაგვიკავშირდი — მალე შესაძლებელი იქნება პირდაპირ აქედან.
      </p>
    </SettingsCard>
  );
}
