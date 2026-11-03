import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({
  user: "u1" as string | null,
  files: new Map<string, Blob>(),
  buckets: [] as string[],
}));
vi.mock("@/utils/supabase/env", () => ({ isSupabaseBrowserConfigured: () => true }));
vi.mock("@/utils/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: storage.user ? { id: storage.user } : null } }) },
    storage: {
      from: (bucket: string) => ({
        download: async (path: string) => {
          storage.buckets.push(bucket);
          const blob = storage.files.get(path);
          return blob ? { data: blob, error: null } : { data: null, error: { message: "not found" } };
        },
      }),
    },
  }),
}));

import { attachStoredFiles, STORED_FILE_MISSING, STORED_FILE_SIGNED_OUT, STORED_FILE_TOO_BIG } from "./stored-files-server";
import { appendFile, StoredFile } from "./stored-file";

const form = (...paths: [string, string][]) => {
  const data = new FormData();
  for (const [path, field] of paths) appendFile(data, field, new StoredFile(path.split("/").pop()!, 3, "text/plain", path));
  return data;
};

describe("the server reads stored files", () => {
  beforeEach(() => {
    storage.user = "u1";
    storage.files = new Map([
      ["u1/subjects/s1/a.txt", new Blob(["ერთი"])],
      ["u1/uploads/b.txt", new Blob(["ორი"])],
      ["u2/subjects/s1/c.txt", new Blob(["სხვისი"])],
    ]);
    storage.buckets = [];
  });

  it("puts each on the form as the file it stands for, from the right bucket", async () => {
    const data = form(["u1/subjects/s1/a.txt", "files"], ["u1/uploads/b.txt", "files"]);
    await attachStoredFiles(data);
    const files = data.getAll("files") as File[];
    expect(await Promise.all(files.map((file) => file.text()))).toEqual(["ერთი", "ორი"]);
    expect(storage.buckets).toEqual(["user-files", "user-files"]);
    expect(data.has("storagePaths")).toBe(false);
  });

  it("only the student's own folder, and only signed in", async () => {
    await expect(attachStoredFiles(form(["u2/subjects/s1/c.txt", "file"]))).rejects.toThrow(STORED_FILE_MISSING);
    storage.user = null;
    await expect(attachStoredFiles(form(["u1/subjects/s1/a.txt", "file"]))).rejects.toThrow(STORED_FILE_SIGNED_OUT);
  });

  it("a missing file or one over 20 MB says so", async () => {
    await expect(attachStoredFiles(form(["u1/uploads/gone.txt", "file"]))).rejects.toThrow(STORED_FILE_MISSING);
    storage.files.set("u1/uploads/big.pdf", new Blob([new Uint8Array(21 * 1024 * 1024)]));
    await expect(attachStoredFiles(form(["u1/uploads/big.pdf", "file"]))).rejects.toThrow(STORED_FILE_TOO_BIG);
  });

  it("a form without stored files is left as it is", async () => {
    const data = new FormData();
    data.append("text", "x");
    await attachStoredFiles(data);
    expect([...data.keys()]).toEqual(["text"]);
  });
});
