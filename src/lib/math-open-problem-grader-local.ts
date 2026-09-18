/**
 * Offline fallback for the maths open-problem grader.
 *
 * It cannot verify mathematics, so it is deliberately cautious: from the length
 * and content of the student's writing it guesses how many of the scheme's
 * steps look attempted, marks that many in order, derives the score through the
 * scoring table, and says clearly that this is an estimate.
 */

import {
  scoreFromSteps,
  type MathOpenGraderResponse,
} from "@/lib/ai/math-open-problem-grader-schema";
import type { MathOpenStep, MathScoringRow } from "@/data/mathExamsData";

export function localGradeMathOpen(
  studentSolution: string,
  input: { steps: MathOpenStep[]; scoringTable: MathScoringRow[]; maxPoints: number },
): MathOpenGraderResponse {
  const text = studentSolution.trim();
  const chars = text.length;
  const hasMath = /[=+\-*/^()]|\d/.test(text);

  // Rough "how much was attempted" tier → how many leading steps to credit.
  let attempted = 0;
  if (chars >= 30 && hasMath) attempted = 1;
  if (chars >= 120 && hasMath) attempted = Math.min(input.steps.length, 2);
  if (chars >= 260 && hasMath) attempted = input.steps.length;

  const steps = input.steps.map((step, i) => ({
    id: step.id,
    done: i < attempted,
    comment: undefined,
  }));
  const completed = new Set(steps.filter((s) => s.done).map((s) => s.id));
  const score = scoreFromSteps(completed, input.scoringTable, input.maxPoints);

  return {
    score,
    summary:
      "AI ამჟამად მიუწვდომელია — ხაზგარეშე, სავარაუდო შეფასება ამოხსნის მოცულობის მიხედვით. ზუსტი, ეტაპობრივი შემოწმება AI-ს დაბრუნებისას განახლდება.",
    steps,
    mistake: undefined,
    correctMove: undefined,
  };
}
