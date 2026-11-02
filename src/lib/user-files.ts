/**
 * The account's file storage in the browser (lib/user-files-path): signed
 * in, uploads, downloads and removals in the student's own folder. The
 * dashboard's documents and „ჩემი საგნები“ use it; each keeps its own copy
 * of the files in IndexedDB as a cache.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { bucketFor, documentPath, subjectFilePath, USER_FILES_BUCKET } from "./user-files-path";

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

export async function downloadUserFile(path: string): Promise<Blob | null> {
  if (!remote) return null;
  const { data, error } = await remote.client.storage.from(bucketFor(path)).download(path);
  return error || !data ? null : data;
}

export async function removeUserFile(path: string): Promise<void> {
  if (!remote) return;
  await remote.client.storage.from(bucketFor(path)).remove([path]);
}
