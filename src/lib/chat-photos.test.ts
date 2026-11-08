import { describe, expect, it } from "vitest";
import {
  CHAT_PHOTO_MAX_BYTES,
  CHAT_PHOTO_TOO_BIG,
  CHAT_PHOTO_TOO_MANY,
  CHAT_PHOTO_UNREADABLE,
  chatMessageCost,
  fitWithin,
  isAcceptedPhoto,
  pickPhotos,
} from "./chat-photos";
import { bucketFor, chatPhotoPath, isOwnChatPhoto } from "./user-files-path";
import { modelReadsImages } from "./ai/vision-models";
import { conversationTitleFrom } from "./ai-teacher-history";

const file = (name: string, type: string, size = 1000) => ({ name, type, size });

describe("chat photos", () => {
  it("takes JPG, PNG, WEBP and HEIC (also a HEIC with no type), nothing else", () => {
    expect(isAcceptedPhoto(file("a.jpg", "image/jpeg"))).toBe(true);
    expect(isAcceptedPhoto(file("a.webp", "image/webp"))).toBe(true);
    expect(isAcceptedPhoto(file("IMG_1.HEIC", ""))).toBe(true);
    expect(isAcceptedPhoto(file("IMG_1.heic", "image/heic"))).toBe(true);
    expect(isAcceptedPhoto(file("a.gif", "image/gif"))).toBe(false);
    expect(isAcceptedPhoto(file("a.pdf", "application/pdf"))).toBe(false);
  });

  it("at most 4 in a message, 10 MB each: the rest is refused with why", () => {
    const five = Array.from({ length: 5 }, (_, i) => file(`${i}.jpg`, "image/jpeg"));
    expect(pickPhotos(five, 0)).toEqual({ accepted: five.slice(0, 4), error: CHAT_PHOTO_TOO_MANY });
    expect(pickPhotos(five.slice(0, 2), 3)).toEqual({ accepted: five.slice(0, 1), error: CHAT_PHOTO_TOO_MANY });
    expect(pickPhotos([file("big.jpg", "image/jpeg", CHAT_PHOTO_MAX_BYTES + 1), five[0]], 0)).toEqual({ accepted: [five[0]], error: CHAT_PHOTO_TOO_BIG });
    expect(pickPhotos([file("a.pdf", "application/pdf")], 0)).toEqual({ accepted: [], error: CHAT_PHOTO_UNREADABLE });
    const eightMb = Array.from({ length: 4 }, (_, i) => file(`${i}.jpg`, "image/jpeg", 8 * 1024 * 1024));
    expect(pickPhotos(eightMb, 0)).toEqual({ accepted: eightMb, error: null });
  });

  it("made small: the long side at most 1600px, never enlarged", () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1200, height: 1600 });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it("a message with photos costs one message (for now)", () => {
    expect(chatMessageCost({ images: 4 })).toBe(1);
    expect(chatMessageCost({ images: 0 })).toBe(1);
  });

  it("photos live in the student's chat folder, in the user-files bucket", () => {
    const path = chatPhotoPath("u1", "conv-1", "a1.jpg");
    expect(path).toBe("u1/chat/conv-1/a1.jpg");
    expect(bucketFor(path)).toBe("user-files");
    expect(isOwnChatPhoto(path, "u1")).toBe(true);
    expect(isOwnChatPhoto(path, "u2")).toBe(false);
    expect(isOwnChatPhoto("u1/uploads/a.jpg", "u1")).toBe(false);
    expect(isOwnChatPhoto("u1/chat/../u2/a.jpg", "u1")).toBe(false);
  });

  it("only models that read images get a photo", () => {
    expect(modelReadsImages("gemini", "gemini-3.5-flash")).toBe(true);
    expect(modelReadsImages("openai", "gpt-4o-mini")).toBe(true);
    expect(modelReadsImages("openai", "o3-mini")).toBe(false);
    expect(modelReadsImages("anthropic", "claude-haiku-4-5-20251001")).toBe(true);
    expect(modelReadsImages("anthropic", "claude-3-5-haiku-20241022")).toBe(false);
  });

  it("a chat begun with a photo alone is titled „ფოტო“", () => {
    expect(conversationTitleFrom([{ id: "1", role: "user", content: "", images: [{ path: "u1/chat/c/a.jpg" }] }])).toBe("ფოტო");
  });
});
