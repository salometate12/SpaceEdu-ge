import { describe, expect, it } from "vitest";
import { chatContext, nearestSlideCount, presentationInstructions, taskMilestones } from "./task-helper-actions";
import { taskItem } from "./library/materials";
import type { TaskHelper } from "./task-helper-store";

const task = (extra: Partial<TaskHelper> = {}): TaskHelper => ({
  id: "task-abc",
  title: "პოსტერი: ეკოლოგია ქალაქში",
  taskType: "design",
  sections: ["steps", "ideas", "presentation"],
  subjectId: "s1",
  subjectName: "გრაფიკული დიზაინი",
  dueDate: "2026-11-15",
  inputText: "შექმენი A3 პოსტერი",
  result: {
    title: "პოსტერი: ეკოლოგია ქალაქში",
    requirements: ["A3 ფორმატი"],
    steps: [
      { title: "კვლევა", detail: "…", date: "2026-11-01" },
      { title: "ესკიზები", detail: "…", date: "2026-11-07" },
      { title: "ჩაბარება", detail: "…" },
    ],
    ideas: [{ title: "ქალაქის ფილტვები", description: "მწვანე სახურავები", tags: [] }],
    presentation: { slides: [{ title: "შესავალი", minutes: 1, say: "გამარჯობა" }, { title: "იდეა", minutes: 2, say: "ჩემი იდეა" }] },
    followUp: { question: "რომელი იდეა?", options: [] },
  },
  doneSteps: [0],
  chosenIdea: null,
  messages: [],
  createdAt: 1,
  updatedAt: 1,
  ...extra,
});

describe("task helper actions", () => {
  it("puts the dated steps on the calendar and the due date among the deadlines, with stable ids", () => {
    const { steps, due } = taskMilestones(task());
    expect(steps.map((item) => [item.id, item.date, item.type])).toEqual([
      ["task-abc-step-0", "2026-11-01", "study"],
      ["task-abc-step-1", "2026-11-07", "study"],
    ]);
    expect(due).toMatchObject({ id: "task-abc-due", date: "2026-11-15", type: "deadline", subject: "გრაფიკული დიზაინი" });
    expect(taskMilestones(task({ dueDate: undefined })).due).toBeNull();
  });

  it("fills the presentation with the nearest slide count and the structure", () => {
    expect([3, 6, 9, 11, 14, 30].map(nearestSlideCount)).toEqual([5, 5, 8, 10, 15, 15]);
    expect(presentationInstructions(task())).toContain("2. იდეა (2 წთ): ჩემი იდეა");
  });

  it("sends the assignment, the plan and the chosen idea to the chat", () => {
    expect(chatContext(task()).chosenIdea).toBeUndefined();
    const context = chatContext(task({ chosenIdea: 0 }));
    expect(context).toMatchObject({ inputText: "შექმენი A3 პოსტერი", chosenIdea: "ქალაქის ფილტვები: მწვანე სახურავები", dueDate: "2026-11-15" });
    expect(JSON.parse(context.result).title).toBe("პოსტერი: ეკოლოგია ქალაქში");
  });

  it("shows in the library as steps done of all, unfinished until every step is ticked", () => {
    expect(taskItem(task())).toMatchObject({ kind: "task", unfinished: true, done: false, task: { done: 1, steps: 3, dueDate: "2026-11-15" } });
    expect(taskItem(task({ doneSteps: [0, 1, 2] }))).toMatchObject({ unfinished: false, done: true });
  });
});
