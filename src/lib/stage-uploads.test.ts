import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildGenerationFormData } from "./build-generation-form-data";
import { isStoredFile } from "./stored-file";

const state = vi.hoisted(() => ({ connected: true, upload: vi.fn<(file: File) => Promise<string | null>>() }));
vi.mock("./user-files", () => ({
  isUserFilesConnected: () => state.connected,
  uploadForGeneration: (file: File) => state.upload(file),
}));

import { SIGN_IN_FOR_BIG_FILE, stageFile, stageUploads, UPLOAD_FAILED } from "./stage-uploads";

const MB = 1024 * 1024;
const pptx = (name: string, mb: number) => new File([new Uint8Array(mb * MB)], name);
const input = (files: File[]) => ({ inputType: "file" as const, file: null, files, text: "", youtubeUrl: "", topic: "თემა", cardCount: 10 });

describe("a file on its way to a generator", () => {
  beforeEach(() => {
    state.connected = true;
    state.upload.mockReset();
  });

  it("signed in, five 5 to 15 MB PPTX: only paths go in the request", async () => {
    state.upload.mockImplementation(async (file) => `u1/uploads/${file.name}`);
    const data = await stageUploads(input([5, 8, 10, 12, 15].map((mb, index) => pptx(`l${index}.pptx`, mb))));
    expect(data.files?.every(isStoredFile)).toBe(true);
    const form = buildGenerationFormData(data);
    expect(form.getAll("files")).toEqual([]);
    expect(form.getAll("storagePaths")).toHaveLength(5);
  });

  it("signed in, the upload failing: even a small file isn't sent, the reason shows", async () => {
    state.upload.mockResolvedValue(null);
    await expect(stageFile(new File(["abc"], "a.txt"))).rejects.toThrow(UPLOAD_FAILED);
  });

  it("signed out: small files only while they fit in one request together", async () => {
    state.connected = false;
    const small = pptx("a.pptx", 3);
    expect((await stageUploads(input([small]))).files?.[0]).toBe(small);
    await expect(stageUploads(input([pptx("a.pptx", 3), pptx("b.pptx", 3)]))).rejects.toThrow(SIGN_IN_FOR_BIG_FILE);
  });
});
