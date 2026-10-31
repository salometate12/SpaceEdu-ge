/**
 * What the task helper's result page does with the plan: puts the dated
 * steps on the dashboard calendar and the due date among the deadlines
 * the study planner reads (the student's saved plan is left alone), opens
 * a new presentation with the structure filled in, and builds the chat's
 * context.
 */
import { addMilestonesToDashboardCalendar, getGeneratedMilestones, setGeneratedMilestones, type SyllabusMilestone } from "./syllabus-calendar";
import { CALENDAR_UPDATED_EVENT } from "./user-data-keys";
import { handOffPresentation } from "./tool-handoff";
import { newPresentationId } from "./presentation-store";
import type { TaskHelper } from "./task-helper-store";

/** The wizard's slide counts (Step1Info). */
const SLIDE_COUNTS = [5, 8, 10, 12, 15];

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
  return SLIDE_COUNTS.reduce((best, value) => (Math.abs(value - count) < Math.abs(best - count) ? value : best), SLIDE_COUNTS[0]);
}

/** The structure as the wizard's extra instructions. */
export function presentationInstructions(task: TaskHelper): string {
  const slides = task.result.presentation?.slides ?? [];
  return [
    `სტრუქტურა „დავალების დამხმარიდან“ (${slides.length} სლაიდი):`,
    ...slides.map((slide, index) => `${index + 1}. ${slide.title} (${slide.minutes} წთ): ${slide.say}`),
  ].join("\n");
}

/** Opens a new presentation with the topic, subject, slide count and structure filled in; returns its URL. */
export function presentationFromTask(task: TaskHelper): string {
  handOffPresentation({
    topic: task.title,
    subject: task.subjectName,
    slideCount: nearestSlideCount(task.result.presentation?.slides.length ?? 10),
    extraInstructions: presentationInstructions(task),
  });
  return `/presentation?id=${encodeURIComponent(newPresentationId())}`;
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
