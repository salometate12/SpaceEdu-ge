/**
 * Before a generator's request: each file the student dropped in goes to the
 * account's storage first (lib/user-files uploadForGeneration), so the
 * request carries its path, not its bytes, and a 20 MB file works too.
 * Signed in, a file goes through storage or not at all, with the reason.
 * Signed out there's no storage: only what fits in one request in all goes.
 */
import type { UploadedData } from "./generation-input";
import { isStoredFile, StoredFile } from "./stored-file";
import { isUserFilesConnected, uploadForGeneration } from "./user-files";

/** What one request may carry on Vercel (4.5 MB), less room for the rest of the form. */
export const DIRECT_SEND_MAX_BYTES = 4 * 1024 * 1024;
export const SIGN_IN_FOR_BIG_FILE = "ფაილი 4 MB-ზე დიდია. ასეთი ფაილისთვის შედი ანგარიშზე, ან ატვირთე უფრო მცირე.";
export const UPLOAD_FAILED = "ფაილი ვერ აიტვირთა. შეამოწმე ინტერნეტი და სცადე თავიდან.";

/** One file ready to send: in storage (a StoredFile), or small enough to go as it is. */
export async function stageFile(file: File): Promise<File> {
  if (isStoredFile(file)) return file;
  if (isUserFilesConnected()) {
    const path = await uploadForGeneration(file);
    if (path) return new StoredFile(file.name, file.size, file.type, path);
    throw new Error(UPLOAD_FAILED);
  }
  if (file.size <= DIRECT_SEND_MAX_BYTES) return file;
  throw new Error(SIGN_IN_FOR_BIG_FILE);
}

/** The generator's input with every dropped file staged. */
export async function stageUploads(data: UploadedData): Promise<UploadedData> {
  const file = data.file ? await stageFile(data.file) : data.file;
  const files = data.files ? await Promise.all(data.files.map(stageFile)) : data.files;
  // Signed out, several small files still have to fit in one request together.
  const direct = [...(file ? [file] : []), ...(files ?? [])].filter((item) => !isStoredFile(item));
  if (direct.reduce((sum, item) => sum + item.size, 0) > DIRECT_SEND_MAX_BYTES) throw new Error(SIGN_IN_FOR_BIG_FILE);
  return { ...data, file, ...(files ? { files } : {}) };
}
