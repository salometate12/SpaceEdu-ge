import { describe, expect, it } from "vitest";
import { buildUserPrompt } from "./build-user-prompt";
import { AI_TEACHER_SPACE_PROMPTS, getSystemPromptForPageType } from "./page-prompts";

describe("AI teacher prompts per space", () => {
  it("adds the student paragraph for the student teacher", () => {
    const system = getSystemPromptForPageType("ai-teacher", { space: "student", message: "x" });
    expect(system).toContain(AI_TEACHER_SPACE_PROMPTS.student);
    expect(system).not.toContain(AI_TEACHER_SPACE_PROMPTS.abiturient);
  });

  it("adds the national-exam paragraph for the abiturient teacher", () => {
    const system = getSystemPromptForPageType("ai-teacher", { space: "abiturient", message: "x" });
    expect(system).toContain(AI_TEACHER_SPACE_PROMPTS.abiturient);
    expect(system).not.toContain(AI_TEACHER_SPACE_PROMPTS.student);
  });

  it("defaults to the student teacher when no space is sent", () => {
    expect(getSystemPromptForPageType("ai-teacher", { message: "x" })).toContain(
      AI_TEACHER_SPACE_PROMPTS.student,
    );
    expect(getSystemPromptForPageType("ai-teacher")).toContain(AI_TEACHER_SPACE_PROMPTS.student);
    expect(buildUserPrompt("ai-teacher", { message: "x" })).toContain("university student");
  });

  it("names the learner in the user prompt", () => {
    expect(buildUserPrompt("ai-teacher", { space: "abiturient", message: "x" })).toContain(
      "National Exams",
    );
    expect(buildUserPrompt("ai-teacher", { space: "student", message: "x" })).toContain(
      "university student",
    );
  });

  it("leaves other page types alone", () => {
    expect(getSystemPromptForPageType("eli5", { space: "abiturient" })).not.toContain(
      AI_TEACHER_SPACE_PROMPTS.abiturient,
    );
  });
});

describe("AI teacher: length and conversation rules", () => {
  const system = getSystemPromptForPageType("ai-teacher", { space: "abiturient", message: "x" });

  it("caps answers at 5–6 paragraphs and one next-step offer", () => {
    expect(system).toContain("at most 5–6 short paragraphs");
    expect(system).toContain("exactly one short, one-line offer");
    expect(system).not.toContain("Teach thoroughly and completely");
  });

  it("tells the model how follow-ups refer to the previous topic", () => {
    expect(system).toContain("„უფრო მოკლედ“");
    expect(system).toContain("„კი“");
    expect(system).toContain("starts fresh");
  });
});
