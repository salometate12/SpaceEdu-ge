/**
 * The server side of the AI teacher's photos: a question names its photos by
 * storage path; they're read here with the student's own session (storage
 * RLS), only from their own chat folders, and handed to the model as images.
 */
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { CHAT_PHOTO_MAX_BYTES, CHAT_PHOTO_MISSING, CHAT_PHOTO_SIGNED_OUT } from "@/lib/chat-photos";
import { isOwnChatPhoto, USER_FILES_BUCKET } from "@/lib/user-files-path";

/** The current question's photos and the previous question's: at most 4 each. */
export const CHAT_PHOTOS_PER_REQUEST = 8;

export class ChatPhotoError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export interface LoadedPhoto {
  data: Uint8Array;
  mediaType: string;
}

const IMAGE_TYPE = /^image\/(jpeg|png|webp|gif)$/;

/** Each path's photo, read from storage. Throws ChatPhotoError (signed out, not theirs, gone). */
export async function loadChatPhotos(paths: string[]): Promise<Map<string, LoadedPhoto>> {
  const unique = [...new Set(paths)];
  const photos = new Map<string, LoadedPhoto>();
  if (unique.length === 0) return photos;
  if (unique.length > CHAT_PHOTOS_PER_REQUEST) throw new ChatPhotoError("მაქსიმუმ 4 ფოტო", 400);
  if (!isSupabaseBrowserConfigured()) throw new ChatPhotoError(CHAT_PHOTO_SIGNED_OUT, 401);
  const supabase = await createServerSupabaseClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new ChatPhotoError(CHAT_PHOTO_SIGNED_OUT, 401);

  await Promise.all(
    unique.map(async (path) => {
      if (!isOwnChatPhoto(path, userId)) throw new ChatPhotoError(CHAT_PHOTO_MISSING, 400);
      const { data, error } = await supabase.storage.from(USER_FILES_BUCKET).download(path);
      if (error || !data) throw new ChatPhotoError(CHAT_PHOTO_MISSING, 400);
      if (data.size > CHAT_PHOTO_MAX_BYTES) throw new ChatPhotoError(CHAT_PHOTO_MISSING, 400);
      photos.set(path, { data: new Uint8Array(await data.arrayBuffer()), mediaType: IMAGE_TYPE.test(data.type) ? data.type : "image/jpeg" });
    }),
  );
  return photos;
}
