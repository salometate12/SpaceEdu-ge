import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit";
import { buildUserPrompt } from "@/lib/ai/build-user-prompt";
import { CvRequestSchema, CvResponseSchema, type CvResponse } from "@/lib/ai/cv-schema";
import {
  Eli5RequestSchema,
  Eli5ResponseSchema,
  type Eli5Response,
} from "@/lib/ai/eli5-schema";
import {
  WRITING_TASK_JSON_INSTRUCTIONS,
  WritingTaskGraderRequestSchema,
  WritingTaskGraderResponseSchema,
  normalizeWritingTaskReport,
  type WritingTaskGraderResponse,
} from "@/lib/ai/writing-task-grader-schema";
import {
  TEXT_EDITING_JSON_INSTRUCTIONS,
  TextEditingGraderRequestSchema,
  TextEditingGraderResponseSchema,
  normalizeTextEditingReport,
  type TextEditingGraderResponse,
} from "@/lib/ai/text-editing-grader-schema";
import {
  MATH_OPEN_JSON_INSTRUCTIONS,
  MathOpenGraderRequestSchema,
  MathOpenGraderResponseSchema,
  normalizeMathOpenReport,
  type MathOpenGraderResponse,
} from "@/lib/ai/math-open-problem-grader-schema";
import {
  HISTORY_OPEN_JSON_INSTRUCTIONS,
  HistoryOpenGraderRequestSchema,
  HistoryOpenGraderResponseSchema,
  normalizeHistoryOpenReport,
  type HistoryOpenGraderResponse,
} from "@/lib/ai/history-open-answer-grader-schema";
import {
  GEOGRAPHY_OPEN_JSON_INSTRUCTIONS,
  GeographyOpenGraderRequestSchema,
  GeographyOpenGraderResponseSchema,
  normalizeGeographyOpenReport,
  type GeographyOpenGraderResponse,
} from "@/lib/ai/geography-open-task-grader-schema";
import {
  ENGLISH_WRITING_JSON_INSTRUCTIONS,
  EnglishWritingGraderRequestSchema,
  EnglishWritingGraderResponseSchema,
  ENGLISH_WRITING_MIN_GRADED_WORDS,
  englishEssayWordCount,
  normalizeEnglishWritingReport,
  zeroEnglishWritingReport,
  type EnglishWritingGraderResponse,
} from "@/lib/ai/english-writing-task-grader-schema";
import { localGradeWritingTask } from "@/lib/writing-task-grader-local";
import { localGradeTextEditing } from "@/lib/text-editing-grader-local";
import { localGradeMathOpen } from "@/lib/math-open-problem-grader-local";
import { localGradeHistoryOpen } from "@/lib/history-open-answer-grader-local";
import { localGradeGeographyOpen } from "@/lib/geography-open-task-grader-local";
import {
  CIVICS_OPEN_JSON_INSTRUCTIONS,
  CivicsOpenGraderRequestSchema,
  CivicsOpenGraderResponseSchema,
  normalizeCivicsOpenReport,
  type CivicsOpenGraderResponse,
} from "@/lib/ai/civics-open-task-grader-schema";
import { localGradeCivicsOpen } from "@/lib/civics-open-task-grader-local";
import {
  CHEMISTRY_OPEN_JSON_INSTRUCTIONS,
  ChemistryOpenGraderRequestSchema,
  ChemistryOpenGraderResponseSchema,
  normalizeChemistryOpenReport,
  type ChemistryOpenGraderResponse,
} from "@/lib/ai/chemistry-open-task-grader-schema";
import { localGradeChemistryOpen } from "@/lib/chemistry-open-task-grader-local";
import { localGradeEnglishWriting } from "@/lib/english-writing-task-grader-local";
import {
  LectureNotesKeywordsSchema,
  LectureNotesRequestSchema,
  type LectureNotesKeywords,
} from "@/lib/ai/lecture-notes-schema";
import {
  PresentationRequestSchema,
  PresentationResponseSchema,
  normalizePresentationSlides,
  type PresentationResponse,
} from "@/lib/ai/presentation-schema";
import {
  extractTextFromPdfFile,
  PDF_TEXT_EMPTY_ERROR,
  PdfExtractError,
} from "@/lib/ai/extract-pdf-text";
import {
  extractTextFromImageFile,
  ImageExtractError,
} from "@/lib/ai/extract-image-text";
import {
  extractTextFromAudioFile,
  AudioExtractError,
} from "@/lib/ai/extract-audio-text";
import { isAiPageType } from "@/lib/ai/page-types";
import { getSystemPromptForPageType } from "@/lib/ai/page-prompts";
import {
  StudyPlanRequestSchema,
  StudyPlanResponseSchema,
  type StudyPlanResponse,
} from "@/lib/ai/study-plan-schema";
import {
  ResearchRequestSchema,
  ResearchResponseSchema,
  ResearchTogglesSchema,
  type ResearchResponse,
} from "@/lib/ai/research-platform-schema";
import {
  SyllabusAiResponseSchema,
  SyllabusOptionsSchema,
  SyllabusRequestSchema,
  normalizeSyllabusMilestones,
  type SyllabusAiResponse,
  type SyllabusResponse,
} from "@/lib/ai/syllabus-schema";
import { requireApiKey } from "@/lib/ai/parse-form-data";
import {
  errorJsonResponse,
  generateGeminiObject,
  llmTextStreamResponse,
} from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const RequestSchema = z.object({
  pageType: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).default({}),
  responseMode: z.enum(["stream", "json"]).default("stream"),
});

