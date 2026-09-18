/**
 * Offline fallback for the text-editing grader.
 *
 * The real grading counts the errors the student left in or introduced, which
 * needs a model. Offline we cannot count them, so we give a cautious estimate:
 * if the student actually rewrote the text (it differs from the source and has
 * comparable length) we award near-full marks minus a small margin per
 * criterion; a near-untouched or truncated answer is penalised. The summary
 * says it is an estimate.
 */

import {
  TEXT_EDITING_CRITERION_IDS,
  textEditingMaxes,
  type TextEditingGraderResponse,
} from "@/lib/ai/text-editing-grader-schema";

function similarity(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const wb = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (wa.size === 0 || wb.size === 0) return 0;
  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared += 1;
  return shared / Math.max(wa.size, wb.size);
}

export function localGradeTextEditing(
  source: string,
  corrected: string,
  year: number,
): TextEditingGraderResponse {
  const maxes = textEditingMaxes(year);
  const src = source.trim();
  const out = corrected.trim();
  const lenRatio = src.length > 0 ? out.length / src.length : 0;
  const changed = similarity(src, out) < 0.98; // did they edit anything at all?

  // A serious attempt (edited, reasonable length) loses ~1 point of margin per
  // criterion since we cannot verify every fix; a weak attempt loses more.
  const serious = changed && lenRatio >= 0.7;
  const factor = serious ? 0.85 : lenRatio < 0.4 ? 0.4 : 0.6;

  const criteria = TEXT_EDITING_CRITERION_IDS.map((id) => ({
    id,
    score: Math.max(0, Math.min(maxes[id], Math.round(maxes[id] * factor))),
    comment: "ხაზგარეშე შეფასება — შეცდომების ზუსტი დათვლა AI-ს დაბრუნების შემდეგ განახლდება.",
  }));

  return {
    totalScore: criteria.reduce((s, c) => s + c.score, 0),
    summary: serious
      ? "AI ამჟამად მიუწვდომელია — ხაზგარეშე, სავარაუდო შეფასება. ტექსტი გადამუშავებულია; ზუსტი ქულა AI-ს დაბრუნებისას დაზუსტდება."
      : "AI ამჟამად მიუწვდომელია — ხაზგარეშე შეფასება. გასწორებული ვერსია ორიგინალს ძალიან ჰგავს ან არასრულია.",
    criteria,
    corrections: [],
  };
}
