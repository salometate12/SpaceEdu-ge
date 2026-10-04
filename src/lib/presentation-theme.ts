/**
 * Slide colours per template, shared by the on-screen slides and the PPTX
 * export so both look the same.
 */
export interface SlideTheme {
  bg: string;
  title: string;
  body: string;
  accent: string;
}

export const SLIDE_THEMES: Record<string, SlideTheme> = {
  galaxy: { bg: "#0F0520", title: "#F0EBFF", body: "#C4B5FD", accent: "#A78BFA" },
  ocean: { bg: "#021825", title: "#ECFEFF", body: "#67E8F9", accent: "#22D3EE" },
  forest: { bg: "#021A0E", title: "#DCFCE7", body: "#86EFAC", accent: "#22C55E" },
  sunset: { bg: "#1C0F00", title: "#FEF3C7", body: "#FCD34D", accent: "#F59E0B" },
  minimal: { bg: "#FFFFFF", title: "#0F172A", body: "#334155", accent: "#7C3AED" },
  bold: { bg: "#7C3AED", title: "#FFFFFF", body: "#EDE9FE", accent: "#22D3EE" },
};

export function slideTheme(templateId: string): SlideTheme {
  return SLIDE_THEMES[templateId] ?? SLIDE_THEMES.galaxy;
}
