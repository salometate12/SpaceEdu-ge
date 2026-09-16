import type { NotebookAccent } from "@/components/landing/notebook/accents";

/**
 * Each subject's pen colour on the notebook pages.
 *
 * `SUBJECT_THEMES` in `abiturient-subjects.ts` still holds the dashboard's
 * neon palette; this is the same idea translated into the five notebook
 * accents, so a subject keeps its identity from the dashboard card through
 * its hub, its archive and the exam itself.
 */
const SUBJECT_ACCENTS: Record<string, NotebookAccent> = {
  history: "violet",
  english: "amber",
  georgian: "pink",
  math: "blue",
  geography: "green",
  civics: "violet",
  chemistry: "green",
};

export function subjectAccent(subjectId: string | null | undefined): NotebookAccent {
  if (!subjectId) return "blue";
  return SUBJECT_ACCENTS[subjectId] ?? "blue";
}

/**
 * A second colour for the cards sitting next to a subject's own, so a page
 * is never one accent repeated. Picked to sit apart from the primary.
 */
const SUBJECT_SECONDARY_ACCENTS: Record<string, NotebookAccent> = {
  history: "amber",
  english: "blue",
  georgian: "amber",
  math: "pink",
  geography: "blue",
  civics: "green",
  chemistry: "amber",
};

export function subjectSecondaryAccent(
  subjectId: string | null | undefined,
): NotebookAccent {
  if (!subjectId) return "green";
  return SUBJECT_SECONDARY_ACCENTS[subjectId] ?? "green";
}

/** A third, for the premium card — never the same as the other two. */
const SUBJECT_TERTIARY_ACCENTS: Record<string, NotebookAccent> = {
  history: "green",
  english: "pink",
  georgian: "green",
  math: "amber",
  geography: "pink",
  civics: "amber",
  chemistry: "violet",
};

export function subjectTertiaryAccent(
  subjectId: string | null | undefined,
): NotebookAccent {
  if (!subjectId) return "pink";
  return SUBJECT_TERTIARY_ACCENTS[subjectId] ?? "pink";
}