const STUDY_PLAN_JSON_INSTRUCTIONS = `
Return ONLY valid JSON matching this contract (all text in Georgian):
{
  "plan": [
    {
      "date": "YYYY-MM-DD",
      "day_name": "ორშაბათი",
      "topics": ["თემა"],
      "hours": 2,
      "tasks": ["დავალება"],
      "focus_level": "high"
    }
  ],
  "total_days": number,
  "advice": "მოკლე რჩევა"
}
`;

const CV_JSON_INSTRUCTIONS = `
Return ONLY valid JSON (all text in Georgian):
{
  "professionalSummary": "2-4 წინადადება პროფესიული შეჯამება",
  "headline": "მოკლე პოზიციის/პროფილის სათაური",
  "experienceBullets": ["ბულეტი 1", "ბულეტი 2"],
  "highlightedSkills": ["უნარი 1", "უნარი 2"],
  "optimizationTips": ["რჩევა 1"]
}
Do not invent employers or degrees not implied by the profile.`;

const SYLLABUS_JSON_INSTRUCTIONS = `
Return ONLY valid JSON (all human-readable text in Georgian):
{
  "insight": "2-3 წინადადება სილაბუსის სტრუქტურისა და შეფასების შეჯამება",
  "expectedCounts": { "quiz": 4, "midterm": 1, "final": 1 },
  "warnings": ["გაფრთხილება, თუ რამე ბუნდოვანია"],
  "milestones": [
    {
      "title": "ქვიზი 1",
      "type": "quiz" | "midterm" | "final" | "deadline",
      "number": 1,
      "rawDateText": "the exact date/week fragment copied from the text, e.g. \"28.09\" or \"მე-6 კვირა, ხუთშაბათი\" — or null",
      "week": "week number exactly as written, e.g. \"6\" or \"VIII\" — or null",
      "weekday": "weekday exactly as written, e.g. \"ხუთშაბათი\" — or null",
      "date": "YYYY-MM-DD only if the text states an explicit calendar date, otherwise null",
      "topic": "the topic/chapter covered, if stated — or null",
      "points": 5,
      "weight": 10,
      "sourceText": "the table row or sentence this was read from, copied verbatim"
    }
  ]
}

Classification:
- "quiz": ქვიზი / ქვიზ- / კვიზი, Quiz, Q1/Q2…, მოკლე ტესტი, ტესტი, საკონტროლო (წერა/სამუშაო).
- "midterm": შუალედური (გამოცდა/შეფასება), Midterm.
- "final": ფინალური / დასკვნითი (გამოცდა), Final exam.
- "deadline": დავალების / პროექტის / ნაშრომის / პრეზენტაციის ჩაბარება, Deadline, Due.

Rules:
- Read the ENTIRE text, every page to the end. Cross-reference the grading section with the schedule.
- If the grading section says e.g. "ქვიზი 4 × 5 ქულა", there are 4 quizzes: find all 4 and give each its own week/date from the schedule. Put these totals in "expectedCounts" (null when not stated).
- In a table, a date belongs to the SAME row (line) as the event. Never take a date or week from a neighbouring row.
- Numeric dates in Georgian syllabi are day-first: "05.11" is 5 November. Copy them verbatim into "rawDateText"; do not convert.
- Never invent a date. If the text gives no date and no week for an event, set rawDateText, week, weekday and date to null.
- List each event once: the same quiz mentioned in the grading section and in the schedule is ONE milestone.
- "points" is the points it is worth, "weight" its percentage of the final grade; null when not stated.
- Add a Georgian warning for anything ambiguous (e.g. two different dates for the same quiz).`;

