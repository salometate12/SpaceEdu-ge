/** One experience on the CV form: a job, an internship, a project or volunteering. */
export interface CvExperience {
  role: string;
  place: string;
  description: string;
}

export const MAX_EXPERIENCES = 6;

export const emptyExperience = (): CvExperience => ({ role: "", place: "", description: "" });

const clean = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export function hasContent(experience: CvExperience): boolean {
  return Boolean(experience.role.trim() || experience.place.trim() || experience.description.trim());
}

/**
 * The experiences from a request or saved state: the list when there is one,
 * otherwise the old single text as the first entry's description. Empty
 * entries are dropped; at most six.
 */
export function normalizeExperiences(input: { experiences?: unknown; experienceText?: unknown }): CvExperience[] {
  if (Array.isArray(input.experiences)) {
    return input.experiences
      .map((item) => {
        const entry = (item ?? {}) as Record<string, unknown>;
        return { role: clean(entry.role), place: clean(entry.place), description: clean(entry.description) };
      })
      .filter(hasContent)
      .slice(0, MAX_EXPERIENCES);
  }
  const text = clean(input.experienceText);
  return text ? [{ role: "", place: "", description: text }] : [];
}

/** One line per entry for the model and the not-yet-generated sheet: „პოზიცია, სად: რას აკეთებდი“. */
export function experienceLine(experience: CvExperience): string {
  const head = [experience.role.trim(), experience.place.trim()].filter(Boolean).join(", ");
  const body = experience.description.trim();
  return head && body ? `${head}: ${body}` : head || body;
}

/** The entries as numbered blocks for the model, each kept apart. */
export function experiencesForPrompt(experiences: CvExperience[]): string {
  if (experiences.length === 0) return "არ არის მითითებული";
  return experiences
    .map((experience, index) =>
      [
        `${index + 1}. პოზიცია ან პროექტი: ${experience.role.trim() || "არ არის მითითებული"}`,
        `   სად: ${experience.place.trim() || "არ არის მითითებული"}`,
        `   რას აკეთებდა: ${experience.description.trim() || "არ არის მითითებული"}`,
      ].join("\n"),
    )
    .join("\n");
}
