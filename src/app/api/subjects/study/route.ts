import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireApiKey } from "@/lib/ai/parse-form-data";
import { errorJsonResponse, generateGeminiObject } from "@/lib/gemini";
import { GenerationInputError } from "@/lib/generation-options";
import { AI_FILE_TEXT_MESSAGE } from "@/lib/ai/ai-messages";
import { MATH_FORMAT_RULES, MATH_JSON_RULE } from "@/lib/ai/prompts";
import { attachStoredFiles } from "@/lib/stored-files-server";
import {
  CHECK_QUESTIONS,
  CheckQuizSchema,
  cleanCheck,
  hasForeignScript,
  withoutForeignScript,
  withoutGreeting,
  PartSchema,
  partRange,
  PlanSchema,
  SourceRefSchema,
  STUDY_MAX_FILES,
  STUDY_MODES,
} from "@/lib/study/schemas";
import { fileUnits, renderUnits, unitsFor, validRefs, type SourceUnit } from "@/lib/study/sources";

export const runtime = "nodejs";
export const maxDuration = 120;

/** All the material, for a plan or the check questions. */
const PLAN_BUDGET = 60_000;
/** A part's own slides or pages. */
const PART_BUDGET = 14_000;

const RULES = `წესები:
- ახსენი მხოლოდ მასალაზე დაყრდნობით, არ გამოიგონო ის, რაც მასალაში არ წერია.
- დაწერე ბუნებრივი, გამართული ქართულით, თბილად, როგორც კარგი მასწავლებელი.
- ტირეები (— ან –) ტექსტში არ გამოიყენო; ჩამონათვალისთვის გამოიყენე markdown სია.
- მნიშვნელოვანი ცნებები **მუქად**.
- არ მიესალმო და არ წარადგინო, რას გააკეთებ: პირდაპირ შინაარსით დაიწყე.
- მხოლოდ ქართული ანბანი; ტერმინი ლათინურად შეიძლება, სხვა დამწერლობა არასოდეს.
- feedback ახსნის, რატომ არის სწორი პასუხი სწორი, ნეიტრალურად: „სწორია“, „ზუსტად“, „არასწორია“ არ დაწერო, ეკრანი თავად აჩვენებს.
${MATH_FORMAT_RULES}
${MATH_JSON_RULE}`;

const FormSchema = z.object({
  action: z.enum(["plan", "part", "check"]),
  mode: z.enum(STUDY_MODES),
  topic: z.string().max(300).optional(),
});

/** The session's files, read (from storage, or as sent) into slides and pages. */
async function readUnits(form: FormData): Promise<SourceUnit[]> {
  await attachStoredFiles(form);
  const files = form.getAll("files").filter((item): item is File => item instanceof File).slice(0, STUDY_MAX_FILES);
  const ids = form.getAll("fileIds").map(String);
  const names = form.getAll("fileNames").map(String);
  const units: SourceUnit[] = [];
  for (const [index, file] of files.entries()) {
    // Stored files are put on the form after the ones sent as they are: matched by name.
    const at = names.indexOf(file.name);
    const fileId = (at !== -1 ? ids[at] : ids[index]) ?? `file-${index + 1}`;
    units.push(...(await fileUnits(fileId, file.name, Buffer.from(await file.arrayBuffer()))));
  }
  if (units.length === 0) throw new GenerationInputError(AI_FILE_TEXT_MESSAGE);
  return units;
}

