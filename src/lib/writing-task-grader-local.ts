/**
 * Offline fallback for the 34-point writing-task grader.
 *
 * When the AI endpoint is unreachable the student still gets a scored report.
 * It cannot truly judge literary analysis or erudition, so it scores the
 * measurable things (length, paragraphing, connective density, thesis and
 * conclusion markers, punctuation) and stays deliberately conservative for the
 * criteria it cannot see — and says so in the summary.
 */

import {
  WRITING_TASK_CRITERION_IDS,
  writingTaskMaxes,
  type WritingTaskCriterionId,
  type WritingTaskGraderResponse,
} from "@/lib/ai/writing-task-grader-schema";

const ARGUMENT_MARKERS = [
  "იმიტომ",
  "ვინაიდან",
  "შესაბამისად",
  "მაგალითად",
  "აქედან გამომდინარე",
  "მეორე მხრივ",
  "თუმცა",
  "მიუხედავად",
  "ამრიგად",
  "პირველ რიგში",
];
const CONCLUSION_MARKERS = ["დასკვნა", "ამრიგად", "საბოლოოდ", "შეჯამებ", "დასასრულს"];
const THESIS_MARKERS = ["ვფიქრობ", "ჩემი აზრით", "მიმაჩნია", "დარწმუნებული ვარ", "მჯერა"];

function countMatches(haystack: string, needles: string[]): number {
  const lower = haystack.toLowerCase();
  return needles.reduce((n, needle) => (lower.includes(needle) ? n + 1 : n), 0);
}

export interface LocalWritingTaskOptions {
  year: number;
  hasBoundText?: boolean;
  prompt?: string;
}

export function localGradeWritingTask(
  essay: string,
  options: LocalWritingTaskOptions,
): WritingTaskGraderResponse {
  const { year, hasBoundText = true } = options;
  const maxes = writingTaskMaxes(year);
  const text = essay.trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).length;
  const args = countMatches(text, ARGUMENT_MARKERS);
  const hasThesis = countMatches(text, THESIS_MARKERS) > 0;
  const hasConclusion = countMatches(text, CONCLUSION_MARKERS) > 0;
  const hasPunctuation = /[.!?]/.test(text);

  // 0..1 quality signal for the criteria we can actually see.
  const lengthQ = Math.max(0, Math.min(1, words / 300));
  const structureQ = Math.max(0, Math.min(1, (paragraphs >= 3 ? 0.7 : paragraphs * 0.23) + (hasThesis ? 0.15 : 0) + (hasConclusion ? 0.15 : 0)));
  const argQ = Math.max(0, Math.min(1, args / 4));

  // Criteria the heuristic cannot really assess get a cautious mid score.
  const seen = (q: number, max: number) => Math.max(0, Math.min(max, Math.round(q * max)));
  const cautious = (max: number) => Math.max(0, Math.min(max, Math.round(max * 0.55)));

  const scoreFor = (id: WritingTaskCriterionId): number => {
    const max = maxes[id];
    switch (id) {
      case "II":
        return seen(structureQ, max);
      case "III":
        return hasBoundText ? cautious(max) : max; // no bound text → full, per rubric
      case "IV":
        return seen(argQ, max);
      case "VIII":
        return seen(0.4 + lengthQ * 0.5, max);
      case "IX":
        return seen(0.5 + lengthQ * 0.4, max);
      case "X":
        return hasPunctuation ? seen(0.6 + lengthQ * 0.3, max) : Math.round(max * 0.3);
      case "VII":
        return words < 40 ? Math.max(0, max - 1) : max;
      default:
        // I, V, VI — not measurable offline
        return cautious(max);
    }
  };

  const criteria = WRITING_TASK_CRITERION_IDS.map((id) => ({
    id,
    score: scoreFor(id),
    comment:
      id === "III" && !hasBoundText
        ? "თავისუფალი თემა — მიბმული ტექსტი არ არის, კრიტერიუმი სრულ ქულაზეა."
        : "ხაზგარეშე შეფასება — ზუსტი ქულა AI-სთან კავშირის აღდგენის შემდეგ დაზუსტდება.",
  }));

  const strengths: string[] = [];
  if (words >= 250) strengths.push("ნაშრომს საკმარისი მოცულობა აქვს.");
  if (paragraphs >= 3) strengths.push("ტექსტი აბზაცებადაა დანაწევრებული.");
  if (args >= 2) strengths.push("გამოყენებულია არგუმენტაციის მაანიშნებელი კავშირები.");

  return {
    totalScore: criteria.reduce((s, c) => s + c.score, 0),
    summary:
      "AI ამჟამად მიუწვდომელია — ეს არის ხაზგარეშე, სავარაუდო შეფასება გაზომვადი ნიშნებით (მოცულობა, სტრუქტურა, არგუმენტაცია, პუნქტუაცია). შინაარსობრივი კრიტერიუმები ზუსტდება AI-ს დაბრუნებისას.",
    criteria,
    strengths: strengths.slice(0, 4),
    corrections: [],
  };
}
