import { describe, expect, it } from "vitest";
import {
  AVATAR_ERRORS,
  AVATAR_MAX_BYTES,
  avatarFileProblem,
  avatarPath,
  avatarUrlFromMetadata,
  centerSquare,
  customAvatarUrl,
} from "./avatar";

const file = (type: string, size: number) => ({ type, size });

describe("avatarFileProblem", () => {
  it("accepts JPG, PNG and WEBP up to 5 MB", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) expect(avatarFileProblem(file(type, 1000))).toBeNull();
    expect(avatarFileProblem(file("image/png", AVATAR_MAX_BYTES))).toBeNull();
  });

  it("rejects a 6 MB file and other formats", () => {
    expect(avatarFileProblem(file("image/jpeg", 6 * 1024 * 1024))).toBe(AVATAR_ERRORS.tooBig);
    expect(avatarFileProblem(file("image/gif", 1000))).toBe(AVATAR_ERRORS.badType);
    expect(avatarFileProblem(file("application/pdf", 1000))).toBe(AVATAR_ERRORS.badType);
  });
});

describe("centerSquare", () => {
  it("keeps the middle of wide and tall photos", () => {
    expect(centerSquare(1600, 900)).toEqual({ sx: 350, sy: 0, size: 900 });
    expect(centerSquare(600, 1000)).toEqual({ sx: 0, sy: 200, size: 600 });
    expect(centerSquare(512, 512)).toEqual({ sx: 0, sy: 0, size: 512 });
  });
});

describe("which photo to show", () => {
  const google = { avatar_url: "https://lh3.googleusercontent.com/a", picture: "https://lh3.googleusercontent.com/a" };

  it("prefers the uploaded photo over Google's", () => {
    expect(avatarUrlFromMetadata({ ...google, custom_avatar_url: "https://x.supabase.co/storage/v1/object/public/avatars/u/a.webp" })).toContain("avatars/u/a.webp");
  });

  it("falls back to Google's photo, then to none (initials)", () => {
    expect(avatarUrlFromMetadata({ ...google, custom_avatar_url: null })).toBe(google.avatar_url);
    expect(avatarUrlFromMetadata({})).toBeNull();
    expect(avatarUrlFromMetadata(null)).toBeNull();
  });

  it("only counts https photos as the user's own", () => {
    expect(customAvatarUrl({ custom_avatar_url: "javascript:alert(1)" })).toBeNull();
  });

  it("puts each user's file in their own folder", () => {
    expect(avatarPath("user-1", "webp", 42)).toBe("user-1/avatar-42.webp");
  });
});
