import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SubjectFile } from "./subjects";

const state = vi.hoisted(() => ({
  files: [] as SubjectFile[],
  connected: true,
  ensure: vi.fn<(file: SubjectFile) => Promise<string | null>>(),
  blob: vi.fn<(file: SubjectFile) => Promise<File | null>>(),
  order: [] as string[],
  release: (() => undefined) as () => void,
}));

vi.mock("./user-data", () => ({
  whenAccountDataIn: () =>
    new Promise<void>((resolve) => {
      state.release = () => {
        state.order.push("account in");
        resolve();
      };
    }),
}));
vi.mock("./user-files", () => ({ isUserFilesConnected: () => state.connected }));
vi.mock("./subject-files-client", () => ({ ensureSubjectFileStored: state.ensure, getSubjectFileBlob: state.blob }));
vi.mock("./subject-store", () => ({
  getFiles: () => {
    state.order.push("files read");
    return state.files;
  },
  getTopic: (id: string) => (id === "t1" ? { id: "t1", subjectId: "s1", title: "თემა 1" } : undefined),
  markTopicStarted: () => undefined,
}));
vi.mock("./presentation-store", () => ({ newPresentationId: () => "p" }));
vi.mock("./tool-handoff", () => ({ handOffPresentation: () => undefined }));
vi.mock("./access-control", () => ({ aiTeacherHrefForSpace: () => "/ai-teacher" }));
vi.mock("./syllabus-calendar", () => ({ AI_TEACHER_CONTEXT_KEY: "a", AI_TEACHER_PROMPT_KEY: "b", AI_TEACHER_TITLE_KEY: "c" }));

import { topicSources } from "./subject-actions";
import { isStoredFile } from "./stored-file";

const file = (id: string, storagePath: string | null): SubjectFile => ({ id, subjectId: "s1", name: `${id}.pptx`, size: 9_000_000, mime: "", kind: "lecture", topicIds: ["t1"], storagePath, createdAt: 0, updatedAt: 0 });

const opened = async () => {
  const pending = topicSources("s1", "t1");
  await Promise.resolve();
  state.release();
  return pending;
};

describe("a topic's files for a generator", () => {
  beforeEach(() => {
    state.connected = true;
    state.order = [];
    state.ensure.mockReset();
    state.blob.mockReset();
    state.ensure.mockImplementation(async (item) => item.storagePath);
  });

  it("reads the list only once the account's data is in", async () => {
    state.files = [file("a", "u/subjects/s1/a")];
    await opened();
    expect(state.order).toEqual(["account in", "files read"]);
  });

  it("four uploaded files: all four, as paths, without a download", async () => {
    state.files = ["a", "b", "c", "d"].map((id) => file(id, `u/subjects/s1/${id}`));
    const sources = await opened();
    expect(sources?.files).toHaveLength(4);
    expect(sources?.files.every(isStoredFile)).toBe(true);
    expect(sources?.failed).toEqual([]);
    expect(state.blob).not.toHaveBeenCalled();
  });

  it("not in storage: it goes up first and is then listed", async () => {
    state.files = [file("a", null)];
    state.ensure.mockResolvedValue("u/subjects/s1/a");
    const sources = await opened();
    expect(sources?.files.every(isStoredFile)).toBe(true);
    expect(sources?.failed).toEqual([]);
  });

  it("couldn't go up: never silently dropped, and no blob while signed in", async () => {
    state.files = [file("a", "u/subjects/s1/a"), file("b", null)];
    const sources = await opened();
    expect(sources?.files).toHaveLength(1);
    expect(sources?.failed.map((item) => item.id)).toEqual(["b"]);
    expect(state.blob).not.toHaveBeenCalled();
  });

  it("signed out: this device's copy, or the same reported failure", async () => {
    state.connected = false;
    state.files = [file("a", null), file("b", null)];
    state.ensure.mockResolvedValue(null);
    state.blob.mockImplementation(async (item) => (item.id === "a" ? new File(["x"], "a.pptx") : null));
    const sources = await opened();
    expect(sources?.files.map((item) => item.name)).toEqual(["a.pptx"]);
    expect(sources?.failed.map((item) => item.id)).toEqual(["b"]);
  });
});