const PRESENTATION_JSON_INSTRUCTIONS = `
Return ONLY valid JSON (all text in Georgian):
{
  "title": "პრეზენტაციის სათაური",
  "slides": [
    {
      "id": 1,
      "type": "cover" | "content" | "image" | "stats" | "conclusion",
      "slideType": "მოკლე ტიპის აღწერა",
      "title": "სლაიდის სათაური",
      "body": "ოპციონალური პარაგრაფი",
      "points": ["ბულეტი 1", "ბულეტი 2"],
      "photoIds": ["photo id from the list"] or null
    }
  ]
}
First slide should be type "cover", last slide "conclusion". Match requested slide count closely.
Every key is required; use null for an empty body, points or photoIds.`;

const ELI5_JSON_INSTRUCTIONS = `
Return ONLY valid JSON (all text in Georgian):
{
  "title": "მოკლე სათაური",
  "explanation": "მთავარი ახსნა მარტივი ენით",
  "analogy": "მეტაფორა ან რეალური მაგალითი",
  "rememberThis": "ერთი წინადადება, რაც უნდა დაიმახსოვროს",
  "followUpQuestion": "ოპციონალური შემოწმების კითხვა"
}
Adapt vocabulary strictly to the requested simplicity level.`;

const LECTURE_NOTES_KEYWORDS_INSTRUCTIONS = `
Return ONLY valid JSON:
{
  "keywords": ["TCP/IP", "DNS Lookup"]
}
3-8 short topic tags from the lecture notes. Prefer original technical terms or Georgian topic names. No # prefix. No explanations.`;

const RESEARCH_JSON_INSTRUCTIONS = `
Return ONLY valid JSON (all text in Georgian):
{
  "summary": "სტრუქტურირებული რეზიუმე",
  "sources": [{ "citation": "წყარო", "relevance": "რატომ მნიშვნელოვანია" }],
  "quotes": [{ "quote": "ციტატა", "context": "კონტექსტი", "location": "გვერდი/თავი" }],
  "theses": ["თეზისი 1"],
  "methodology": "მეთოდოლოგიის ანალიზი",
  "literatureReview": "ლიტერატურის მიმოხილვა",
  "criticalAnalysis": "ძლიერი და სუსტი მხარეების კრიტიკული შეფასება",
  "conclusions": "დასკვნები და პრაქტიკული რეკომენდაციები"
}
Include theses/methodology/literatureReview/criticalAnalysis/conclusions ONLY when requested in analysis focus.
Base all content strictly on the document text between markers.`;

const MULTIPART_PAGE_TYPES = ["syllabus", "research-platform-abit"] as const;

async function generateResearchFromText(
  fileName: string,
  textBody: string,
  toggles: z.infer<typeof ResearchTogglesSchema> | undefined,
): Promise<ResearchResponse> {
  const system = getSystemPromptForPageType("research-platform-abit");
  const payload = ResearchRequestSchema.parse({ fileName, textBody, toggles });
  const prompt = buildUserPrompt("research-platform-abit", payload);

  return (await generateGeminiObject({
    schema: ResearchResponseSchema,
    system: `${system}\n${RESEARCH_JSON_INSTRUCTIONS}`,
    prompt,
    temperature: 0.3,
  })) as ResearchResponse;
}

