import { GEORGIAN_SUMMARY_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  parseGenerationFormData,
  requireApiKey,
} from "@/lib/ai/parse-form-data";
import { errorJsonResponse, llmTextStreamResponse } from "@/lib/gemini";
import { GenerationInputError } from "@/lib/generation-options";
import { buildMultiFileSummaryMessage, NoMaterialTextError } from "@/lib/ai/multi-file-summary";
import { encodeSkippedFiles, NO_TEXT_CODE, SKIPPED_FILES_HEADER } from "@/lib/conspectus-empty";
import { summaryCreditCost, summaryFilesSchema } from "@/lib/summary-files";
import { attachStoredFiles } from "@/lib/stored-files-server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "ai");
  if (limited) return limited;

  try {
    requireApiKey("generate-summary");

    const formData = await request.formData();
    // Files in the account's storage come as paths: read here, not sent by the browser.
    await attachStoredFiles(formData);

    // Files (up to five): one conspectus from all of them.
    const files = formData.getAll("files");
    if (files.length > 0) {
      const checked = summaryFilesSchema.safeParse(files);
      if (!checked.success) throw new GenerationInputError(checked.error.issues[0]?.message ?? "ფაილები არასწორია.");
      const topic = String(formData.get("topic") ?? "");
      const { message, skipped } = await buildMultiFileSummaryMessage(checked.data, topic);
      const response = llmTextStreamResponse({
        system: GEORGIAN_SUMMARY_SYSTEM_PROMPT,
        messages: [message],
        temperature: 0.25,
      });
      if (skipped.length > 0) response.headers.set(SKIPPED_FILES_HEADER, encodeSkippedFiles(skipped));
      // What it costs, from the files actually sent (nothing is charged: there's no credit balance yet).
      response.headers.set("X-Credit-Cost", String(summaryCreditCost(checked.data.length)));
      return response;
    }

    const { userMessage } = await parseGenerationFormData(formData, "summary");

    return llmTextStreamResponse({
      system: GEORGIAN_SUMMARY_SYSTEM_PROMPT,
      messages: [userMessage],
      temperature: 0.25,
    });
  } catch (error) {
    // No text in the material: the AI wasn't asked, nothing is made.
    if (error instanceof NoMaterialTextError) {
      return Response.json({ error: error.message, message: error.message, code: NO_TEXT_CODE, files: error.files }, { status: 400 });
    }
    if (error instanceof GenerationInputError) {
      return Response.json({ error: error.message, message: error.message }, { status: 400 });
    }
    return errorJsonResponse(error, "generate-summary");
  }
}
