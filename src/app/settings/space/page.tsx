import { LayoutGrid } from "lucide-react";
import { getServerAccountSpace } from "@/lib/auth-server";
import { getSpaceLabel, type UserSpace } from "@/lib/profile";
import { STUDY_PLAN_SUBJECTS } from "@/lib/study-plan-subjects";
import { SettingsCard } from "@/components/profile/settings-ui";

export default async function SettingsSpacePage() {
  const space = (await getServerAccountSpace()) ?? "abiturient";
  const label = getSpaceLabel(space as UserSpace);

  return (
    <SettingsCard
      icon={LayoutGrid}
      title="სასწავლო სივრცე"
      subtitle="შენი მიმდინარე სივრცე და საგნები"
    >
      <div className="flex items-center gap-3.5 rounded-xl border-2 border-[#7F77DD] bg-[#EEEDFE] p-4 dark:bg-[rgba(127,119,221,0.12)]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7F77DD] text-white">
          <LayoutGrid className="h-[18px] w-[18px] stroke-[1.75]" aria-hidden />
        </span>
        <div>
          <div className="text-[13px] font-medium text-[#3C3489] dark:text-[#c9c4fb]">{label}</div>
          <div className="text-[11px] text-[#7F77DD] dark:text-[#a99ff5]">აქტიური სივრცე</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-[11px] uppercase tracking-[0.04em] text-[var(--text-secondary)]">
          საგნები
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STUDY_PLAN_SUBJECTS.map((subject) => (
            <span
              key={subject.id}
              className="rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-2.5 py-1 text-[11px] text-[#534AB7] dark:border-[rgba(127,119,221,0.3)] dark:bg-[rgba(127,119,221,0.12)] dark:text-[#c9c4fb]"
            >
              {subject.title}
            </span>
          ))}
        </div>
      </div>

      {/* Space switching is intentionally not offered here: it needs the same
          guarded flow as /select-space (user_metadata.space + space-guard), which
          doesn't exist from this page yet. */}
      <p className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 text-xs text-[var(--text-secondary)]">
        სივრცის შესაცვლელად დაგვიკავშირდი — მალე შესაძლებელი იქნება პირდაპირ აქედან.
      </p>
    </SettingsCard>
  );
}
