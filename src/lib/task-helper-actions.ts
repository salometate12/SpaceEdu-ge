/**
 * What the task helper's result page does with the plan: puts the dated
 * steps on the dashboard calendar and the due date among the deadlines
 * the study planner reads (the student's saved plan is left alone), opens
 * a new presentation with the structure filled in, and builds the chat's
 * context.
 */
import { addMilestonesToDashboardCalendar, getGeneratedMilestones, setGeneratedMilestones, type SyllabusMilestone } from "./syllabus-calendar";
import { CALENDAR_UPDATED_EVENT } from "./user-data-keys";
import { handOffPresentation, type PresentationHandoff } from "./tool-handoff";
import { loadPresentation, newPresentationId } from "./presentation-store";
import { updateTaskHelper, type TaskHelper } from "./task-helper-store";
import { DEFAULT_PRESENTATION_LEVEL, PRESENTATION_SLIDE_COUNTS, type PresentationLevel } from "./presentation-constants";


const stepId = (task: TaskHelper, index: number) => `${task.id}-step-${index}`;
const dueId = (task: TaskHelper) => `${task.id}-due`;

/** The calendar entries and the deadline for a task: steps with dates, and the due date. */
export function taskMilestones(task: TaskHelper): { steps: SyllabusMilestone[]; due: SyllabusMilestone | null } {
  const steps = (task.result.steps ?? []).flatMap((step, index): SyllabusMilestone[] =>
    step.date
      ? [{ id: stepId(task, index), title: `${index + 1}. ${step.title}`, date: step.date, type: "study", topic: task.title, dateStatus: "manual", ...(task.subjectName ? { subject: task.subjectName } : {}) }]
      : [],
  );
  const due: SyllabusMilestone | null = task.dueDate
    ? { id: dueId(task), title: task.title, date: task.dueDate, type: "deadline", dateStatus: "manual", ...(task.subjectName ? { subject: task.subjectName } : {}) }
    : null;
  return { steps, due };
}

/** „სასწავლო გეგმაში დამატება“: steps and due date on the calendar, the due date among the planner's deadlines. Again: replaced, not doubled. */
export function addTaskToPlan(task: TaskHelper): { added: number } {
  const { steps, due } = taskMilestones(task);
  const entries = due ? [...steps, due] : steps;
  if (entries.length === 0) return { added: 0 };
  addMilestonesToDashboardCalendar(entries);
  if (due) {
    setGeneratedMilestones([...getGeneratedMilestones().filter((item) => item.id !== due.id), due]);
    window.dispatchEvent(new Event(CALENDAR_UPDATED_EVENT));
  }
  return { added: entries.length };
}

export function nearestSlideCount(count: number): number {
  return PRESENTATION_SLIDE_COUNTS.reduce<number>((best, value) => (Math.abs(value - count) < Math.abs(best - count) ? value : best), PRESENTATION_SLIDE_COUNTS[0]);
}

/** The structure as the wizard's extra instructions: each slide with what to say on it. */
export function presentationInstructions(task: TaskHelper): string {
  const slides = task.result.presentation?.slides ?? [];
  return [
    `სტრუქტურა „დავალების დამხმარიდან“ (${slides.length} სლაიდი):`,
    ...slides.map((slide, index) => `${index + 1}. ${slide.title} (${slide.minutes} წთ): ${slide.say}`),
  ].join("\n");
}

