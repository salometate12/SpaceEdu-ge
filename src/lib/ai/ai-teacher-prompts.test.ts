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
