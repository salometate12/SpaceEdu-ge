import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** The head of a step's card: a coloured 42px tile with the icon, the title and a line under it. */
export function StepSection({
  icon: Icon,
  tone,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  /** Tile background and icon colour, light and dark. */
  tone: { bg: string; fg: string; darkBg: string; darkFg: string };
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-6">
      <header className="flex items-center gap-3.5">
        <span
          className="wz-tile flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px]"
          style={{ "--tile-bg": tone.bg, "--tile": tone.fg, "--tile-dark-bg": tone.darkBg, "--tile-dark": tone.darkFg } as React.CSSProperties}
          aria-hidden
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[20px] font-bold leading-tight text-[var(--wz-title)]">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-[14px] text-[var(--wz-muted)]">{subtitle}</p> : null}
        </div>
      </header>
      {children}
    </section>
  );
}

export const TONES = {
  pink: { bg: "#fdf2f8", fg: "#db2777", darkBg: "rgba(236,72,153,.14)", darkFg: "#f472b6" },
  blue: { bg: "#eff6ff", fg: "#1d4ed8", darkBg: "rgba(59,130,246,.14)", darkFg: "#93c5fd" },
  green: { bg: "#f0fdf4", fg: "#15803d", darkBg: "rgba(74,222,128,.12)", darkFg: "#86efac" },
  orange: { bg: "#fff7ed", fg: "#c2410c", darkBg: "rgba(249,115,22,.14)", darkFg: "#fdba74" },
} as const;
