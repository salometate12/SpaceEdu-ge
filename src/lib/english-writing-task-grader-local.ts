/**
 * Offline fallback for the English Task 7 essay grader.
 *
 * It can't judge English quality, so it is deliberately cautious: from the
 * length alone it awards a middling, capped score and says clearly that this is
 * an estimate to be replaced when the AI grader is back.
 */

import {
  ENGLISH_WRITING_CRITERION_IDS,
  ENGLISH_WRITING_CRITERION_MAX,
  type EnglishWritingGraderResponse,
} from "@/lib/ai/english-writing-task-grader-schema";

export function localGradeEnglishWriting(
  essay: string,
  input: { minWords?: number } = {},
): EnglishWritingGraderResponse {
  const words = essay.trim() ? essay.trim().split(/\s+/).filter(Boolean).length : 0;
  const min = input.minWords ?? 120;

  // Length tier → what fraction of each criterion's max to award.
  let frac = 0.3;
  if (words >= min * 0.5) frac = 0.5;
  if (words >= min) frac = 0.6;

  const criteria = ENGLISH_WRITING_CRITERION_IDS.map((id) => {
    const max = ENGLISH_WRITING_CRITERION_MAX[id];
    return {
      id,
      score: Math.max(0, Math.min(max, Math.round(max * frac))),
      comment:
        "AI grading is temporarily unavailable — this is a rough length-based estimate. A precise, criterion-based assessment will appear when the AI grader is back.",
    };
  });

  return {
    totalScore: criteria.reduce((sum, item) => sum + item.score, 0),
    summary:
      "AI grading is temporarily unavailable, so this is a rough estimate based only on length. Re-submit later for a full assessment.",
    criteria,
    strengths: [],
    corrections: [],
  };
}
