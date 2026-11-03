/**
 * The account's file storage in the browser (lib/user-files-path): signed
 * in, uploads, downloads and removals in the student's own folder. The
 * dashboard's documents and „ჩემი საგნები“ use it; each keeps its own copy
 * of the files in IndexedDB as a cache.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { bucketFor, documentPath, subjectFilePath, USER_FILES_BUCKET } from "./user-files-path";
import { AI_TOO_LARGE_MESSAGE } from "./ai/ai-messages";

let remote: { client: SupabaseClient; userId: string } | null = null;
const listeners = new Set<() => void>();

/** Signed in (UserDataSync): files can reach the account; whoever waits on that is told. */
export function connectUserFiles(client: SupabaseClient, userId: string): void {
  remote = { client, userId };
  listeners.forEach((listener) => listener());
}

export function disconnectUserFiles(): void {
  remote = null;
}

/** Called on each sign-in (to send what was kept on this device meanwhile). */
export function onUserFilesConnected(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const isUserFilesConnected = () => remote !== null;

export const pathForDocument = (id: string) => (remote ? documentPath(remote.userId, id) : null);
export const pathForSubjectFile = (subjectId: string, id: string) => (remote ? subjectFilePath(remote.userId, subjectId, id) : null);

/** Uploads to the given path; the path back, or null (signed out, failed). */
export async function uploadUserFile(path: string | null, blob: Blob, contentType: string): Promise<string | null> {
  if (!remote || !path) return null;
  const { error } = await remote.client.storage.from(USER_FILES_BUCKET).upload(path, blob, { upsert: true, contentType: contentType || "application/octet-stream" });
  return error ? null : path;
}

/** A file dropped into a generator: too big for the bucket (20 MB). */
export class UploadTooLargeError extends Error {
  constructor(message = AI_TOO_LARGE_MESSAGE) {
    super(message);
  }
}

/** Uploads older than this are removed on the next upload. */
const UPLOAD_KEEP_MS = 24 * 60 * 60 * 1000;

/** Yesterday's generator uploads (each was read once by the server): gone, quietly. */
async function clearOldUploads(): Promise<void> {
  if (!remote) return;
  const folder = `${remote.userId}/uploads`;
  const { data } = await remote.client.storage.from(USER_FILES_BUCKET).list(folder, { limit: 100 });
  const cutoff = Date.now() - UPLOAD_KEEP_MS;
  const old = (data ?? []).filter((item) => item.created_at && Date.parse(item.created_at) < cutoff).map((item) => `${folder}/${item.name}`);
  if (old.length) await remote.client.storage.from(USER_FILES_BUCKET).remove(old);
}

/**
 * A file dropped into a generator goes straight to storage with a signed
 * upload URL (/api/uploads/sign picks the path in the student's folder), so
 * the request to the generator carries only its path. Null when signed out
 * or the upload failed; UploadTooLargeError over 20 MB.
 */
export async function uploadForGeneration(file: File): Promise<string | null> {
  if (!remote) return null;
  const client = remote.client;
  void clearOldUploads().catch(() => undefined);
  const response = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, size: file.size }),
  });
  if (response.status === 413) throw new UploadTooLargeError();
  if (!response.ok) return null;
  const { path, token } = (await response.json()) as { path?: string; token?: string };
  if (!path || !token) return null;
  const { error } = await client.storage.from(USER_FILES_BUCKET).uploadToSignedUrl(path, token, file, { contentType: file.type || "application/octet-stream" });
  return error ? null : path;
}

export async function downloadUserFile(path: string): Promise<Blob | null> {
  if (!remote) return null;
  const { data, error } = await remote.client.storage.from(bucketFor(path)).download(path);
  return error || !data ? null : data;
}

export async function removeUserFile(path: string): Promise<void> {
  if (!remote) return;
  await remote.client.storage.from(bucketFor(path)).remove([path]);
}
