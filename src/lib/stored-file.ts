/**
 * A file that's in the account's storage, standing in for its contents in
 * the browser: the tools list it (name, size, type) like any `File`, but it
 * holds no bytes. What's sent to the server is its path; the server reads
 * the file from storage itself (lib/stored-files-server), so nothing large
 * passes through a request (Vercel takes 4.5 MB).
 */
export class StoredFile extends File {
  readonly storagePath: string;

  constructor(name: string, size: number, type: string, storagePath: string) {
    super([], name, { type });
    this.storagePath = storagePath;
    // The real file's size, for the lists; this object itself is empty.
    Object.defineProperty(this, "size", { value: size });
  }
}

export function isStoredFile(file: unknown): file is StoredFile {
  return file instanceof StoredFile;
}

/** Field names the server reads stored files from (parallel lists). */
export const STORED_PATHS = "storagePaths";
export const STORED_NAMES = "storageNames";
export const STORED_TYPES = "storageTypes";
/** Which form field each one stands for: „file“ or „files“. */
export const STORED_FIELDS = "storageFields";

/** Puts a file on the form: a stored one as its path, any other as itself. */
export function appendFile(form: FormData, field: string, file: File): void {
  if (isStoredFile(file)) {
    form.append(STORED_PATHS, file.storagePath);
    form.append(STORED_NAMES, file.name);
    form.append(STORED_TYPES, file.type);
    form.append(STORED_FIELDS, field);
  } else {
    form.append(field, file, file.name);
  }
}
