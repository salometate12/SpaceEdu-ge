import { getSpaceLabel, type UserSpace } from "@/lib/profile";

/**
 * The overview header card: a large avatar, the user's name, and the space
 * chip ("შენი სფეისი: …") — the same information that used to sit in a
 * separate strip, now folded into the mockup's avatar-block style.
 */
export function OverviewHeader({
  name,
  initials,
  space,
}: {
  name: string;
  initials: string;
  space: UserSpace;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[2.5px] border-[#7F77DD] bg-[#EEEDFE] text-[22px] font-medium text-[#3C3489] dark:bg-[rgba(127,119,221,0.16)] dark:text-[#c9c4fb]">
        {initials || "მე"}
      </span>
      <div className="min-w-0">
        <h1 className="headline truncate text-lg font-bold text-[var(--text-primary)]">
          {name || "პროფილი"}
        </h1>
        <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-2.5 py-1 text-xs text-[#534AB7] dark:border-[rgba(127,119,221,0.3)] dark:bg-[rgba(127,119,221,0.12)] dark:text-[#c9c4fb]">
          შენი სფეისი:{" "}
          <span className="headline font-semibold">{getSpaceLabel(space)}</span>
        </div>
      </div>
    </div>
  );
}
