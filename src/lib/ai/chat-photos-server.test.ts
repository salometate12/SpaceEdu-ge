import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({ user: "u1" as string | null, files: new Map<string, Blob>() }));
vi.mock("@/utils/supabase/env", () => ({ isSupabaseBrowserConfigured: () => true }));
vi.mock("@/utils/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: storage.user ? { id: storage.user } : null } }) },
    storage: {
      from: () => ({
        download: async (path: string) => {
          const blob = storage.files.get(path);
          return blob ? { data: blob, error: null } : { data: null, error: { message: "not found" } };
        },
      }),
    },
  }),
}));

import { CHAT_PHOTO_MISSING, CHAT_PHOTO_SIGNED_OUT } from "@/lib/chat-photos";
import { buildChatHistory } from "./ai-teacher-conversation";
import { AiTeacherHistorySchema, AiTeacherImagesSchema, buildAiTeacherMessages, PHOTO_CHECK, photoPathsOf } from "./ai-teacher-request";
import { loadChatPhotos } from "./chat-photos-server";

const A = "u1/chat/c1/a.jpg";
const B = "u1/chat/c1/b.jpg";

describe("the AI teacher's photos on the server", () => {
  beforeEach(() => {
    storage.user = "u1";
    storage.files = new Map([
      [A, new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" })],
      [B, new Blob([new Uint8Array([4])], { type: "image/png" })],
      ["u2/chat/c9/x.jpg", new Blob([new Uint8Array([9])], { type: "image/jpeg" })],
    ]);
  });

  it("reads the student's own chat photos", async () => {
    const photos = await loadChatPhotos([A, B, A]);
    expect([...photos.keys()]).toEqual([A, B]);
    expect(photos.get(A)).toEqual({ data: new Uint8Array([1, 2, 3]), mediaType: "image/jpeg" });
    expect(photos.get(B)?.mediaType).toBe("image/png");
  });

  it("refuses someone else's, a generator's upload, a missing one, and signed out", async () => {
    await expect(loadChatPhotos(["u2/chat/c9/x.jpg"])).rejects.toMatchObject({ message: CHAT_PHOTO_MISSING, status: 400 });
    await expect(loadChatPhotos(["u1/uploads/a.jpg"])).rejects.toMatchObject({ status: 400 });
    await expect(loadChatPhotos(["u1/chat/c1/gone.jpg"])).rejects.toMatchObject({ message: CHAT_PHOTO_MISSING });
    storage.user = null;
    await expect(loadChatPhotos([A])).rejects.toMatchObject({ message: CHAT_PHOTO_SIGNED_OUT, status: 401 });
    expect((await loadChatPhotos([])).size).toBe(0);
  });

  it("the question's photos and the previous question's go to the model as images", async () => {
    const history = buildChatHistory([
      { role: "user", content: "", images: [{ path: "u1/chat/c1/old.jpg" }] },
      { role: "assistant", content: "პირველი პასუხი" },
      { role: "user", content: "ეს ამოცანა", images: [{ path: A }] },
      { role: "assistant", content: "ამოხსნა" },
    ]);
    // Only the last earlier question keeps its photos; a photo-only one reads „[ფოტო]“.
    expect(history[0]).toEqual({ role: "user", content: "[ფოტო]" });
    expect(history[2]).toEqual({ role: "user", content: "ეს ამოცანა", images: [A] });
    expect(AiTeacherHistorySchema.safeParse(history).success).toBe(true);
    expect(AiTeacherImagesSchema.safeParse([A, B, A, B, A]).success).toBe(false);

    const paths = photoPathsOf(history, [B]);
    expect(paths).toEqual([A, B]);
    const messages = buildAiTeacherMessages(history, "Student question: მეორე ნაბიჯი ამიხსენი", [B], await loadChatPhotos(paths));
    expect(messages).toHaveLength(5);
    expect(messages[0].content).toBe("[ფოტო]");
    expect(messages[2].content).toEqual([
      { type: "image", image: new Uint8Array([1, 2, 3]), mediaType: "image/jpeg" },
      { type: "text", text: "ეს ამოცანა" },
    ]);
    // The current question's photos come with the legibility check.
    expect(messages[4].content).toEqual([
      { type: "image", image: new Uint8Array([4]), mediaType: "image/png" },
      { type: "text", text: "Student question: მეორე ნაბიჯი ამიხსენი" },
      { type: "text", text: PHOTO_CHECK },
    ]);
  });
});
