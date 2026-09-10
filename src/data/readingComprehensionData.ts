/**
 * Shape and helpers for the reading-comprehension exercise.
 *
 * The texts themselves live in the past-exam archive — see
 * `@/lib/georgian-past-paper-practice`, which converts a paper's Part II
 * into the `Passage` shape declared here. The invented practice library
 * that used to sit in this file is gone: the exercise runs on the real
 * papers now, so a second, made-up set of texts had no readers.
 *
 * A `Passage` carries multiple-choice questions in three exam-style
 * categories:
 *  - `main_idea`         → "რა არის ტექსტის მთავარი აზრი?"
 *  - `implied_meaning`   → "რა არის ნაჩვენები / ნაგულისხმევი ტექსტში?"
 *  - `literary_trope`    → "რომელი მხატვრული საშუალებაა გამოყენებული?"
 *
 * The `literary_trope` questions cover the six tropes the module requires:
 * მეტაფორა, გაპიროვნება, ეპითეტი, შედარება, ჰიპერბოლა, ალეგორია.
 *
 * Note on typography: inline quoted phrases in Georgian use the typographic
 * pair „…“ (U+201E … U+201C). Straight ASCII double quotes are reserved for
 * string delimiters only.
 */

export type QuestionType = "main_idea" | "implied_meaning" | "literary_trope";
export type PassageCategory = "მხატვრული" | "საინფორმაციო";

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  type: QuestionType;
  /**
   * Optional phrase from the passage that will be highlighted in the
   * reading panel while this question is active. Useful for trope
   * questions that reference a specific line.
   */
  highlightPhrase?: string;
}

export interface Passage {
  id: string;
  title: string;
  authorOrSource: string;
  category: PassageCategory;
  textExcerpt: string;
  questions: Question[];
}

const CATEGORY_LABEL: Record<PassageCategory, string> = {
  მხატვრული: "მხატვრული ტექსტი",
  საინფორმაციო: "საინფორმაციო ტექსტი",
};

export function passageCategoryLabel(category: PassageCategory): string {
  return CATEGORY_LABEL[category];
}

const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  main_idea: "მთავარი აზრი",
  implied_meaning: "ნაგულისხმევი აზრი",
  literary_trope: "მხატვრული საშუალება",
};

export function questionTypeLabel(type: QuestionType): string {
  return QUESTION_TYPE_LABEL[type];
}

/* -------------------------------------------------------------------------- */
/*                            RANDOMIZATION HELPERS                           */
/* -------------------------------------------------------------------------- */

/**
 * Fisher-Yates shuffle — returns a new array, does not mutate.
 */
function shuffle<T>(items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Build a randomised question queue for a given passage.
 *
 * We keep the *first* question deterministic when it exists as a
 * `main_idea` question so students always start with an anchoring
 * comprehension question, then randomise the remainder. If no
 * `main_idea` question exists we simply shuffle everything.
 */
export function buildRandomQuestionQueue(passage: Passage): Question[] {
  const mainIdea = passage.questions.find((q) => q.type === "main_idea");
  const rest = passage.questions.filter((q) => q.id !== mainIdea?.id);
  const shuffledRest = shuffle(rest);
  return mainIdea ? [mainIdea, ...shuffledRest] : shuffledRest;
}
