import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit";
import { enforceJsonBodyLimit } from "@/lib/request-limits";
import { requireApiKey } from "@/lib/ai/parse-form-data";
import { errorJsonResponse, llmTextStreamResponse } from "@/lib/gemini";
import { AiTeacherHistorySchema, buildAiTeacherMessages } from "@/lib/ai/ai-teacher-request";
import { AI_TEACHER_MAX_OUTPUT_TOKENS, wantsDetailedAnswer } from "@/lib/ai/ai-teacher-conversation";
import { GEORGIAN_TASK_MENTOR_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { TASK_INPUT_MAX_CHARS } from "@/lib/task-helper";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const ChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  history: AiTeacherHistorySchema.default([]),
  context: z.object({
    inputText: z.string().max(TASK_INPUT_MAX_CHARS).default(""),
    /** The plan as the page has it (JSON). */
    result: z.string().max(40_000),
    chosenIdea: z.string().max(2000).optional(),
    subject: z.string().max(120).optional(),
    dueDate: z.string().max(20).optional(),
    note: z.string().max(2000).optional(),
  }),
});

const CHAT_RULES = `ახლა სტუდენტთან საუბრობ ამ დავალებაზე, შემდეგი ნაბიჯის გადასადგმელად.
პასუხი დაწერე ჩვეულებრივი ტექსტით (არა JSON), მოკლედ და კონკრეტულად, საჭიროებისას მოკლე სიით. ნუ მიესალმები, პირდაპირ საქმეზე დაიწყე. ეყრდნობი დავალებას, გეგმას და არჩეულ იდეას. დავალებაში რაც არ წერია, არ გამოიგონო: თუ გაურკვეველია, ურჩიე, დააზუსტოს ლექტორთან. ტირე არ გამოიყენო.`;

/**
 * The task helper's chat: the student's question with the assignment, the
 * plan and the chosen idea as context. The same rate limit and answer
 * sizes as the AI teacher (the „ai“ bucket, its history rules).
 */
export async function POST(request: Request) {
  const tooLarge = enforceJsonBodyLimit(request);
  if (tooLarge) return tooLarge;
  const limited = await enforceRateLimit(request, "ai");
  if (limited) return limited;

  try {
    requireApiKey("task-helper-chat");
    const parsed = ChatRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: true, message: "მოთხოვნა არასწორია. სცადე თავიდან." }, { status: 400 });
    }
    const { message, history, context } = parsed.data;
    const system = [
      GEORGIAN_TASK_MENTOR_SYSTEM_PROMPT,
      CHAT_RULES,
      context.subject ? `საგანი: ${context.subject}` : "",
      context.dueDate ? `ჩაბარება: ${context.dueDate}` : "",
      context.note ? `სტუდენტის შენიშვნა: ${context.note}` : "",
      context.chosenIdea ? `სტუდენტმა აირჩია ეს იდეა: ${context.chosenIdea}` : "სტუდენტს იდეა ჯერ არ აურჩევია.",
      context.inputText ? `--- დავალება ---\n${context.inputText}\n--- დავალების დასასრული ---` : "",
      `--- გეგმა (JSON) ---\n${context.result}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    return llmTextStreamResponse({
      system,
      messages: buildAiTeacherMessages(history, message),
      temperature: 0.4,
      maxOutputTokens: wantsDetailedAnswer(message) ? AI_TEACHER_MAX_OUTPUT_TOKENS.detailed : AI_TEACHER_MAX_OUTPUT_TOKENS.normal,
      abortSignal: request.signal,
    });
  } catch (error) {
    return errorJsonResponse(error, "task-helper-chat");
  }
}
