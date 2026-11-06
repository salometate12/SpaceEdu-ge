import { beforeEach, describe, expect, it, vi } from "vitest";
import { appendFile, isStoredFile, StoredFile } from "./stored-file";
import { apiErrorMessage } from "./assistant-stream-client";
import { AI_BUSY_MESSAGE, AI_TOO_LARGE_MESSAGE } from "./ai/ai-messages";
import { buildGenerationFormData } from "./build-generation-form-data";

const connected = vi.hoisted(() => ({ value: true, upload: vi.fn<(file: File) => Promise<string | null>>() }));
vi.mock("./user-files", () => ({
  isUserFilesConnected: () => connected.value,
  uploadForGeneration: (file: File) => connected.upload(file),
}));

const stored = (name = "ლექცია 2.pptx", size = 12 * 1024 * 1024) => new StoredFile(name, size, "application/vnd.openxmlformats-officedocument.presentationml.presentation", `u1/subjects/s1/${name}`);

describe("a file in storage", () => {
  it("lists like a file (name, real size, type) and holds no bytes", async () => {
    const file = stored();
    expect(file).toBeInstanceOf(File);
    expect(isStoredFile(file)).toBe(true);
    expect(file.size).toBe(12 * 1024 * 1024);
    expect((await file.arrayBuffer()).byteLength).toBe(0);
  });

  it("goes on the form as its path; any other file as itself", () => {
    const form = new FormData();
    appendFile(form, "files", stored("a.pptx"));
    appendFile(form, "files", new File(["x"], "b.txt", { type: "text/plain" }));
    expect(form.getAll("storagePaths")).toEqual(["u1/subjects/s1/a.pptx"]);
    expect(form.getAll("storageFields")).toEqual(["files"]);
    expect((form.getAll("files") as File[]).map((file) => file.name)).toEqual(["b.txt"]);
  });

  it("a conspectus from five stored files sends no file bytes at all", () => {
    const files = Array.from({ length: 5 }, (_, index) => stored(`l${index}.pptx`));
    const form = buildGenerationFormData({ inputType: "file", file: null, files, text: "", youtubeUrl: "", topic: "თემა", cardCount: 10 });
    expect(form.getAll("files")).toEqual([]);
    expect(form.getAll("storagePaths")).toHaveLength(5);
  });
});

describe("a presentation source's conspectus", () => {
  it("sends its files, not the empty text", () => {
    const form = buildGenerationFormData({ inputType: "presentation", file: null, files: [new File(["ა"], "ა.txt"), stored("ბ.pptx")], text: "", youtubeUrl: "", topic: "", cardCount: 10 });
    expect((form.getAll("files") as File[]).map((file) => file.name)).toEqual(["ა.txt"]);
    expect(form.getAll("storagePaths")).toEqual(["u1/subjects/s1/ბ.pptx"]);
    expect(form.has("text")).toBe(false);
    expect(form.get("inputType")).toBe("presentation");
  });

  it("a deck from one saved presentation still sends its text", () => {
    const form = buildGenerationFormData({ inputType: "presentation", file: null, text: "სლაიდები", youtubeUrl: "", topic: "", cardCount: 10 });
    expect(form.get("text")).toBe("სლაიდები");
  });
});

describe("staging a dropped file", () => {
  beforeEach(() => {
    connected.value = true;
    connected.upload.mockReset();
  });

  it("signed in: uploaded first, then only its path is sent", async () => {
    const { stageFile } = await import("./stage-uploads");
    connected.upload.mockResolvedValue("u1/uploads/x.pdf");
    const staged = await stageFile(new File([new Uint8Array(10)], "big.pdf", { type: "application/pdf" }));
    expect(isStoredFile(staged) && staged.storagePath).toBe("u1/uploads/x.pdf");
    expect(staged.size).toBe(10);
  });

  it("signed out: a small file goes as it is, a big one gets the reason", async () => {
    const { stageFile, SIGN_IN_FOR_BIG_FILE } = await import("./stage-uploads");
    connected.value = false;
    const small = new File(["abc"], "a.txt");
    expect(await stageFile(small)).toBe(small);
    const big = new File([new Uint8Array(5 * 1024 * 1024)], "b.pdf");
    await expect(stageFile(big)).rejects.toThrow(SIGN_IN_FOR_BIG_FILE);
  });

  it("a file already in storage isn't uploaded again", async () => {
    const { stageFile } = await import("./stage-uploads");
    const file = stored();
    expect(await stageFile(file)).toBe(file);
    expect(connected.upload).not.toHaveBeenCalled();
  });
});

describe("the reason a request failed", () => {
  it("413 from the platform (not JSON) says the file is too big; 503 that the AI is busy", () => {
    expect(apiErrorMessage(413, "Request Entity Too Large", "fallback")).toBe(AI_TOO_LARGE_MESSAGE);
    expect(apiErrorMessage(503, "<html>", "fallback")).toBe(AI_BUSY_MESSAGE);
  });

  it("the API's own message wins, and other statuses keep it too", () => {
    expect(apiErrorMessage(413, JSON.stringify({ message: "ფაილი ძალიან დიდია. მაქსიმუმ 20 MB." }), "x")).toBe("ფაილი ძალიან დიდია. მაქსიმუმ 20 MB.");
    expect(apiErrorMessage(400, JSON.stringify({ message: "ფაილიდან ტექსტი ვერ ამოვიღე." }), "x")).toBe("ფაილიდან ტექსტი ვერ ამოვიღე.");
    expect(apiErrorMessage(500, "", "x")).toBe("x");
  });
});
