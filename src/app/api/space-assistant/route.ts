import { requireApiKey } from "@/lib/ai/parse-form-data";
import { errorJsonResponse, llmTextStreamResponse } from "@/lib/gemini";
import {
  getSmartSpaceSystemInstruction,
  normalizeSmartSpace,
} from "@/lib/smart-space";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const BASE_SYSTEM_PROMPT = `შენ ხარ SpaceEdu-ს მრავალპროფილური აკადემიური ასისტენტი.

წერე გამართული ქართულით, გამოიყენე მკაფიო სტრუქტურა და Markdown:
- ## / ### სათაურები
- bullet points
- საჭიროებისას ნაბიჯები ან ცხრილის მსგავსი სტრუქტურა ტექსტურად.
`;

const MAX_QUERY_LENGTH = 12000;

export async function POST(request: Request) {
  try {
    requireApiKey("space-assistant");

    const body = (await request.json()) as {
      query?: string;
      context?: string;
      mode?: string;
      space?: string;
    };

    const query = body.query?.trim();
    const context = body.context?.trim();
    const mode = body.mode?.trim();

    if (!query) {
      return Response.json({ error: "მოთხოვნა სავალდებულოა" }, { status: 400 });
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return Response.json(
        { error: `მოთხოვნა ძალიან გრძელია (მაქს. ${MAX_QUERY_LENGTH} სიმბოლო)` },
        { status: 400 },
      );
    }

    const space = normalizeSmartSpace(body.space);
    const spaceInstruction = getSmartSpaceSystemInstruction(space);
    const modeInstruction =
      mode === "code-assistant"
        ? "თუ თემა ტექნიკურია, გამოიყენე პრაქტიკული კოდის მაგალითები და ალგორითმული ახსნა."
        : mode === "medical-dictionary"
          ? "თუ თემა სამედიცინოა, ახსენი ტერმინები ზუსტად, ეთიკურად და კლინიკური კონტექსტით."
          : "";

    const systemPrompt = [BASE_SYSTEM_PROMPT, spaceInstruction, modeInstruction]
      .filter(Boolean)
      .join("\n\n");

    const prompt = context
      ? `კონტექსტი:\n${context}\n\nმომხმარებლის მოთხოვნა:\n${query}`
      : query;

    return llmTextStreamResponse({
      system: systemPrompt,
      prompt,
      temperature: 0.35,
    });
  } catch (error) {
    return errorJsonResponse(error, "space-assistant");
  }
}
