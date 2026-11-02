/**
 * The journal's three kinds of entry and their colours — one source for the
 * dashboard card, the list, the chips, the editor and the calendar.
 * `color` is for dots and fills; `colorDark` is the same hue dark enough
 * for text on white (WCAG AA), e.g. yellow → #a16207. Lectures are in „ჩემი საგნები“.
 */
import type { JournalSection } from "@/lib/lecture-notes";

export interface JournalCategory {
  id: JournalSection;
  /** One entry: „დავალება“. */
  label: string;
  /** The tab / chip: „დავალებები“. */
  plural: string;
  color: string;
  colorDark: string;
}

export const JOURNAL_CATEGORIES: readonly JournalCategory[] = [
  { id: "assignments", label: "დავალება", plural: "დავალებები", color: "#38bdf8", colorDark: "#0369a1" },
  { id: "ai-notes", label: "AI ნოტი", plural: "AI ნოტები", color: "#eab308", colorDark: "#a16207" },
  { id: "ideas", label: "იდეა", plural: "იდეები", color: "#14b8a6", colorDark: "#0f766e" },
];

export function journalCategory(id: JournalSection): JournalCategory {
  return JOURNAL_CATEGORIES.find((category) => category.id === id) ?? JOURNAL_CATEGORIES[0];
}
