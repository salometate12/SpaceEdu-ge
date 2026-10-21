/**
 * Profile photos: which photo to show, and the checks an upload must pass.
 * Pure, so the settings form, the header, the menu, the dock and the tests
 * share it.
 *
 * Our own upload lives under `custom_avatar_url` / `custom_avatar_path`,
 * not `avatar_url`: Supabase rewrites `avatar_url` and `picture` from Google
 * on every Google sign-in, which would silently drop an uploaded photo.
 */

export const AVATAR_BUCKET = "avatars";
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_SIZE = 512;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const AVATAR_ACCEPT = AVATAR_TYPES.join(",");

export const AVATAR_ERRORS = {
  tooBig: "ფაილი 5 MB-ზე დიდია",
  badType: "ატვირთე JPG, PNG ან WEBP ფოტო",
  failed: "ფოტო ვერ აიტვირთა. სცადე ხელახლა.",
  deleteFailed: "ფოტო ვერ წაიშალა. სცადე ხელახლა.",
} as const;

/** Window event fired after the photo changes, so every avatar refreshes. */
export const AVATAR_CHANGED_EVENT = "spaceedu:avatar-changed";

type Meta = Record<string, unknown> | null | undefined;

const httpsUrl = (value: unknown): value is string => typeof value === "string" && /^https:\/\//.test(value);

/** The user's own uploaded photo, if any. */
export function customAvatarUrl(meta: Meta): string | null {
  const value = meta?.custom_avatar_url;
  return httpsUrl(value) ? value : null;
}

/** The sign-in provider's photo (Google), if any. */
export function providerAvatarUrl(meta: Meta): string | null {
  const value = [meta?.avatar_url, meta?.picture].find(httpsUrl);
  return value ?? null;
}

/** What to show: own photo, else Google's, else null (initials). */
export function avatarUrlFromMetadata(meta: Meta): string | null {
  return customAvatarUrl(meta) ?? providerAvatarUrl(meta);
}

/** Why a file can't be used as a profile photo, or null if it can. */
export function avatarFileProblem(file: Pick<File, "type" | "size">): string | null {
  if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) return AVATAR_ERRORS.badType;
  if (file.size > AVATAR_MAX_BYTES) return AVATAR_ERRORS.tooBig;
  return null;
}

/** The centred square of a width×height image (what the avatar keeps). */
export function centerSquare(width: number, height: number): { sx: number; sy: number; size: number } {
  const size = Math.min(width, height);
  return { sx: Math.round((width - size) / 2), sy: Math.round((height - size) / 2), size };
}

/** Storage path: one folder per user (the RLS policy checks it). */
export function avatarPath(userId: string, extension: "webp" | "jpg", now = Date.now()): string {
  return `${userId}/avatar-${now}.${extension}`;
}
