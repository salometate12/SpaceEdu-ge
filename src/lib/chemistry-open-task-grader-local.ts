/**
 * Offline fallback for the chemistry open-task grader. It cannot verify
 * chemistry, so from how much the student wrote it estimates how many criteria
 * look attempted, credits that many in order, derives the score, and says
 * plainly this is an estimate to be replaced when the AI grader is back.
 */

import {
  scoreFromChemistryCriteria,
  type ChemistryOpenGraderReport,
} from "@/lib/ai/chemistry-open-task-grader-schema";
import type { ChemistryOpenCriterion } from "@/data/chemistryExamsData";

export function localGradeChemistryOpen(
  studentAnswer: string,
  input: { criteria: ChemistryOpenCriterion[]; maxPoints: number },
): ChemistryOpenGraderReport {
  const text = studentAnswer.trim();
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;

  let attempted = 0;
  if (words >= 1) attempted = 1;
  if (words >= 8) attempted = Math.min(input.criteria.length, 2);
  if (words >= 25) attempted = input.criteria.length;

  const criteria = input.criteria.map((c, i) => ({ id: c.id, met: i < attempted, comment: undefined }));
  const metIds = new Set(criteria.filter((c) => c.met).map((c) => c.id));
  const score = scoreFromChemistryCriteria(metIds, input.criteria, input.maxPoints);

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
