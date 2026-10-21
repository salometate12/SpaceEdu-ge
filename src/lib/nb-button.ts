/**
 * Neo-brutalist pill buttons: a hard dark outline, a solid offset shadow
 * (no blur) and magenta. The look lives in globals.css (.nb-btn…); this
 * builds the class names, so <button>, <Link> and <a> can share it.
 * Tried on the profile/settings pages first; usable anywhere.
 */

export type NbVariant = "primary" | "secondary" | "danger";
export type NbSize = "md" | "sm";

export interface NbButtonOptions {
  variant?: NbVariant;
  /** md = 44px (default), sm = 36px. */
  size?: NbSize;
  /** Full width. */
  block?: boolean;
  className?: string;
}

export function nbButtonClass({ variant = "secondary", size = "md", block = false, className = "" }: NbButtonOptions = {}): string {
  return ["nb-btn", `nb-btn--${variant}`, size === "sm" ? "nb-btn--sm" : "", block ? "nb-btn--block" : "", className]
    .filter(Boolean)
    .join(" ");
}

/** A menu item in the profile side menu / mobile chips (pill; active = magenta). */
export function nbNavClass({ active, danger = false, className = "" }: { active: boolean; danger?: boolean; className?: string }): string {
  return ["nb-nav", active ? (danger ? "nb-nav--active-danger" : "nb-nav--active") : danger ? "nb-nav--danger" : "", className]
    .filter(Boolean)
    .join(" ");
}

/** WCAG contrast ratio of two #rrggbb colours (for the tests and docs). */
export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The colours the CSS uses, light and dark. */
export const NB_COLORS = {
  light: { ink: "#0f0f14", shadow: "#0f0f14", primary: "#e11d74", onPrimary: "#ffffff", surface: "#ffffff", text: "#0f0f14", danger: "#be123c" },
  dark: { ink: "#f4f4f5", shadow: "#d81878", primary: "#e11d74", onPrimary: "#ffffff", surface: "#16161f", text: "#f4f4f5", danger: "#fb7185" },
} as const;
