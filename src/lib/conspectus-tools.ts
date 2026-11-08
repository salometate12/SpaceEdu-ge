/**
 * „ამ კონსპექტიდან“: a quiz, flashcards or a presentation with the
 * conspectus as their source. Its text is handed to the tool (read once,
 * as it opens), and what's made stays with its subject and topic.
 */
import type { Conspectus } from "./conspectus-storage";
import { markdownToPlainText } from "./markdown-blocks";
import { newPresentationId } from "./presentation-store";
import { readSavedSemesterSubjects } from "./semester-subjects";
import { handOff, handOffPresentation } from "./tool-handoff";

export type ConspectusTool = "quiz" | "cards" | "presentation";

/** The presentation's extra instructions carry this much of the text. */
const PRESENTATION_SOURCE_CHARS = 4000;

/** The saved subject's name, when the conspectus was made for one. */
export function conspectusSubjectName(conspectus: Pick<Conspectus, "subjectId">): string | null {
  if (!conspectus.subjectId) return null;
  return readSavedSemesterSubjects().find((subject) => subject.id === conspectus.subjectId)?.name ?? null;
}

/** Hands the conspectus over and returns where the tool opens. */
export function openConspectusTool(tool: ConspectusTool, conspectus: Conspectus): string {
  const link = conspectus.subjectId && conspectus.topicId ? { subjectId: conspectus.subjectId, topicId: conspectus.topicId } : undefined;
  const title = conspectus.title.trim() || "კონსპექტი";
  if (tool === "presentation") {
    const subject = conspectusSubjectName(conspectus);
    handOffPresentation({
      topic: title,
      ...(subject ? { subject } : {}),
      ...(link ?? {}),
      extraInstructions: `ამ კონსპექტიდან:\n${markdownToPlainText(conspectus.content).slice(0, PRESENTATION_SOURCE_CHARS)}`,
    });
    return `/presentation?id=${encodeURIComponent(newPresentationId())}`;
  }
  handOff(tool, { title, text: conspectus.content, ...(link ? { link } : {}) });
  return tool === "quiz" ? "/quiz?tab=new" : "/generate?tab=new&mode=cards";
}

/** Where „უკან“ goes when the page was opened from outside: its subject, or „ჩემი მასალები“. */
export function conspectusBackHref(conspectus: Pick<Conspectus, "subjectId">): string {
  return conspectus.subjectId ? `/subjects/${encodeURIComponent(conspectus.subjectId)}` : "/generate?tab=library";
}
