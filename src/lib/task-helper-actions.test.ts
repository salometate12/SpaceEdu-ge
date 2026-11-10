import { describe, expect, it } from "vitest";
import { audienceFromTask, chatContext, languageFromTask, levelFromTask, nearestSlideCount, presentationInstructions, taskMilestones, taskToPresentationHandoff } from "./task-helper-actions";
import { wizardFromHandoff } from "./presentation-wizard-fill";
import { parsePresentationHandoff } from "./tool-handoff";
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

  it("fills every presentation field from a design assignment and starts by itself", () => {
    const handed = taskToPresentationHandoff(task({ result: { ...task().result, grading: "იდეა 40%, შესრულება 60%" } }));
    expect(handed).toMatchObject({
      topic: "პოსტერი: ეკოლოგია ქალაქში",
      subject: "გრაფიკული დიზაინი",
      slideCount: 5,
      level: "ბაკალავრიატი",
      language: "ქართული",
      theme: "minimal",
      goal: "ცნების განმარტება",
      audience: "პროფესორი",
      tone: "კრეატიული",
      keyPoint: "A3 ფორმატი",
      autoStart: true,
      source: { kind: "task-helper", id: "task-abc" },
      subjectId: "s1",
    });
    expect(handed.extraInstructions).toContain("2. იდეა (2 წთ): ჩემი იდეა");
    expect(handed.extraInstructions).toContain("შეფასების წესი: იდეა 40%, შესრულება 60%");
    expect(handed.extraInstructions).toContain("სპიკერის შენიშვნებში");
  });

  it("a chosen idea goes into the topic and the key point", () => {
    const handed = taskToPresentationHandoff(task({ chosenIdea: 0 }));
    expect(handed.topic).toBe("პოსტერი: ეკოლოგია ქალაქში: ქალაქის ფილტვები");
    expect(handed.keyPoint).toBe("ქალაქის ფილტვები: მწვანე სახურავები");
  });

  it("research and writing get their own goal, design and tone; no slides, no structure", () => {
    const research = taskToPresentationHandoff(task({ taskType: "research", result: { ...task().result, presentation: undefined } }));
    expect(research).toMatchObject({ goal: "კვლევის წარდგენა", theme: "paper", tone: "აკადემიური", slideCount: 10 });
    expect(research.extraInstructions).toBeUndefined();
    const writing = taskToPresentationHandoff(task({ taskType: "writing" }));
    expect(writing).toMatchObject({ goal: "არგუმენტის დამტკიცება", tone: "აკადემიური" });
    expect(writing.theme).toBeUndefined();
  });

  it("level, language and audience from the assignment's text", () => {
    expect(levelFromTask("სამაგისტრო სემინარი")).toBe("მაგისტრატურა");
    expect(levelFromTask("PhD seminar")).toBe("დოქტორანტურა");
    expect(levelFromTask("პირველი კურსი")).toBe("ბაკალავრიატი");
    expect(languageFromTask("Prepare a ten minute talk on urban ecology for the seminar group.")).toBe("ინგლისური");
    expect(languageFromTask("მოამზადე 10 წუთიანი პრეზენტაცია (A3, PDF)")).toBe("ქართული");
    expect(audienceFromTask("წარადგინე ჯგუფის წინ, ლექტორი შეაფასებს")).toBe("ჯგუფელები");
    expect(audienceFromTask("დაცვა კომისიის წინაშე")).toBe("კომისია");
    expect(audienceFromTask("ლექტორს გაუგზავნე")).toBe("პროფესორი");
  });

  it("the wizard reads every field; unknown values keep its defaults", () => {
    const fill = wizardFromHandoff(parsePresentationHandoff(JSON.parse(JSON.stringify(taskToPresentationHandoff(task({ chosenIdea: 0 })))))!);
    expect(fill.form).toMatchObject({ slideCount: 5, level: "ბაკალავრიატი", language: "ქართული", subject: "გრაფიკული დიზაინი" });
    expect(fill.qa).toEqual({ goal: "ცნების განმარტება", audience: "პროფესორი", tone: "კრეატიული", mainPoint: "ქალაქის ფილტვები: მწვანე სახურავები" });
    expect(fill.templateId).toBe("minimal");
    const odd = wizardFromHandoff({ topic: "x", slideCount: 7, level: "სკოლა", language: "ფრანგული", goal: "?", theme: "nope" });
    expect(odd.form).toMatchObject({ slideCount: 10, level: "ბაკალავრიატი", language: "ქართული" });
    expect(odd.qa.goal).toBe("ცნების განმარტება");
    expect(odd.templateId).not.toBe("nope");
    expect(parsePresentationHandoff({ topic: "x", autoStart: "yes", source: { kind: "other", id: "1" }, slideCount: "5" })).toEqual({ topic: "x" });
  });
});
