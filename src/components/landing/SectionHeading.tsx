import type { ReactNode } from "react";

/** A landing section's centred title (34px, 26 on phones) and line under it. */
export function SectionHeading({ title, subtitle, eyebrow }: { title: ReactNode; subtitle?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
      {eyebrow ? <div className="mb-3 flex justify-center">{eyebrow}</div> : null}
      <h2 className="text-[26px] font-bold leading-tight tracking-tight text-[var(--ld-title)] sm:text-[34px]">{title}</h2>
      {subtitle ? <p className="mt-3 text-[15px] leading-relaxed text-[var(--ld-text)] sm:text-[16px]">{subtitle}</p> : null}
    </div>
  );
}

/** The white card every middle section is built from. */
export const LANDING_CARD = "rounded-[24px] border border-[var(--ld-card-border)] bg-[var(--ld-card)]";

/** Tinted icon tiles, one per colour. */
export const TILE = {
  yellow: "bg-[var(--ld-yellow-bg)] text-[var(--ld-yellow)]",
  green: "bg-[var(--ld-green-bg)] text-[var(--ld-green)]",
  pink: "bg-[var(--ld-pink-bg)] text-[var(--ld-pink)]",
  blue: "bg-[var(--ld-blue-bg)] text-[var(--ld-blue)]",
  teal: "bg-[var(--ld-teal-bg)] text-[var(--ld-teal)]",
  orange: "bg-[var(--ld-orange-bg)] text-[var(--ld-orange)]",
} as const;

export type TileColor = keyof typeof TILE;
