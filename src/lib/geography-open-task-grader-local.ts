/**
 * Offline fallback for the geography open-task grader.
 *
 * It cannot verify geography, so it is deliberately cautious: from how much the
 * student wrote it estimates how many of the scheme's criteria look attempted,
 * credits that many in order, derives the score, and says plainly that this is
 * an estimate to be replaced when the AI grader is back.
 */

import {
  scoreFromGeographyCriteria,
  type GeographyOpenGraderReport,
} from "@/lib/ai/geography-open-task-grader-schema";
import type { GeographyOpenCriterion } from "@/data/geographyExamsData";

export function localGradeGeographyOpen(
  studentAnswer: string,
  input: { criteria: GeographyOpenCriterion[]; maxPoints: number },
): GeographyOpenGraderReport {
  const text = studentAnswer.trim();
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;

  let attempted = 0;
  if (words >= 2) attempted = 1;
  if (words >= 14) attempted = Math.min(input.criteria.length, 2);
  if (words >= 35) attempted = input.criteria.length;

  const criteria = input.criteria.map((c, i) => ({ id: c.id, met: i < attempted, comment: undefined }));
  const metIds = new Set(criteria.filter((c) => c.met).map((c) => c.id));
  const score = scoreFromGeographyCriteria(metIds, input.criteria, input.maxPoints);

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
