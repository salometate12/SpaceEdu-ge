/**
 * Offline fallback for the essay grader.
 *
 * When the AI endpoint is unavailable the editor still has to give the
 * student something useful, so this scores the essay with transparent
 * heuristics over the same four-criterion rubric. It is intentionally
 * conservative: it measures things that can be measured from the text
 * (length, paragraphing, connective density, thesis and conclusion
 * markers, punctuation hygiene) and says so in the summary.
 */

import {
  ESSAY_CRITERION_MAX,
  type EssayCriterionId,
  type EssayGraderResponse,
} from "@/lib/ai/essay-grader-schema";

/** Discourse markers that signal real argumentation in Georgian. */
const ARGUMENT_MARKERS = [
  "იმიტომ",
  "ვინაიდან",
  "შესაბამისად",
  "მაგალითად",
  "აქედან გამომდინარე",
  "მეორე მხრივ",
  "თუმცა",
  "მიუხედავად",
  "ამრიგად",
  "პირველ რიგში",
];

const CONCLUSION_MARKERS = ["დასკვნა", "ამრიგად", "საბოლოოდ", "შეჯამებ", "დასასრულს"];
const THESIS_MARKERS = ["ვფიქრობ", "ჩემი აზრით", "მიმაჩნია", "დარწმუნებული ვარ", "მჯერა"];

function clamp(value: number, min = 0, max = ESSAY_CRITERION_MAX): number {
  return Math.max(min, Math.min(max, value));
}

function countMatches(haystack: string, needles: string[]): number {
  const lower = haystack.toLowerCase();
  return needles.reduce((count, needle) => (lower.includes(needle) ? count + 1 : count), 0);
}

