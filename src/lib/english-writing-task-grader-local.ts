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
  ENGLISH_WRITING_MIN_GRADED_WORDS,
  englishEssayWordCount,
  zeroEnglishWritingReport,
  type EnglishWritingGraderResponse,
} from "@/lib/ai/english-writing-task-grader-schema";

export function localGradeEnglishWriting(
  essay: string,
  input: { minWords?: number } = {},
): EnglishWritingGraderResponse {
  const words = englishEssayWordCount(essay);
  const min = input.minWords ?? 120;

  // Under 100 words the essay is not graded at all (official rule).
  if (words < ENGLISH_WRITING_MIN_GRADED_WORDS) {
    return zeroEnglishWritingReport(
      `The essay has ${words} words, under the ${ENGLISH_WRITING_MIN_GRADED_WORDS}-word minimum, so it is not graded (0 points).`,
    );
  }

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
