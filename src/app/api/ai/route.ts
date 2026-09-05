import { z } from "zod";
import { buildUserPrompt } from "@/lib/ai/build-user-prompt";
import { CvRequestSchema, CvResponseSchema, type CvResponse } from "@/lib/ai/cv-schema";
import {
  Eli5RequestSchema,
  Eli5ResponseSchema,
  type Eli5Response,
} from "@/lib/ai/eli5-schema";
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
  SyllabusOptionsSchema,
  SyllabusRequestSchema,
  SyllabusResponseSchema,
  normalizeSyllabusMilestones,
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
Return ONLY valid JSON (all text in Georgian):
{
  "insight": "2-3 წინადადება სილაბუსის სტრუქტურის შეჯამება",
  "milestones": [
    {
      "id": "unique-slug",
      "title": "მოვლენის სახელი",
      "date": "YYYY-MM-DD — STRICT ISO format, always a real calendar date, never a week label",
      "week": "სემესტრის კვირის ნომერი, თუ სილაბუსში მითითებულია (მაგ. \\"8\\")",
      "topic": "მოკლე თემა/თავი, რასაც ეს მოვლენა ეხება, თუ სილაბუსში ჩანს",
      "type": "midterm" | "quiz" | "deadline"
    }
  ]
}
Extract dates/weeks/topics only from the provided syllabus text.
The "date" field MUST always be a real YYYY-MM-DD calendar date — never a bare week label like "Week 8" or "კვირა VIII".
If the syllabus only states a week number (not an absolute date), compute the real date yourself using the provided semester start date: date = semester start date + (week_number - 1) * 7 days. Put the week number itself in "week" regardless.
If no semester start date is provided and the syllabus has no absolute date either, make your best estimate but still return a valid YYYY-MM-DD string.
Respect the requested focus options.`;

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
      "photoSlot": "optional-slot-name or null"
    }
  ]
}
First slide should be type "cover", last slide "conclusion". Match requested slide count closely.`;

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

const MULTIPART_PAGE_TYPES = ["syllabus", "research-platform-abit", "ai-teacher"] as const;

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
    schema: SyllabusResponseSchema,
    system: `${system}\n${SYLLABUS_JSON_INSTRUCTIONS}`,
    prompt,
    temperature: 0.25,
  })) as SyllabusResponse;

  return {
    ...raw,
    milestones: normalizeSyllabusMilestones(raw.milestones, semesterStartDate),
  };
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
        message: "multipart მხარდაჭერა: syllabus, research-platform-abit ან ai-teacher.",
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
  const lowerName = file.name.toLowerCase();
  const acceptsMedia =
    pageType === "research-platform-abit" || pageType === "ai-teacher";
  const isImageFile = acceptsMedia && lowerType.startsWith("image/");
  const isAudioFile = acceptsMedia && lowerType.startsWith("audio/");
  const isPlainText =
    lowerType.startsWith("text/") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md");

  const textBody = isImageFile
    ? await extractTextFromImageFile(file)
    : isAudioFile
      ? await extractTextFromAudioFile(file)
      : isPlainText
        ? (await file.text()).trim()
        : await extractTextFromPdfFile(file);

  if (pageType === "ai-teacher") {
    const message = String(formData.get("message") ?? "").trim();
    const system = getSystemPromptForPageType("ai-teacher");
    const prompt = buildUserPrompt("ai-teacher", {
      material: `მიმაგრებული ფაილი „${file.name}" — ამოღებული შიგთავსი:\n${textBody}`,
      message:
        message ||
        "გააანალიზე მიმაგრებული ფაილი და ამიხსენი მისი შინაარსი დეტალურად.",
    });
    return llmTextStreamResponse({ system, prompt, temperature: 0.35 });
  }

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
    const result = await generateSyllabusFromText(file.name, textBody, options, semesterStartDate);
    return Response.json(result);
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
    const system = getSystemPromptForPageType(pageType);

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
            {
              error: true,
              message: PDF_TEXT_EMPTY_ERROR,
            },
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
        slides: normalizePresentationSlides(raw.slides),
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