async function generateSyllabusFromText(
  fileName: string,
  textBody: string,
  options: z.infer<typeof SyllabusOptionsSchema> | undefined,
  semesterStartDate: string | undefined,
): Promise<SyllabusResponse> {
  const system = getSystemPromptForPageType("syllabus");
  const payload = SyllabusRequestSchema.parse({
    fileName,
    textBody,
    options,
    semesterStartDate,
  });
  const prompt = buildUserPrompt("syllabus", payload);

  const raw = (await generateGeminiObject({
    schema: SyllabusAiResponseSchema,
    system: `${system}\n${SYLLABUS_JSON_INSTRUCTIONS}`,
    prompt,
    // Extraction, not writing — the same syllabus should read the same way.
    temperature: 0,
    // A long syllabus has dozens of events, each with its source row; the
    // provider default can cut the JSON off mid-array and drop the last ones.
    maxOutputTokens: 32_768,
    // normalizeSyllabusMilestones works on nulls, not missing keys.
    keepNulls: true,
  })) as SyllabusAiResponse;

  const normalized = normalizeSyllabusMilestones(raw, {
    semesterStartDate: payload.semesterStartDate,
    sourceText: payload.textBody,
    fileName,
  });

  if (normalized.dateMismatches.length > 0) {
    console.warn("[syllabus] model date differs from computed date", normalized.dateMismatches);
  }
  const foundQuizzes = normalized.milestones.filter((item) => item.type === "quiz").length;
  if (normalized.quizMentionsInText > foundQuizzes) {
    console.warn("[syllabus] fewer quizzes returned than the text mentions", {
      fileName,
      mentionedInText: normalized.quizMentionsInText,
      expectedByModel: raw.expectedCounts.quiz,
      found: foundQuizzes,
    });
  }

  return {
    insight: raw.insight,
    milestones: normalized.milestones,
    expectedCounts: raw.expectedCounts,
    warnings: normalized.warnings,
  };
}

/** A clear message for a bad syllabus request — not "the file is empty"
 * for, say, a malformed semester start date. */
function syllabusValidationMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  const field = issue?.path[0];
  if (field === "textBody") return PDF_TEXT_EMPTY_ERROR;
  if (field === "semesterStartDate") return "სემესტრის დაწყების თარიღი არასწორია.";
  if (field === "options") return "ანალიზის პარამეტრები არასწორია.";
  return issue?.message || "შეყვანილი მონაცემები არასწორია.";
}

