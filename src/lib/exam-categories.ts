/**
 * Shared skill-category vocabulary for the abiturient space.
 *
 * Every answerable question across the past-exam archive and the reading
 * modules is tagged with one of these categories. The Weakness Radar
 * aggregates accuracy per category, so this file is the single source of
 * truth for labels, ordering and practice targets.
 */

export const EXAM_CATEGORY_IDS = [
  "metaphor",
  "personification",
  "allegory",
  "epithet",
  "simile",
  "hyperbole",
  "main_idea",
  "implied_meaning",
  "grammar",
] as const;

export type ExamCategory = (typeof EXAM_CATEGORY_IDS)[number];

/** The six literary devices the trope highlighter illuminates. */
export const TROPE_CATEGORY_IDS = [
  "metaphor",
  "personification",
  "allegory",
  "epithet",
  "simile",
  "hyperbole",
] as const satisfies readonly ExamCategory[];

export type TropeCategory = (typeof TROPE_CATEGORY_IDS)[number];

export function isTropeCategory(category: ExamCategory): category is TropeCategory {
  return (TROPE_CATEGORY_IDS as readonly string[]).includes(category);
}

interface CategoryMeta {
  label: string;
  /** Short hint shown on the radar / feedback cards. */
  hint: string;
  /** Tailwind classes for the category badge (dark surfaces). */
  badgeClass: string;
  /** Light-theme companion for `badgeClass`. */
  badgeClassLight: string;
  /** Hex used for the radar bar fill. */
  accent: string;
}

export const EXAM_CATEGORY_META: Record<ExamCategory, CategoryMeta> = {
  metaphor: {
    label: "მეტაფორა",
    hint: "სიტყვის გადატანითი მნიშვნელობით ხმარება",
    badgeClass: "border-cyan-500/25 bg-cyan-500/10 text-cyan-300",
    badgeClassLight: "border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-transparent dark:bg-transparent dark:text-inherit",
    accent: "#22d3ee",
  },
  personification: {
    label: "გაპიროვნება",
    hint: "უსულო საგნისთვის ცოცხალი არსების თვისების მინიჭება",
    badgeClass: "border-violet-500/25 bg-violet-500/10 text-violet-300",
    badgeClassLight: "border-violet-300 bg-violet-50 text-violet-700 dark:border-transparent dark:bg-transparent dark:text-inherit",
    accent: "#a78bfa",
  },
  allegory: {
    label: "ალეგორია",
    hint: "აბსტრაქტული აზრის კონკრეტული ხატით გადმოცემა",
    badgeClass: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    badgeClassLight: "border-amber-300 bg-amber-50 text-amber-700 dark:border-transparent dark:bg-transparent dark:text-inherit",
    accent: "#fbbf24",
  },
  epithet: {
    label: "ეპითეტი",
    hint: "მხატვრული განსაზღვრება, რომელიც საგანს ახასიათებს",
    badgeClass: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    badgeClassLight: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-transparent dark:bg-transparent dark:text-inherit",
    accent: "#34d399",
  },
  simile: {
    label: "შედარება",
    hint: "ორი საგნის შეპირისპირება „როგორც“, „-ვით“ სიტყვებით",
    badgeClass: "border-sky-500/25 bg-sky-500/10 text-sky-300",
    badgeClassLight: "border-sky-300 bg-sky-50 text-sky-700 dark:border-transparent dark:bg-transparent dark:text-inherit",
    accent: "#38bdf8",
  },
  hyperbole: {
    label: "ჰიპერბოლა",
    hint: "მოვლენის განზრახ გაზვიადება",
    badgeClass: "border-rose-500/25 bg-rose-500/10 text-rose-300",
    badgeClassLight: "border-rose-300 bg-rose-50 text-rose-700 dark:border-transparent dark:bg-transparent dark:text-inherit",
    accent: "#fb7185",
  },
  main_idea: {
    label: "მთავარი აზრი",
    hint: "ტექსტის ცენტრალური სათქმელის ამოცნობა",
    badgeClass: "border-indigo-500/25 bg-indigo-500/10 text-indigo-300",
    badgeClassLight: "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-transparent dark:bg-transparent dark:text-inherit",
    accent: "#818cf8",
  },
  implied_meaning: {
    label: "ნაგულისხმევი აზრი",
    hint: "ქვეტექსტისა და ავტორის დამოკიდებულების წაკითხვა",
    badgeClass: "border-orange-500/25 bg-orange-500/10 text-orange-300",
    badgeClassLight: "border-orange-300 bg-orange-50 text-orange-700 dark:border-transparent dark:bg-transparent dark:text-inherit",
    accent: "#fb923c",
  },
  grammar: {
    label: "გრამატიკა და სტილი",
    hint: "ნორმა, პუნქტუაცია და სტილისტური სისწორე",
    badgeClass: "border-slate-400/25 bg-slate-400/10 text-slate-300",
    badgeClassLight: "border-slate-300 bg-slate-100 text-slate-700 dark:border-transparent dark:bg-transparent dark:text-inherit",
    accent: "#94a3b8",
  },
};

export function examCategoryLabel(category: ExamCategory): string {
  return EXAM_CATEGORY_META[category].label;
}

/**
 * Maps a reading-module question onto a radar category.
 *
 * The reading data tags trope questions only as `literary_trope`, so the
 * specific device is read off the correct answer's own wording (the
 * options are the device names). Falls back to `metaphor` — the most
 * common device — only when nothing matches.
 */
export function categoryFromTropeAnswer(correctOptionText: string): ExamCategory {
  const text = correctOptionText.toLowerCase();
  const byLabel: Array<[TropeCategory, string[]]> = [
    ["metaphor", ["მეტაფორ"]],
    ["personification", ["გაპიროვნებ", "პერსონიფიკაცი"]],
    ["allegory", ["ალეგორი"]],
    ["epithet", ["ეპითეტ"]],
    ["simile", ["შედარებ"]],
    ["hyperbole", ["ჰიპერბოლ", "გაზვიადებ"]],
  ];
  for (const [category, needles] of byLabel) {
    if (needles.some((needle) => text.includes(needle))) return category;
  }
  return "metaphor";
}

/**
 * Where "გაავარჯიშე სუსტი წერტილი" sends the student for a category.
 * Trope work lives in the reading module; everything else routes to the
 * archive so the student practises on full exam variants.
 */
export function practiceHrefForCategory(category: ExamCategory): string {
  if (isTropeCategory(category)) {
    return "/subject/georgian/reading-comprehension";
  }
  if (category === "grammar") return "/subject/georgian/text-editing";
  return "/subject/georgian/past-exams";
}
