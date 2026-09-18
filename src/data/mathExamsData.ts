/**
 * Georgian National Exam — Mathematics past papers (2025, variants I & II).
 *
 * Transcribed from docs/exam-sources/math/paper-variant-*.pdf and the matching
 * scoring schemes. Unlike the literature papers, a maths paper is a set of
 * independent questions — 37 single-answer MCQs (1 point each) and 4 open
 * problems (38–41, 3–4 points) whose solutions are graded step by step. Some
 * questions carry a formula (stored as KaTeX) or a figure cropped from the PDF.
 *
 * NOTE: this seed contains the fully-verified answer keys for all 37 MCQs of
 * both variants and a first batch of transcribed questions + the open problems.
 * The remaining MCQ prompts are being transcribed page by page from the PDFs;
 * `mcq` holds whatever has been transcribed so far, and the UI renders exactly
 * what is present.
 */

export type MathOptionLabel = "ა" | "ბ" | "გ" | "დ";

export interface MathFigure {
  src: string;
  alt: string;
}

export interface MathOption {
  label: MathOptionLabel;
  /** Plain text, when the option is words/a number. */
  text?: string;
  /** KaTeX, when the option is a formula. */
  latex?: string;
}

export interface MathMcqQuestion {
  id: string;
  number: number; // 1–37
  prompt: string; // question text (Georgian)
  latex?: string; // formula shown with the prompt, if any
  figure?: MathFigure;
  options: MathOption[];
  correctLabel: MathOptionLabel;
  points: 1;
}

export interface MathOpenStep {
  /** Step label as in the scheme's "ამოხსნის ეტაპები" (ა, ბ, გ, ...). */
  id: string;
  description: string;
}

export interface MathScoringRow {
  score: number;
  /** Which step ids must be completed to earn this score. */
  requiresSteps: string[];
}

export interface MathOpenProblem {
  id: string;
  number: number; // 38–41
  prompt: string;
  latex?: string;
  figure?: MathFigure;
  points: number; // 3 or 4
  modelSolution: string; // "ამოხსნა" — the full worked answer
  answer?: string; // "პასუხი"
  steps: MathOpenStep[]; // "ამოხსნის ეტაპები"
  scoringTable: MathScoringRow[]; // "შეფასების სქემა"
  partialCreditNote?: string; // the scheme's "შენიშვნა"
}

export interface MathExamVariant {
  id: string;
  label: string; // "I ვარიანტი" / "II ვარიანტი"
  year: number;
  mcq: MathMcqQuestion[];
  open: MathOpenProblem[];
  totalPoints: number; // 51
  durationMinutes: number; // 180
}

/** The official MCQ answer keys (1–37), verified from the scoring schemes. */
export const MATH_MCQ_ANSWER_KEYS: Record<string, MathOptionLabel[]> = {
  "variant-1-2025": [
    "დ", "ბ", "ბ", "დ", "დ", "დ", "ა", "ბ", "დ", "ბ", "ა", "ბ", "გ", "გ", "გ",
    "გ", "გ", "დ", "ა", "დ", "გ", "გ", "ბ", "ბ", "ბ", "დ", "დ", "ა", "ბ", "ა",
    "გ", "ა", "ბ", "ა", "ა", "ა", "გ",
  ],
  "variant-2-2025": [
    "გ", "გ", "ბ", "გ", "დ", "გ", "ა", "ა", "დ", "ა", "ა", "ა", "ბ", "ა", "გ",
    "დ", "ა", "გ", "ა", "ბ", "დ", "დ", "ა", "გ", "ბ", "დ", "დ", "ბ", "გ", "ბ",
    "ბ", "გ", "გ", "ბ", "დ", "ბ", "დ",
  ],
};