async function handleMultipartPost(request: Request) {
  const formData = await request.formData();
  const pageType = String(formData.get("pageType") ?? "");

  if (
    !MULTIPART_PAGE_TYPES.includes(
      pageType as (typeof MULTIPART_PAGE_TYPES)[number],
    ) ||
    !isAiPageType(pageType)
  ) {
    return Response.json(
      {
        error: true,
        message: "multipart მხარდაჭერა: syllabus ან research-platform-abit.",
      },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json(
      { error: true, message: "ფაილი არ არის მიმაგრებული." },
      { status: 400 },
    );
  }

  const lowerType = file.type.toLowerCase();
  const isResearchUpload = pageType === "research-platform-abit";
  const isImageFile = isResearchUpload && lowerType.startsWith("image/");
  const isAudioFile = isResearchUpload && lowerType.startsWith("audio/");

  const textBody = isImageFile
    ? await extractTextFromImageFile(file)
    : isAudioFile
      ? await extractTextFromAudioFile(file)
      : await extractTextFromPdfFile(file);

  if (pageType === "syllabus") {
    let options: z.infer<typeof SyllabusOptionsSchema> | undefined;
    const optionsRaw = formData.get("options");
    if (typeof optionsRaw === "string" && optionsRaw.trim()) {
      options = SyllabusOptionsSchema.parse(JSON.parse(optionsRaw));
    }
    const semesterStartDateRaw = formData.get("semesterStartDate");
    const semesterStartDate =
      typeof semesterStartDateRaw === "string" && semesterStartDateRaw.trim()
        ? semesterStartDateRaw.trim()
        : undefined;
    try {
      const result = await generateSyllabusFromText(file.name, textBody, options, semesterStartDate);
      return Response.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Response.json(
          { error: true, message: syllabusValidationMessage(error) },
          { status: 400 },
        );
      }
      throw error;
    }
  }

  let toggles: z.infer<typeof ResearchTogglesSchema> | undefined;
  const togglesRaw = formData.get("toggles");
  if (typeof togglesRaw === "string" && togglesRaw.trim()) {
    toggles = ResearchTogglesSchema.parse(JSON.parse(togglesRaw));
  }

  const result = await generateResearchFromText(file.name, textBody, toggles);
  return Response.json(result);
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "ai");
  if (limited) return limited;

  try {
    requireApiKey("ai");

    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      try {
        return await handleMultipartPost(request);
      } catch (error) {
        if (
          error instanceof PdfExtractError ||
          error instanceof ImageExtractError ||
          error instanceof AudioExtractError
        ) {
          return Response.json(
            { error: true, message: error.message },
            { status: 400 },
          );
        }
        throw error;
      }
    }

    const body = RequestSchema.parse(await request.json());

    if (!isAiPageType(body.pageType)) {
      return Response.json(
        { error: true, message: `Unknown pageType: ${body.pageType}` },
        { status: 400 },
      );
    }

    const pageType = body.pageType;
    const system = getSystemPromptForPageType(pageType, body.payload);

    if (pageType === "study-plan") {
      try {
        const studyPayload = StudyPlanRequestSchema.parse(body.payload);
        const prompt = buildUserPrompt(pageType, studyPayload);

        const object = (await generateGeminiObject({
          schema: StudyPlanResponseSchema,
          system: `${system}\n${STUDY_PLAN_JSON_INSTRUCTIONS}`,
          prompt,
          temperature: 0.3,
        })) as StudyPlanResponse;

        return Response.json(object);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const message = error.issues[0]?.message ?? "შეყვანილი მონაცემები არასწორია.";
          return Response.json({ error: true, message }, { status: 400 });
        }
        throw error;
      }
    }

    if (pageType === "cv") {
      const cvPayload = CvRequestSchema.parse(body.payload);
      const prompt = buildUserPrompt(pageType, cvPayload);

      const object = (await generateGeminiObject({
        schema: CvResponseSchema,
        system: `${system}\n${CV_JSON_INSTRUCTIONS}`,
        prompt,
        temperature: 0.35,
      })) as CvResponse;

      return Response.json(object);
    }

    if (pageType === "syllabus") {
      try {
        const result = await generateSyllabusFromText(
          String(body.payload.fileName ?? "syllabus.pdf"),
          String(body.payload.textBody ?? ""),
          body.payload.options
            ? SyllabusOptionsSchema.parse(body.payload.options)
            : undefined,
          body.payload.semesterStartDate
            ? String(body.payload.semesterStartDate)
            : undefined,
        );
        return Response.json(result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return Response.json(
            { error: true, message: syllabusValidationMessage(error) },
            { status: 400 },
          );
        }
        throw error;
      }
    }

    if (pageType === "presentation") {
      const presentationPayload = PresentationRequestSchema.parse(body.payload);
      const prompt = buildUserPrompt(pageType, presentationPayload);

      const raw = (await generateGeminiObject({
        schema: PresentationResponseSchema,
        system: `${system}\n${PRESENTATION_JSON_INSTRUCTIONS}`,
        prompt,
        temperature: 0.4,
      })) as PresentationResponse;

      return Response.json({
        ...raw,
        slides: normalizePresentationSlides(
          raw.slides,
          (presentationPayload.photos ?? []).map((photo) => photo.id),
        ),
      });
    }

    if (pageType === "eli5") {
      const eli5Payload = Eli5RequestSchema.parse(body.payload);
      const prompt = buildUserPrompt(pageType, eli5Payload);

      const object = (await generateGeminiObject({
        schema: Eli5ResponseSchema,
        system: `${system}\n${ELI5_JSON_INSTRUCTIONS}`,
        prompt,
        temperature: 0.45,
      })) as Eli5Response;

      return Response.json(object);
    }

    if (pageType === "writing-task-grader") {
      const wtPayload = WritingTaskGraderRequestSchema.parse(body.payload);
      const prompt = buildUserPrompt(pageType, wtPayload);
      const year = wtPayload.year ?? 2025;
      const hasBoundText =
        typeof wtPayload.hasBoundText === "boolean"
          ? wtPayload.hasBoundText
          : Boolean(wtPayload.passageText);

      try {
        const object = (await generateGeminiObject({
          schema: WritingTaskGraderResponseSchema,
          system: `${system}\n${WRITING_TASK_JSON_INSTRUCTIONS}`,
          prompt,
          temperature: 0.25,
        })) as WritingTaskGraderResponse;
        return Response.json(normalizeWritingTaskReport(object, { year, hasBoundText }));
      } catch {
        // The 34-point rubric still answers offline.
        return Response.json(
          localGradeWritingTask(wtPayload.essay, { year, hasBoundText, prompt: wtPayload.prompt }),
        );
      }
    }

    if (pageType === "math-open-problem-grader") {
      const moPayload = MathOpenGraderRequestSchema.parse(body.payload);
      const prompt = buildUserPrompt(pageType, moPayload);
      const gradeInput = {
        steps: moPayload.steps,
        scoringTable: moPayload.scoringTable,
        maxPoints: moPayload.maxPoints,
      };

      try {
        const object = (await generateGeminiObject({
          schema: MathOpenGraderResponseSchema,
          system: `${system}\n${MATH_OPEN_JSON_INSTRUCTIONS}`,
          prompt,
          temperature: 0.2,
        })) as MathOpenGraderResponse;
        return Response.json(normalizeMathOpenReport(object, gradeInput));
      } catch {
        return Response.json(localGradeMathOpen(moPayload.studentSolution, gradeInput));
      }
    }

    if (pageType === "history-open-answer-grader") {
      const hoPayload = HistoryOpenGraderRequestSchema.parse(body.payload);
      const prompt = buildUserPrompt(pageType, hoPayload);
      const gradeInput = { criteria: hoPayload.criteria, maxPoints: hoPayload.maxPoints };

      try {
        const object = (await generateGeminiObject({
          schema: HistoryOpenGraderResponseSchema,
          system: `${system}\n${HISTORY_OPEN_JSON_INSTRUCTIONS}`,
          prompt,
          temperature: 0.2,
        })) as HistoryOpenGraderResponse;
        return Response.json(normalizeHistoryOpenReport(object, gradeInput));
      } catch {
        return Response.json(localGradeHistoryOpen(hoPayload.studentAnswer, gradeInput));
      }
    }

    if (pageType === "geography-open-task-grader") {
      const goPayload = GeographyOpenGraderRequestSchema.parse(body.payload);
      const prompt = buildUserPrompt(pageType, goPayload);
      const gradeInput = { criteria: goPayload.criteria, maxPoints: goPayload.maxPoints };

      try {
        const object = (await generateGeminiObject({
          schema: GeographyOpenGraderResponseSchema,
          system: `${system}\n${GEOGRAPHY_OPEN_JSON_INSTRUCTIONS}`,
          prompt,
          temperature: 0.2,
        })) as GeographyOpenGraderResponse;
        return Response.json(normalizeGeographyOpenReport(object, gradeInput));
      } catch {
        return Response.json(localGradeGeographyOpen(goPayload.studentAnswer, gradeInput));
      }
    }

    if (pageType === "civics-open-task-grader") {
      const cvPayload = CivicsOpenGraderRequestSchema.parse(body.payload);
      const prompt = buildUserPrompt(pageType, cvPayload);
      const gradeInput = { criteria: cvPayload.criteria, maxPoints: cvPayload.maxPoints };

      try {
        const object = (await generateGeminiObject({
          schema: CivicsOpenGraderResponseSchema,
          system: `${system}\n${CIVICS_OPEN_JSON_INSTRUCTIONS}`,
          prompt,
          temperature: 0.2,
        })) as CivicsOpenGraderResponse;
        return Response.json(normalizeCivicsOpenReport(object, gradeInput));
      } catch {
        return Response.json(localGradeCivicsOpen(cvPayload.studentAnswer, gradeInput));
      }
    }

    if (pageType === "chemistry-open-task-grader") {
      const coPayload = ChemistryOpenGraderRequestSchema.parse(body.payload);
      const prompt = buildUserPrompt(pageType, coPayload);
      const gradeInput = { criteria: coPayload.criteria, maxPoints: coPayload.maxPoints };

      try {
        const object = (await generateGeminiObject({
          schema: ChemistryOpenGraderResponseSchema,
          system: `${system}\n${CHEMISTRY_OPEN_JSON_INSTRUCTIONS}`,
          prompt,
          temperature: 0.2,
        })) as ChemistryOpenGraderResponse;
        return Response.json(normalizeChemistryOpenReport(object, gradeInput));
      } catch {
        return Response.json(localGradeChemistryOpen(coPayload.studentAnswer, gradeInput));
      }
    }

    if (pageType === "english-writing-task-grader") {
      const ewPayload = EnglishWritingGraderRequestSchema.parse(body.payload);

      // Official rule: an essay under 100 words is not graded at all (0). Gate
      // this deterministically rather than trusting the model to award zero.
      const ewWords = englishEssayWordCount(ewPayload.essay);
      if (ewWords < ENGLISH_WRITING_MIN_GRADED_WORDS) {
        return Response.json(
          normalizeEnglishWritingReport(
            zeroEnglishWritingReport(
              `The essay has ${ewWords} words, under the ${ENGLISH_WRITING_MIN_GRADED_WORDS}-word minimum, so it is not graded (0 points).`,
            ),
          ),
        );
      }

      const prompt = buildUserPrompt(pageType, ewPayload);

      try {
        const object = (await generateGeminiObject({
          schema: EnglishWritingGraderResponseSchema,
          system: `${system}\n${ENGLISH_WRITING_JSON_INSTRUCTIONS}`,
          prompt,
          temperature: 0.2,
        })) as EnglishWritingGraderResponse;
        return Response.json(normalizeEnglishWritingReport(object));
      } catch {
        return Response.json(
          localGradeEnglishWriting(ewPayload.essay, { minWords: ewPayload.minWords }),
        );
      }
    }

    if (pageType === "text-editing-grader") {
      const tePayload = TextEditingGraderRequestSchema.parse(body.payload);
      const prompt = buildUserPrompt(pageType, tePayload);
      const year = tePayload.year ?? 2025;

      try {
        const object = (await generateGeminiObject({
          schema: TextEditingGraderResponseSchema,
          system: `${system}\n${TEXT_EDITING_JSON_INSTRUCTIONS}`,
          prompt,
          temperature: 0.2,
        })) as TextEditingGraderResponse;
        return Response.json(normalizeTextEditingReport(object, year));
      } catch {
        return Response.json(localGradeTextEditing(tePayload.source, tePayload.corrected, year));
      }
    }

    if (pageType === "lecture-notes") {
      const notesPayload = LectureNotesRequestSchema.parse(body.payload);
      if (notesPayload.mode === "keywords") {
        const prompt = buildUserPrompt(pageType, notesPayload);
        const object = (await generateGeminiObject({
          schema: LectureNotesKeywordsSchema,
          system: `${system}\n${LECTURE_NOTES_KEYWORDS_INSTRUCTIONS}`,
          prompt,
          temperature: 0.2,
        })) as LectureNotesKeywords;
        return Response.json(object);
      }
    }

    if (pageType === "research-platform-abit") {
      try {
        const toggles = body.payload.toggles
          ? ResearchTogglesSchema.parse(body.payload.toggles)
          : undefined;
        const result = await generateResearchFromText(
          String(body.payload.fileName ?? "document.txt"),
          String(body.payload.textBody ?? ""),
          toggles,
        );
        return Response.json(result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return Response.json(
            { error: true, message: PDF_TEXT_EMPTY_ERROR },
            { status: 400 },
          );
        }
        throw error;
      }
    }

    const prompt = buildUserPrompt(pageType, body.payload);

    return llmTextStreamResponse({
      system,
      prompt,
      temperature: pageType === "ai-teacher" ? 0.35 : 0.3,
    });
  } catch (error) {
    return errorJsonResponse(error, "ai");
  }
}
