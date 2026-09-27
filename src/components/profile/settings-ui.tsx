// Shared (server + client) presentational pieces — no "use client" so server
// pages can pass an `icon` component into SettingsCard. The one interactive
// piece, Toggle, lives in its own client file and is re-exported here.
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export { Toggle } from "./Toggle";

/** A settings card: thin border, rounded, optional icon title + subtitle. */
export function SettingsCard({
  icon: Icon,
  title,
  subtitle,
  children,
  bodyClassName = "",
  danger = false,
}: {
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  bodyClassName?: string;
  danger?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
      {title && (
        <div className="px-5 pt-5">
          <h2
            className={`flex items-center gap-2 text-[15px] font-medium ${
              danger ? "text-rose-600 dark:text-rose-400" : "text-[var(--text-primary)]"
            }`}
          >
            {Icon && (
              <Icon
                className={`h-4 w-4 stroke-[1.75] ${danger ? "text-rose-600 dark:text-rose-400" : "text-[#7F77DD]"}`}
                aria-hidden
              />
            )}
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{subtitle}</p>
          )}
        </div>
      )}
      <div className={bodyClassName || "p-5"}>{children}</div>
    </section>
  );
}

/** The small grey "მალე" (coming soon) badge. */
export function SoonBadge() {
  return (
    <span className="ml-auto shrink-0 rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
      მალე
    </span>
  );
}

/** One row in a toggle list: coloured icon square, title/sub, and a control. */
export function ToggleRow({
  icon: Icon,
  tone = "purple",
  title,
  subtitle,
  control,
}: {
  icon: LucideIcon;
  tone?: "purple" | "teal" | "amber" | "coral" | "blue";
  title: string;
  subtitle?: string;
  control: ReactNode;
}) {
  const tones: Record<string, string> = {
    purple: "bg-[#EEEDFE] text-[#7F77DD] dark:bg-[rgba(127,119,221,0.16)] dark:text-[#a99ff5]",
    teal: "bg-[#E1F5EE] text-[#1D9E75] dark:bg-[rgba(29,158,117,0.16)] dark:text-[#4fd1a5]",
    amber: "bg-[#FAEEDA] text-[#BA7517] dark:bg-[rgba(186,117,23,0.18)] dark:text-[#e0a95f]",
    coral: "bg-[#FAECE7] text-[#D85A30] dark:bg-[rgba(216,90,48,0.16)] dark:text-[#f0916e]",
    blue: "bg-[#E6F1FB] text-[#378ADD] dark:bg-[rgba(55,138,221,0.16)] dark:text-[#6cb0f0]",
  };
  return (
    <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-3 last:border-b-0">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}
      >
        <Icon className="h-4 w-4 stroke-[1.75]" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-[var(--text-primary)]">{title}</div>
        {subtitle && <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{subtitle}</div>}
      </div>
      {control}
    </div>
  );
}
