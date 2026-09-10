export interface TextEditingAttempt {
  id: string;
  dateLabel: string;
  preview: string;
  score: number;
  maxScore: number;
}

export interface TextEditingEvaluation {
  score: number;
  maxScore: number;
  points: string[];
}

export const TEXT_EDITING_MAX_SCORE = 16;

/**
 * No seeded history. The page used to open with two invented attempts
 * about table tennis, which read as someone else's work; a student's list
 * now starts empty and fills with their own.
 */
export const INITIAL_ATTEMPTS: TextEditingAttempt[] = [];

export function buildAttemptPreview(text: string, maxLen = 72): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen)}...`;
}

export function evaluateTextEditing(
  source: string,
  corrected: string,
  /** The paper's own maximum — Part I is not always out of 16. */
  maxScore: number = TEXT_EDITING_MAX_SCORE,
): TextEditingEvaluation {
  const sourceLen = source.replace(/\s/g, "").length;
  const correctedLen = corrected.replace(/\s/g, "").length;
  const lengthRatio =
    sourceLen > 0 ? Math.min(1, correctedLen / sourceLen) : 0;

  let score = 8;
  if (lengthRatio > 0.85) score += 4;
  else if (lengthRatio > 0.6) score += 2;
  if (corrected.includes("0") && !source.includes("0")) score -= 1;
  if (corrected.length > source.length * 0.5) score += 2;
  score = Math.min(maxScore, Math.max(0, Math.min(6, maxScore), score));

  const points: string[] = [];

  if (!corrected.trim()) {
    return {
      score: 0,
      maxScore,
      points: [
        "ტექსტი ცარიელია — გამოსწორებული ვერსია აუცილებელია შეფასებისთვის.",
        "გამოიყენე „რედაქტორში გადმოყვანა“ საწყისი ტექსტის სწრაფად ჩასაწერად.",
      ],
    };
  }

  if (source.includes("0") && corrected.includes("0")) {
    points.push(
      "ციფრი „0“ ზმნის ფორმასთან არ უნდა ერიოებოდეს — შეამოწმე ზმნის ზმნილებითი ფორმა.",
    );
  } else {
    points.push("ორთოგრაფიული ხარვეზები საერთო ჯამში კარგად არის გამოსწორებული.");
  }

  if (lengthRatio < 0.7) {
    points.push(
      "ტექსტი მოკლეა სავარაუდო სრულ ვერსიასთან შედარებით — დარწმუნდი, რომ ყველა აბზაცი გადმოიტანე.",
    );
  } else {
    points.push("ტექსტის მოცულობა შეესაბება სავარაუდო სრულ რედაქტირებას.");
  }

  points.push(
    "პუნქტუაცია: შეამოწმე მძიმეები აბზაცებს შორის და ზმნის ბოლოს.",
  );
  points.push(
    "სინტაქსი: თავიდან აიცილე გაურკვეველი ფრაზები და ზედმეტი მეონრეები.",
  );

  return { score, maxScore, points };
}

export function scoreBadgeClass(score: number, maxScore: number): string {
  const ratio = score / maxScore;
  if (ratio >= 0.94) return "text-emerald-400";
  if (ratio >= 0.75) return "text-purple-400";
  return "text-amber-400";
}
