/**
 * Where a student's file lives in Supabase Storage: every new upload in the
 * private `user-files` bucket (<user_id>/documents/…, <user_id>/subjects/… or
 * <user_id>/uploads/… for a file dropped into a generator; migration 007); subject files from before that stay in `subject-files`
 * (migration 006), <user_id>/<subject_id>/<file_id>. Both only ever inside
 * the student's own folder.
 */
export const USER_FILES_BUCKET = "user-files";
export const LEGACY_SUBJECT_FILES_BUCKET = "subject-files";

export function bucketFor(path: string): string {
  const area = path.split("/")[1];
  return area === "documents" || area === "subjects" || area === "uploads" || area === "chat" ? USER_FILES_BUCKET : LEGACY_SUBJECT_FILES_BUCKET;
}

/** Only the student's own folder may be read (the bucket's RLS says the same). */
export function isOwnPath(path: string, userId: string): boolean {
  return path.startsWith(`${userId}/`) && !path.includes("..");
}

export const documentPath = (userId: string, id: string) => `${userId}/documents/${id}`;
export const subjectFilePath = (userId: string, subjectId: string, id: string) => `${userId}/subjects/${subjectId}/${id}`;
/** A photo sent to the AI teacher: one folder per conversation (deleted with it), kept while the chat is. */
export const chatFolder = (userId: string, conversationId: string) => `${userId}/chat/${conversationId}`;
export const chatPhotoPath = (userId: string, conversationId: string, id: string) => `${chatFolder(userId, conversationId)}/${id}`;

/** One of the student's own chat photos: only those may go to the AI teacher. */
export function isOwnChatPhoto(path: string, userId: string): boolean {
  return isOwnPath(path, userId) && /^[^/]+\/chat\/[\w-]{1,120}\/[\w.-]{1,160}$/.test(path);
}

/** A file dropped into a generator (flashcards, conspectus, quiz), read from there by the server. */
export const uploadPath = (userId: string, id: string) => `${userId}/uploads/${id}`;