export function localGradeEssay(essay: string, prompt?: string): EssayGraderResponse {
  const text = essay.trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const sentences = text.split(/[.!?…]+/).map((s) => s.trim()).filter(Boolean);
  const avgSentenceWords = sentences.length > 0 ? wordCount / sentences.length : 0;

  const argumentMarkers = countMatches(text, ARGUMENT_MARKERS);
  const hasThesis = countMatches(text, THESIS_MARKERS) > 0;
  const hasConclusion = countMatches(text, CONCLUSION_MARKERS) > 0;

  /* ------------------------------- content ------------------------------- */
  let content = 1;
  if (wordCount >= 120) content += 1;
  if (wordCount >= 250) content += 1;
  if (wordCount >= 400) content += 1;
  // Reward overlap with the prompt's own key words — a cheap proxy for
  // "actually answered the question".
  if (prompt) {
    const promptWords = prompt
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 5);
    const overlap = promptWords.filter((word) => text.toLowerCase().includes(word)).length;
    if (overlap >= 2) content += 1;
  } else if (wordCount >= 320) {
    content += 1;
  }
  content = clamp(content);

  /* ----------------------------- argumentation --------------------------- */
  let argumentation = 1;
  if (hasThesis) argumentation += 1;
  if (argumentMarkers >= 2) argumentation += 1;
  if (argumentMarkers >= 4) argumentation += 1;
  if (text.includes("მაგალითად") || text.includes("მაგალით")) argumentation += 1;
  argumentation = clamp(argumentation);

  /* ------------------------------- structure ----------------------------- */
  let structure = 1;
  if (paragraphs.length >= 2) structure += 1;
  if (paragraphs.length >= 3) structure += 1;
  if (hasConclusion) structure += 1;
  if (paragraphs.length >= 3 && hasThesis && hasConclusion) structure += 1;
  structure = clamp(structure);

  /* -------------------------------- grammar ------------------------------ */
  let grammar = 3;
  const doubleSpaces = (text.match(/ {2,}/g) ?? []).length;
  const spaceBeforePunct = (text.match(/\s+[,.!?]/g) ?? []).length;
  const missingSpaceAfterPunct = (text.match(/[,.!?][\p{L}]/gu) ?? []).length;
  const straightQuotes = (text.match(/"/g) ?? []).length;

  if (avgSentenceWords > 0 && avgSentenceWords <= 22) grammar += 1;
  if (doubleSpaces === 0 && spaceBeforePunct === 0 && missingSpaceAfterPunct === 0) grammar += 1;
  if (spaceBeforePunct > 2) grammar -= 1;
  if (avgSentenceWords > 32) grammar -= 1;
  grammar = clamp(grammar);

  const criteriaScores: Record<EssayCriterionId, number> = {
    content,
    argumentation,
    structure,
    grammar,
  };

  /* ------------------------------- comments ------------------------------ */
  const comments: Record<EssayCriterionId, string> = {
    content:
      wordCount < 120
        ? `ესე ძალიან მოკლეა (${wordCount} სიტყვა). საგამოცდო ესესთვის სასურველია მინიმუმ 250-300 სიტყვა, რომ თემა სრულად გაიხსნას.`
        : wordCount < 250
          ? `მოცულობა (${wordCount} სიტყვა) საკმარისი არაა სრული ქულისთვის — გააფართოვე ერთი მაინც არგუმენტი კონკრეტული მაგალითით.`
          : `მოცულობა (${wordCount} სიტყვა) საკმარისია. დარწმუნდი, რომ ყოველი აბზაცი პირდაპირ თემას ემსახურება და არა ზოგად მსჯელობას.`,
    argumentation: hasThesis
      ? argumentMarkers >= 3
        ? "თეზისი ჩამოყალიბებულია და დასაბუთების მარკერებიც გამოიყენე. შემდეგი ნაბიჯი — კონტრარგუმენტის მოხმობა და მისი გაბათილება."
        : "თეზისი ჩანს, მაგრამ დასაბუთება სუსტია. გამოიყენე მაკავშირებლები „ვინაიდან“, „შესაბამისად“, „მაგალითად“ და დაასაბუთე ყოველი მტკიცება."
      : "ტექსტში მკაფიო თეზისი არ იკითხება. შესავალშივე ერთი წინადადებით დააფიქსირე შენი პოზიცია („ჩემი აზრით…“, „მიმაჩნია, რომ…“).",
    structure:
      paragraphs.length < 2
        ? "ტექსტი ერთ ბლოკადაა. დაყავი მინიმუმ სამ აბზაცად: შესავალი, ძირითადი ნაწილი, დასკვნა."
        : hasConclusion
          ? `სტრუქტურა იკითხება (${paragraphs.length} აბზაცი) და დასკვნაც გამოკვეთილია.`
          : `აბზაცებად დაყოფა კარგია (${paragraphs.length}), მაგრამ დასკვნა არ იკვეთება — დაამატე შემაჯამებელი აბზაცი.`,
    grammar:
      spaceBeforePunct > 2 || missingSpaceAfterPunct > 2
        ? "პუნქტუაციაში ტექნიკური შეცდომებია — სასვენ ნიშანს წინ ჰარი არ უნდა უსწრებდეს, შემდეგ კი ჰარი აუცილებელია."
        : avgSentenceWords > 32
          ? `წინადადებები საშუალოდ ${Math.round(avgSentenceWords)} სიტყვიანია — ძალიან გრძელია. დაანაწილე მოკლე, მკაფიო წინადადებებად.`
          : "ტექნიკური მხარე მოწესრიგებულია. ყურადღება მიაქციე ლექსიკის სიზუსტესა და გამეორებების თავიდან აცილებას.",
  };

  /* ------------------------------ strengths ------------------------------ */
  const strengths: string[] = [];
  if (wordCount >= 250) strengths.push("მოცულობა საგამოცდო ნორმას აკმაყოფილებს.");
  if (paragraphs.length >= 3) strengths.push("ტექსტი ლოგიკურ აბზაცებადაა დაყოფილი.");
  if (hasThesis) strengths.push("ავტორისეული პოზიცია ნათლად ჩანს.");
  if (argumentMarkers >= 3) strengths.push("დასაბუთების მაკავშირებლები აქტიურად გამოიყენე.");
  if (hasConclusion) strengths.push("დასკვნა გამოკვეთილია.");
  if (strengths.length === 0) {
    strengths.push("ესე დაწერილია — ეს უკვე პირველი ნაბიჯია; ქვემოთ კონკრეტული გასაუმჯობესებელი წერტილებია.");
  }

  /* ----------------------------- corrections ----------------------------- */
  const corrections: EssayGraderResponse["corrections"] = [];
  if (paragraphs.length < 3) {
    corrections.push({
      issue: `ტექსტი ${paragraphs.length} აბზაცისგან შედგება.`,
      fix: "დაყავი სამ ნაწილად: შესავალი თეზისით, 2-3 არგუმენტი ცალკეულ აბზაცებად, შემაჯამებელი დასკვნა.",
    });
  }
  if (!hasThesis) {
    corrections.push({
      issue: "შესავალში პოზიცია ფორმულირებული არაა.",
      fix: "დაამატე ერთი წინადადება ტიპის: „ჩემი აზრით, … რადგან …“ — ეს მკითხველს მაშინვე აძლევს ორიენტირს.",
    });
  }
  if (argumentMarkers < 3) {
    corrections.push({
      issue: "მტკიცებები დასაბუთების გარეშეა დარჩენილი.",
      fix: "ყოველ მტკიცებას მიაყოლე „ვინაიდან…“ ან „მაგალითად…“ და მოიყვანე კონკრეტული ფაქტი, ციტატა ან ცხოვრებისეული შემთხვევა.",
    });
  }
  if (!hasConclusion) {
    corrections.push({
      issue: "დასკვნა არ იკითხება.",
      fix: "ბოლო აბზაცი დაიწყე შემაჯამებელი მარკერით („ამრიგად“, „საბოლოოდ“) და გაიმეორე თეზისი უკვე დასაბუთებული სახით.",
    });
  }
  if (spaceBeforePunct > 0 || missingSpaceAfterPunct > 0 || doubleSpaces > 0) {
    corrections.push({
      issue: "ტექსტში ტექნიკური აკრეფის შეცდომებია (ზედმეტი ჰარები, სასვენი ნიშნები).",
      fix: "სასვენი ნიშანი მიაწერე წინა სიტყვას უჰარეოდ და მის შემდეგ დატოვე ერთი ჰარი.",
    });
  }
  if (straightQuotes > 0) {
    corrections.push({
      issue: "ციტირებისთვის სწორი ბრჭყალები გამოიყენე.",
      fix: "ქართულში წყვილი „…“ გამოიყენება პირდაპირი ციტატისთვის.",
    });
  }
  if (avgSentenceWords > 32) {
    corrections.push({
      issue: `წინადადებები საშუალოდ ${Math.round(avgSentenceWords)} სიტყვიანია.`,
      fix: "გრძელი წინადადება დაშალე ორ-სამ მოკლედ — საგამოცდო ესეში სიცხადე უფრო ფასობს, ვიდრე რთული სინტაქსი.",
    });
  }

  const totalScore = content + argumentation + structure + grammar;

  return {
    totalScore,
    summary: `ლოკალური შეფასება (AI მიუწვდომელია): ${totalScore}/20. გათვლილია ტექსტის გაზომვადი მახასიათებლების მიხედვით — მოცულობა, აბზაცები, დასაბუთების მარკერები და ტექნიკური სისუფთავე. შინაარსობრივი სიღრმის სრული ანალიზისთვის სცადე ხელახლა, როცა კავშირი აღდგება.`,
    criteria: (Object.keys(criteriaScores) as EssayCriterionId[]).map((id) => ({
      id,
      score: criteriaScores[id],
      comment: comments[id],
    })),
    strengths: strengths.slice(0, 4),
    corrections: corrections.slice(0, 6),
  };
}