function parseJson<T>(raw: FormDataEntryValue | null, schema: z.ZodType<T>, fallback: T): T {
  try {
    const parsed = schema.safeParse(JSON.parse(String(raw ?? "")));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

/**
 * „სწავლის სესია“ from a subject's files (/subjects/<id>/study/…): the
 * plan (parts, each with its slides or pages), one part at a time (lazy,
 * one ahead), and „შემამოწმე“'s eight questions. The files come as storage
 * paths and are read here.
 */
export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "ai");
  if (limited) return limited;

  try {
    requireApiKey("subjects-study");
    const form = await request.formData();
    const fields = FormSchema.safeParse({ action: form.get("action"), mode: form.get("mode"), topic: form.get("topic") ?? undefined });
    if (!fields.success) return Response.json({ error: true, message: "მოთხოვნა არასწორია." }, { status: 400 });
    const { action, mode, topic } = fields.data;
    const units = await readUnits(form);
    const kinds = Object.fromEntries(units.map((unit) => [unit.fileId, unit.kind]));

    if (action === "plan") {
      const [min, max] = partRange(mode);
      const focus = parseJson(form.get("focus"), z.array(z.string().max(300)).max(CHECK_QUESTIONS), []);
      const plan = (await generateGeminiObject({
        schema: PlanSchema,
        system: `შენ ხარ SpaceEdu-ის მასწავლებელი. სტუდენტის მასალას ყოფ მოკლე, თანმიმდევრულ ნაწილებად სასწავლად.
${mode === "quick" ? `სწრაფი გამეორება: მხოლოდ მთავარი ცნებები და ფორმულები, ${min}–${max} ნაწილი.` : `სრული გავლა: მთელი მასალა თავიდან ბოლომდე, ${min}–${max} ნაწილი, მასალის რიგით.`}
${focus.length ? `მხოლოდ ეს თემები, რომლებზეც სტუდენტმა ვერ უპასუხა: ${focus.join("; ")}. თითო თემას თითო ნაწილი.` : ""}
თითო ნაწილს: მოკლე ქართული სათაური (≤ 8 სიტყვა) და refs: რომელი ფაილის რომელი სლაიდი ან გვერდი (fileId და unit ნომერი, ზუსტად ისე, როგორც მასალაშია). ნუ მიუთითებ სლაიდს, რომელიც არ არსებობს.
${RULES}`,
        prompt: `${topic ? `თემა: ${topic}\n\n` : ""}--- მასალა ---\n${renderUnits(units, PLAN_BUDGET)}`,
        temperature: 0.2,
      })) as z.infer<typeof PlanSchema>;
      const parts = plan.parts
        .map((part) => ({ title: withoutForeignScript(part.title).trim(), refs: validRefs(part.refs, units) }))
        .filter((part) => part.title)
        .slice(0, max);
      if (parts.length === 0) throw new GenerationInputError(AI_FILE_TEXT_MESSAGE);
      return Response.json({ parts, kinds });
    }

    if (action === "check") {
      const quiz = (await generateGeminiObject({
        schema: CheckQuizSchema,
        system: `შენ ხარ SpaceEdu-ის მასწავლებელი. შეამოწმე, რა იცის სტუდენტმა ამ მასალიდან: ზუსტად ${CHECK_QUESTIONS} კითხვა მთელი მასალიდან, სხვადასხვა თემაზე.
თითო კითხვას: 3 ვარიანტი (ერთი სწორი), correctIndex (0–2), მოკლე feedback (რატომ არის სწორი), topic (რა თემას ამოწმებს, ≤ 8 სიტყვა) და refs (fileId და unit, საიდან არის).
${RULES}`,
        prompt: `${topic ? `თემა: ${topic}\n\n` : ""}--- მასალა ---\n${renderUnits(units, PLAN_BUDGET)}`,
        temperature: 0.3,
      })) as z.infer<typeof CheckQuizSchema>;
      const questions = quiz.questions
        .map((question) =>
          cleanCheck({
            ...question,
            question: withoutForeignScript(question.question),
            options: question.options.map(withoutForeignScript),
            feedback: withoutForeignScript(question.feedback),
            topic: withoutForeignScript(question.topic).trim(),
            refs: validRefs(question.refs, units),
          }),
        )
        .filter((question): question is NonNullable<typeof question> => Boolean(question))
        .slice(0, CHECK_QUESTIONS);
      if (questions.length === 0) throw new GenerationInputError(AI_FILE_TEXT_MESSAGE);
      return Response.json({ questions, kinds });
    }

    // One part.
    const title = String(form.get("title") ?? "").slice(0, 300);
    const refs = validRefs(parseJson(form.get("refs"), z.array(SourceRefSchema).max(40), []), units);
    const titles = parseJson(form.get("titles"), z.array(z.string().max(300)).max(12), []);
    const simpler = form.get("simpler") === "1";
    const source = refs.length ? unitsFor(refs, units) : units;
    const askPart = async () => (await generateGeminiObject({
      schema: PartSchema,
      system: `შენ ხარ SpaceEdu-ის მასწავლებელი. ახსენი სესიის ერთი ნაწილი, მხოლოდ მისი სლაიდების ან გვერდების მიხედვით.
explanation: markdown, 80–160 სიტყვა, თუ მასალა ამდენს იძლევა; მოკლე მასალაზე მოკლედ, ოღონდ არაფერი დაამატო, რაც მასში არ წერია. მოკლე აბზაცები, საჭიროებისას სია. პირველივე წინადადება შინაარსია.${simpler ? " ახსენი ბევრად უფრო მარტივად, ყოველდღიური ანალოგიით, თითქოს პირველად ესმის; იგივე შინაარსი, სხვა სიტყვებით." : ""}
example: ერთი კონკრეტული მაგალითი მასალიდან (1–3 წინადადება), ან null, თუ მასალაში მაგალითი არ ჩანს.
check: ერთი კითხვა ამ ნაწილზე, 3 ვარიანტი (ერთი სწორი), correctIndex (0–2) და feedback (1–2 წინადადება, რატომ არის სწორი).
სხვა ნაწილების თემებს არ ახსნი, ისინი ცალკე იქნება.
${RULES}`,
      prompt: [
        titles.length ? `სესიის ნაწილები: ${titles.map((item, index) => `${index + 1}. ${item}`).join("; ")}` : "",
        `ეს ნაწილი: ${title}`,
        `--- მასალა ---\n${renderUnits(source, PART_BUDGET)}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      temperature: simpler ? 0.5 : 0.3,
    })) as z.infer<typeof PartSchema>;
    let part = await askPart();
    // A slip into another script („სპეციალურ结构-ს“): asked once more, and whatever is left removed.
    if (hasForeignScript(JSON.stringify(part))) part = await askPart();
    const clean = withoutForeignScript;
    const check = cleanCheck({
      question: clean(part.check.question),
      options: part.check.options.map(clean),
      correctIndex: part.check.correctIndex,
      feedback: clean(part.check.feedback),
    });
    if (!check || !part.explanation.trim()) throw new Error("study part: empty answer");
    return Response.json({ part: { explanation: withoutGreeting(clean(part.explanation)), example: part.example ? clean(part.example).trim() || null : null, check }, kinds });
  } catch (error) {
    if (error instanceof GenerationInputError) return Response.json({ error: true, message: error.message }, { status: 400 });
    return errorJsonResponse(error, "subjects/study");
  }
}