/** Bachelor unless the assignment says master's or doctoral (the profile doesn't keep the level). */
export function levelFromTask(text: string): PresentationLevel {
  if (/დოქტორანტ|სადოქტორო|\bph\.?d\b|doctoral/i.test(text)) return "დოქტორანტურა";
  if (/მაგისტრ|\bmaster'?s?\b|\bMA\b|\bMSc\b/i.test(text)) return "მაგისტრატურა";
  return DEFAULT_PRESENTATION_LEVEL;
}

/** The assignment's language: English when its letters are mostly Latin, otherwise Georgian. */
export function languageFromTask(text: string): string {
  const georgian = (text.match(/[\u10A0-\u10FF]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  return latin >= 40 && latin > georgian * 2 ? "ინგლისური" : "ქართული";
}

/** Who it's presented to: the group, a committee, or (also for „ლექტორი“) the professor. */
export function audienceFromTask(text: string): string {
  if (/ჯგუფის\s+წინ|ჯგუფელ|კურსელ|in front of (the )?(class|group)|classmates|your peers/i.test(text)) return "ჯგუფელები";
  if (/კომისი|ჟიური|committee|jury|panel/i.test(text)) return "კომისია";
  return "პროფესორი";
}

/** „დეტალების“ goal by the assignment's kind. */
function goalFor(task: TaskHelper): string {
  if (task.taskType === "research") return "კვლევის წარდგენა";
  if (task.taskType === "writing") return "არგუმენტის დამტკიცება";
  return "ცნების განმარტება";
}

/** A design by the assignment's kind: none (the wizard's default) for the rest. */
function themeFor(task: TaskHelper): string | undefined {
  if (task.taskType === "design") return "minimal";
  if (task.taskType === "research") return "paper";
  return undefined;
}

/** Every field of the presentation wizard, from the assignment: what the button hands over. */
export function taskToPresentationHandoff(task: TaskHelper): PresentationHandoff {
  const idea = task.chosenIdea !== null ? task.result.ideas?.[task.chosenIdea] : undefined;
  const text = [task.inputText, task.note ?? ""].join("\n");
  const slides = task.result.presentation?.slides ?? [];
  const grading = task.result.grading?.trim();
  const instructions = [
    slides.length ? presentationInstructions(task) : "",
    grading ? `შეფასების წესი: ${grading}\nპრეზენტაციამ ამ კრიტერიუმებს გაუსვას ხაზი.` : "",
    slides.length ? "თითო სლაიდის „რა თქვა“ ტექსტი სპიკერის შენიშვნებში (notes) ჩაწერე." : "",
  ].filter(Boolean);
  const theme = themeFor(task);
  const keyPoint = idea ? `${idea.title}: ${idea.description}` : task.result.requirements[0];
  return {
    topic: idea ? `${task.title}: ${idea.title}` : task.title,
    ...(task.subjectName ? { subject: task.subjectName } : {}),
    slideCount: nearestSlideCount(slides.length || 10),
    level: levelFromTask(text),
    language: languageFromTask(task.inputText),
    ...(instructions.length ? { extraInstructions: instructions.join("\n\n") } : {}),
    ...(theme ? { theme } : {}),
    goal: goalFor(task),
    audience: audienceFromTask(text),
    tone: task.taskType === "design" ? "კრეატიული" : "აკადემიური",
    ...(keyPoint ? { keyPoint } : {}),
    autoStart: true,
    source: { kind: "task-helper", id: task.id },
    ...(task.subjectId ? { subjectId: task.subjectId } : {}),
    ...(task.topicId ? { topicId: task.topicId } : {}),
  };
}

const presentationHref = (id: string) => `/presentation?id=${encodeURIComponent(id)}`;

/**
 * „პრეზენტაციის შექმნა“ / „გახსნა“: the one made from this assignment
 * when it's still there, otherwise (or with `fresh`, „ახლის შექმნა“) a new
 * one, filled in and generating by itself. Returns where to go.
 */
export async function openTaskPresentation(task: TaskHelper, { fresh = false }: { fresh?: boolean } = {}): Promise<string> {
  if (!fresh && task.presentationId) {
    const saved = await loadPresentation(task.presentationId).catch(() => null);
    if (saved) return presentationHref(task.presentationId);
  }
  const id = newPresentationId();
  handOffPresentation(taskToPresentationHandoff(task));
  updateTaskHelper(task.id, { presentationId: id });
  return presentationHref(id);
}

/** What the chat sends along with each question. */
export function chatContext(task: TaskHelper) {
  const idea = task.chosenIdea !== null ? task.result.ideas?.[task.chosenIdea] : undefined;
  return {
    inputText: task.inputText,
    result: JSON.stringify(task.result),
    ...(idea ? { chosenIdea: `${idea.title}: ${idea.description}` } : {}),
    ...(task.subjectName ? { subject: task.subjectName } : {}),
    ...(task.dueDate ? { dueDate: task.dueDate } : {}),
    ...(task.note ? { note: task.note } : {}),
  };
}
