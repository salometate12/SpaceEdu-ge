import { getExamYears } from "@/data/pastExamsData";

/**
 * Every writing task the past papers have set, flattened into a practice
 * pool.
 *
 * The topics are not invented: each one is the real essay prompt from a
 * particular year's variant, kept with the passage it belonged to, so a
 * student practising here is answering what was actually asked.
 */
export interface EssayTopic {
  id: string;
  year: number;
  variantLabel: string;
  /** The passage the task was attached to — the topic's context. */
  passageTitle: string;
  passageAuthor: string;
  prompt: string;
  points: number;
}

export function georgianEssayTopics(subjectId = "georgian"): EssayTopic[] {
  const topics: EssayTopic[] = [];
  for (const year of getExamYears(subjectId)) {
    for (const variant of year.variants) {
      for (const passage of variant.passages) {
        if (!passage.essay) continue;
        topics.push({
          id: `${year.year}-${variant.id}-${passage.essay.id}`,
          year: year.year,
          variantLabel: variant.label,
          passageTitle: passage.title,
          passageAuthor: passage.authorOrSource,
          prompt: passage.essay.prompt,
          points: passage.essay.points,
        });
      }
    }
  }
  return topics;
}

/**
 * Picks a topic at random, never handing back the one already on screen —
 * pressing "another topic" that returns the same one reads as a broken
 * button.
 */
export function pickRandomTopic(
  topics: EssayTopic[],
  currentId?: string,
): EssayTopic | null {
  if (topics.length === 0) return null;
  const pool =
    topics.length > 1 && currentId
      ? topics.filter((topic) => topic.id !== currentId)
      : topics;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}
