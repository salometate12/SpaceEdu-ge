/**
 * How each template looks, shared by the on-screen slides, the PDF capture
 * and the PPTX export so all three match. The first four fields are the
 * colours every template has; the rest are optional extras the newer
 * templates use (decoration, fonts, markers, slide numbers).
 */

import type { TextBox } from "@/lib/presentation-layout";

export type SlideDecor = "aurora" | "geometric" | "rule" | "bar" | "none";
export type BulletStyle = "dot" | "dash" | "number" | "square";

export interface SlideTheme {
  bg: string;
  title: string;
  body: string;
  accent: string;
  /** CSS font stacks; the page's own font when unset. */
  fontTitle?: string;
  fontBody?: string;
  /** Fonts for the PPTX — ones Office has, with Georgian (Calibri when unset). */
  pptxFontTitle?: string;
  pptxFontBody?: string;
  decor?: SlideDecor;
  titleAlign?: "left" | "center";
  /** A small page number bottom right (not on the cover). */
  slideNumber?: boolean;
  bulletStyle?: BulletStyle;
  /** Colour of small lines (column rules, section and thank-you bars, quote border); the accent when unset. */
  detail?: string;
  /** Colour of a key figure's number; the accent when unset. */
  figure?: string;
  /** Extra breathing room around the text, in % of the slide. */
  inset?: { x: number; y: number };
}

const SANS = 'var(--font-noto-georgian), "Noto Sans Georgian", Arial, sans-serif';
const SERIF = 'var(--font-noto-serif-georgian), "Noto Serif Georgian", Sylfaen, serif';

export const SLIDE_THEMES: Record<string, SlideTheme> = {
  // New: two striking, two minimal.
  aurora: {
    bg: "#0B1026",
    title: "#FFFFFF",
    body: "#CBD5E1",
    accent: "#5EEAD4",
    detail: "#A78BFA",
    fontTitle: SANS,
    fontBody: SANS,
    pptxFontTitle: "Arial",
    pptxFontBody: "Arial",
    decor: "aurora",
    slideNumber: true,
    bulletStyle: "dot",
  },
  geometric: {
    bg: "#FFFFFF",
    title: "#1E2A5A",
    body: "#374151",
    accent: "#E5493A",
    detail: "#FF6B5A",
    fontTitle: SANS,
    fontBody: SANS,
    pptxFontTitle: "Arial",
    pptxFontBody: "Arial",
    decor: "geometric",
    slideNumber: true,
    bulletStyle: "square",
    inset: { x: 4, y: 2 },
  },
  paper: {
    bg: "#FFFFFF",
    title: "#111827",
    body: "#4B5563",
    accent: "#E11D74",
    detail: "#111827",
    figure: "#111827",
    fontTitle: SERIF,
    fontBody: SANS,
    pptxFontTitle: "Sylfaen",
    pptxFontBody: "Arial",
    decor: "rule",
    slideNumber: true,
    bulletStyle: "dash",
    inset: { x: 3, y: 3 },
  },
  graphite: {
    bg: "#141517",
    title: "#F4F4F5",
    body: "#A1A1AA",
    accent: "#A3E635",
    detail: "#52525B",
    figure: "#F4F4F5",
    fontTitle: SANS,
    fontBody: SANS,
    pptxFontTitle: "Arial",
    pptxFontBody: "Arial",
    decor: "bar",
    bulletStyle: "square",
    inset: { x: 2, y: 0 },
  },
  // The original six.
  galaxy: { bg: "#0F0520", title: "#F0EBFF", body: "#C4B5FD", accent: "#A78BFA" },
  ocean: { bg: "#021825", title: "#ECFEFF", body: "#67E8F9", accent: "#22D3EE" },
  forest: { bg: "#021A0E", title: "#DCFCE7", body: "#86EFAC", accent: "#22C55E" },
  sunset: { bg: "#1C0F00", title: "#FEF3C7", body: "#FCD34D", accent: "#F59E0B" },
  minimal: { bg: "#FFFFFF", title: "#0F172A", body: "#334155", accent: "#7C3AED" },
  bold: { bg: "#7C3AED", title: "#FFFFFF", body: "#EDE9FE", accent: "#22D3EE" },
};

export const DEFAULT_TEMPLATE_ID = "paper";

export function slideTheme(templateId: string): SlideTheme {
  return SLIDE_THEMES[templateId] ?? SLIDE_THEMES[DEFAULT_TEMPLATE_ID];
}

const isFrameType = (type: string) => type === "cover" || type === "thanks";

/**
 * Where a slide's text goes in this theme: the photo-aware box, minus the
 * theme's inset. Aurora puts content text on a glass card, so the text
 * sits inside it with padding.
 */
export function themedTextBox(theme: SlideTheme, box: TextBox, slideType: string): { text: TextBox; card: TextBox | null } {
  const inset = theme.inset ?? { x: 0, y: 0 };
  const text: TextBox = {
    left: box.left + inset.x,
    right: box.right - inset.x,
    top: box.top + inset.y,
    bottom: box.bottom - inset.y,
  };
  if (theme.decor !== "aurora" || isFrameType(slideType)) return { text, card: null };
  return {
    card: text,
    text: { left: text.left + 2.5, right: text.right - 2.5, top: text.top + 4, bottom: text.bottom - 4 },
  };
}

/** Which title decoration a slide gets (sections and frames have their own bars). */
export function titleDecor(theme: SlideTheme, slideType: string, layout: string): "gradient" | "rule" | "bar" | null {
  if (slideType === "thanks" || (layout === "section" && slideType !== "cover")) return null;
  if (theme.decor === "aurora") return "gradient";
  if (theme.decor === "rule") return "rule";
  if (theme.decor === "bar" && slideType !== "cover") return "bar";
  return null;
}

/** The marker in front of a bullet point. */
export function bulletMarker(style: BulletStyle | undefined, index: number): string {
  switch (style) {
    case "dash":
      return "–";
    case "number":
      return `${index + 1}.`;
    case "square":
      return "■";
    default:
      return "•";
  }
}

/** Aurora's title underline, left to right. */
export const AURORA_GRADIENT = ["#7C3AED", "#2DD4BF", "#EC4899"] as const;
/** Paper's rule under the title. */
export const PAPER_RULE = "#E5E7EB";

/** Aurora's glass card behind the text. */
export const GLASS = { fill: "rgba(255,255,255,0.06)", line: "rgba(255,255,255,0.14)" } as const;

/** Graphite's accent bar left of the title: x offset and width in % of the
 * slide width, top offset and height in cqw (≈ % of the width). */
export const BAR = { offset: 1.7, w: 0.45, top: 0.55, h: 3.2 } as const;