const VARIANT_1_MCQ: MathMcqQuestion[] = [
  {
    id: "m1-q1",
    number: 1,
    prompt: "გამოთვალეთ:",
    latex: "\\left(1\\tfrac{3}{5} - 2{,}2\\right)\\cdot 3\\tfrac{1}{3}",
    options: [
      { label: "ა", latex: "2" },
      { label: "ბ", latex: "\\tfrac{7}{3}" },
      { label: "გ", latex: "-\\tfrac{4}{15}" },
      { label: "დ", latex: "-2" },
    ],
    correctLabel: "დ",
    points: 1,
  },
  {
    id: "m1-q2",
    number: 2,
    prompt:
      "იპოვეთ უმცირესი სამნიშნა რიცხვი, რომელიც როგორც 4-ზე, ასევე 7-ზე გაყოფისას იძლევა 3-ის ტოლ ნაშთს.",
    options: [
      { label: "ა", text: "143" },
      { label: "ბ", text: "115" },
      { label: "გ", text: "107" },
      { label: "დ", text: "103" },
    ],
    correctLabel: "ბ",
    points: 1,
  },
];

const VARIANT_1_OPEN: MathOpenProblem[] = [
  {
    id: "m1-q38",
    number: 38,
    prompt:
      "საკოორდინატო სისტემაში $y=\\log_9 x$ და $y=kx+b$ ფუნქციების გრაფიკები იკვეთება ორ წერტილში, რომელთა ორდინატებია 1/2 და 3/2. რას უდრის k+b?",
    latex: "y=\\log_9 x,\\quad y=kx+b",
    points: 3,
    modelSolution:
      "ვთქვათ, გრაფიკები იკვეთება (x₁; 1/2) და (x₂; 3/2) წერტილებში. მაშინ 1/2 = log₉x₁ და 3/2 = log₉x₂, საიდანაც x₁ = 9^(1/2) = 3 და x₂ = 9^(3/2) = 27. რადგან ორივე წერტილი მდებარეობს y=kx+b-ის გრაფიკზე, მივიღებთ სისტემას: 3k+b = 1/2 და 27k+b = 3/2. ამ სისტემიდან 24k = 1, ე.ი. k = 1/24 და b = 3/8. მაშასადამე k+b = 5/12.",
    answer: "k + b = 5/12",
    steps: [
      { id: "ა", description: "გამოთვალა x₁ = 3 ან x₂ = 27." },
      {
        id: "ბ",
        description:
          "შeadgina სისტემა 3k+b = 1/2, 27k+b = 3/2, ან იპოვა k პარამეტრი.",
      },
      { id: "გ", description: "მიიღო სწორი პასუხი." },
    ],
    scoringTable: [
      { score: 1, requiresSteps: ["ა"] },
      { score: 2, requiresSteps: ["ბ"] },
      { score: 3, requiresSteps: ["ბ", "გ"] },
    ],
    partialCreditNote:
      "თუ გადაკვეთის წერტილების ორდინატები აბსცისებად ჩათვალა და ამ პირობით სრულად ამოხსნა, ნაშრომი ფასდება 1 ქულით.",
  },
];

export const MATH_EXAM_VARIANTS: MathExamVariant[] = [
  {
    id: "variant-1-2025",
    label: "I ვარიანტი",
    year: 2025,
    mcq: VARIANT_1_MCQ,
    open: VARIANT_1_OPEN,
    totalPoints: 51,
    durationMinutes: 180,
  },
  {
    id: "variant-2-2025",
    label: "II ვარიანტი",
    year: 2025,
    mcq: [],
    open: [],
    totalPoints: 51,
    durationMinutes: 180,
  },
];

export function getMathVariant(id: string): MathExamVariant | undefined {
  return MATH_EXAM_VARIANTS.find((v) => v.id === id);
}

export function getMathExamYears(): { year: number; variants: MathExamVariant[] }[] {
  const byYear = new Map<number, MathExamVariant[]>();
  for (const v of MATH_EXAM_VARIANTS) {
    const list = byYear.get(v.year) ?? [];
    list.push(v);
    byYear.set(v.year, list);
  }
  return [...byYear.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, variants]) => ({ year, variants }));
}
