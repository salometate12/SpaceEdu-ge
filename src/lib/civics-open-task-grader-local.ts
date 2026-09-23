/**
 * Offline fallback for the civics open-task grader. It cannot verify civics, so
 * from how much the student wrote it estimates how many criteria look attempted,
 * credits that many in order, derives the score, and says plainly this is an
 * estimate to be replaced when the AI grader is back.
 */

import {
  scoreFromCivicsCriteria,
  type CivicsOpenGraderReport,
} from "@/lib/ai/civics-open-task-grader-schema";
import type { CivicsOpenCriterion } from "@/data/civicsExamsData";

export function localGradeCivicsOpen(
  studentAnswer: string,
  input: { criteria: CivicsOpenCriterion[]; maxPoints: number },
): CivicsOpenGraderReport {
  const text = studentAnswer.trim();
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;

  const n = input.criteria.length;
  let attempted = 0;
  if (words >= 3) attempted = Math.min(n, 1);
  if (words >= 20) attempted = Math.min(n, Math.ceil(n / 2));
  if (words >= 60) attempted = n;

  const criteria = input.criteria.map((c, i) => ({ id: c.id, met: i < attempted, comment: undefined }));
  const metIds = new Set(criteria.filter((c) => c.met).map((c) => c.id));
  const score = scoreFromCivicsCriteria(metIds, input.criteria, input.maxPoints);

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
