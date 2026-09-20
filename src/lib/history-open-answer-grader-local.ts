/**
 * Offline fallback for the history open-answer grader.
 *
 * It cannot verify history, so it is deliberately cautious: from how much the
 * student wrote it estimates how many of the scheme's criteria look attempted,
 * credits that many in order, derives the score, and says plainly that this is
 * an estimate to be replaced when the AI grader is back.
 */

import {
  scoreFromCriteria,
  type HistoryOpenGraderReport,
} from "@/lib/ai/history-open-answer-grader-schema";
import type { HistoryOpenCriterion } from "@/data/historyExamsData";

export function localGradeHistoryOpen(
  studentAnswer: string,
  input: { criteria: HistoryOpenCriterion[]; maxPoints: number },
): HistoryOpenGraderReport {
  const text = studentAnswer.trim();
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;

  // Rough "how much was attempted" → how many leading criteria to credit.
  let attempted = 0;
  if (words >= 4) attempted = 1;
  if (words >= 20) attempted = Math.min(input.criteria.length, 2);
  if (words >= 45) attempted = input.criteria.length;

  const criteria = input.criteria.map((c, i) => ({
    id: c.id,
    met: i < attempted,
    comment: undefined,
  }));
  const metIds = new Set(criteria.filter((c) => c.met).map((c) => c.id));
  const score = scoreFromCriteria(metIds, input.criteria, input.maxPoints);

  return {
    score,
    summary:
      "AI ამჟამად მიუწვდომელია — ხაზგარეშე, სავარაუდო შეფასება პასუხის მოცულობის მიხედვით. ზუსტი, კრიტერიუმებზე დაფუძნებული შემოწმება AI-ს დაბრუნებისას განახლდება.",
    criteria,
    whatWasMissing: undefined,
    correctAnswer: undefined,
    explanation: undefined,
  };
}
