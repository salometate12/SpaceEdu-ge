export const AI_PAGE_TYPES = [
  "quiz",
  "research-platform-abit",
  "study-plan",
  "ai-teacher",
  "presentation",
  "eli5",
  "lecture-notes",
  "cv",
  "syllabus",
  "writing-task-grader",
  "text-editing-grader",
  "math-open-problem-grader",
  "history-open-answer-grader",
  "english-writing-task-grader",
] as const;

export type AiPageType = (typeof AI_PAGE_TYPES)[number];

export function isAiPageType(value: string): value is AiPageType {
  return (AI_PAGE_TYPES as readonly string[]).includes(value);
}
