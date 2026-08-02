import { z } from "zod";
import { buildUserPrompt } from "@/lib/ai/build-user-prompt";
import { CvRequestSchema, CvResponseSchema, type CvResponse } from "@/lib/ai/cv-schema";
import {
  Eli5RequestSchema,
  Eli5ResponseSchema,
  type Eli5Response,
} from "@/lib/ai/eli5-schema";
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
      "date": "დღე თვე, წელი (ქართულად)",
      "type": "midterm" | "quiz" | "deadline"
    }
  ]
}
Extract dates only from the provided syllabus text. Respect the requested focus options.`;

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

const RESEARCH_JSON_INSTRUCTIONS = `
Return ONLY valid JSON (all text in Georgian):
{
  "summary": "სტრუქტურირებული რეზიუმე",
  "sources": [{ "citation": "წყარო", "relevance": "რატომ მნიშვნელოვანია" }],
  "quotes": [{ "quote": "ციტატა", "context": "კონტექსტი", "location": "გვერდი/თავი" }],
  "theses": ["თეზისი 1"],
  "methodology": "მეთოდოლოგიის ანალიზი",
  "literatureReview": "ლიტერატურის მიმოხილვა"
}
Include theses/methodology/literatureReview ONLY when requested in analysis focus.
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
): Promise<SyllabusResponse> {
  const system = getSystemPromptForPageType("syllabus");
  const payload = SyllabusRequestSchema.parse({
    fileName,
    textBody,
    options,
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
    milestones: normalizeSyllabusMilestones(raw.milestones),
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
        message: "multipart მხარდაჭერა: syllabus ან research-platform-abit.",
      },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json(
      { error: true, message: "PDF ფაილი არ არის მიმაგრებული." },
      { status: 400 },
    );
  }

  const textBody = await extractTextFromPdfFile(file);

  if (pageType === "syllabus") {
    let options: z.infer<typeof SyllabusOptionsSchema> | undefined;
    const optionsRaw = formData.get("options");
    if (typeof optionsRaw === "string" && optionsRaw.trim()) {
      options = SyllabusOptionsSchema.parse(JSON.parse(optionsRaw));
    }
    const result = await generateSyllabusFromText(file.name, textBody, options);
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
        if (error instanceof PdfExtractError) {
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
