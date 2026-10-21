/**
 * Browser side of profile photos: square crop, resize, compress, upload to
 * Supabase Storage, and point the account at it.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AVATAR_BUCKET,
  AVATAR_CHANGED_EVENT,
  AVATAR_SIZE,
  avatarPath,
  centerSquare,
} from "@/lib/avatar";

/** Crops the centre square, scales it to 512×512 and encodes WEBP (JPEG 0.85 where WEBP isn't supported). */
export async function processAvatarImage(file: File): Promise<{ blob: Blob; extension: "webp" | "jpg" }> {
  const bitmap = await createImageBitmap(file);
  const { sx, sy, size } = centerSquare(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas unavailable");
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, sx, sy, size, size, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  bitmap.close();
  const encode = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  const webp = await encode("image/webp", 0.85);
  if (webp && webp.type === "image/webp") return { blob: webp, extension: "webp" };
  const jpeg = await encode("image/jpeg", 0.85);
  if (!jpeg) throw new Error("encode failed");
  return { blob: jpeg, extension: "jpg" };
}

export function announceAvatarChange() {
  window.dispatchEvent(new Event(AVATAR_CHANGED_EVENT));
}

/** Uploads the photo, points the account at it and removes the previous upload. Returns the public URL. */
export async function uploadAvatar(supabase: SupabaseClient, file: File): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) throw new Error("not signed in");
  const previousPath = (user.user_metadata as Record<string, unknown> | undefined)?.custom_avatar_path;

  const { blob, extension } = await processAvatarImage(file);
  const path = avatarPath(user.id, extension);
  const storage = supabase.storage.from(AVATAR_BUCKET);
  const { error: uploadError } = await storage.upload(path, blob, {
    contentType: extension === "webp" ? "image/webp" : "image/jpeg",
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const url = storage.getPublicUrl(path).data.publicUrl;
  const { error: updateError } = await supabase.auth.updateUser({
    data: { custom_avatar_url: url, custom_avatar_path: path },
  });
  if (updateError) {
    await storage.remove([path]);
    throw updateError;
  }
  if (typeof previousPath === "string" && previousPath && previousPath !== path) {
    await storage.remove([previousPath]); // best effort; a leftover file is harmless
  }
  announceAvatarChange();
  return url;
}

/** Deletes the uploaded photo; the account falls back to Google's photo or initials. */
export async function removeAvatar(supabase: SupabaseClient): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) throw new Error("not signed in");
  const path = (user.user_metadata as Record<string, unknown> | undefined)?.custom_avatar_path;
  const { error } = await supabase.auth.updateUser({ data: { custom_avatar_url: null, custom_avatar_path: null } });
  if (error) throw error;
  if (typeof path === "string" && path) await supabase.storage.from(AVATAR_BUCKET).remove([path]);
  announceAvatarChange();
}
