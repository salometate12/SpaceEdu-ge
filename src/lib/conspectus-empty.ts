/**
 * A conspectus from material with no text in it (a PPTX whose slides are
 * pictures, an empty document) is never made: the server stops before the
 * AI when the files hold too little text, and the AI answers only
 * `[[NO_CONTENT]]` when what it got isn't enough. Neither is saved. Shared by
 * /api/generate-summary, the generating page and „ჩემი მასალები“.
 */

/** Less text than this (all files together, or one file of several) is no material. */
export const MIN_SOURCE_TEXT = 200;

/** What the AI returns instead of a conspectus when the material is empty. */
export const NO_CONTENT_MARKER = "[[NO_CONTENT]]";

/** The error code /api/generate-summary answers with (status 400). */
export const NO_TEXT_CODE = "NO_TEXT";

/** The names of files left out for having no text, on a conspectus that was made. */
export const SKIPPED_FILES_HEADER = "X-Skipped-Files";

export function encodeSkippedFiles(names: string[]): string {
  return encodeURIComponent(JSON.stringify(names));
}

export function decodeSkippedFiles(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value));
    return Array.isArray(parsed) ? parsed.filter((name): name is string => typeof name === "string") : [];
  } catch {
    return [];
  }
}

const unescape = (text: string) => text.replace(/\\/g, "");

/** The AI said the material was empty (markdown escaping aside). */
export function isNoContentAnswer(text: string): boolean {
  return unescape(text).includes(NO_CONTENT_MARKER);
}

/** The answer so far could still turn out to be the marker: nothing is shown yet. */
export function mightBeNoContent(partial: string): boolean {
  const start = unescape(partial).trim();
  return start.length > 0 && NO_CONTENT_MARKER.startsWith(start.slice(0, NO_CONTENT_MARKER.length));
}

/**
 * A conspectus saved before this check that is really a letter about the
 * material („მოგესალმებით… სლაიდები ცარიელია… მომაწოდოთ“): short, and
 * written to the student instead of about the subject.
 */
export function isLetterConspectus(content: string): boolean {
  const text = content.trim();
  if (isNoContentAnswer(text)) return true;
  if (text.length > 900) return false;
  return /მოგესალმებით|მომაწოდოთ|მომაწოდეთ|გამომიგზავნოთ|სლაიდები ცარიელ/.test(text);
}

/** A file's name without its extension, for „„…“-ში ტექსტი ვერ ვიპოვე“. */
export function fileTitle(name: string): string {
  return name.replace(/\.[a-z0-9]{1,5}$/i, "").trim() || name;
}

/** „„ლექცია 3“-ში ტექსტი ვერ ვიპოვე“, or with „და კიდევ {n} ფაილში“. */
export function noTextHeadline(names: string[]): string {
  if (names.length === 0) return "მასალაში ტექსტი ვერ ვიპოვე";
  const first = `„${fileTitle(names[0])}“`;
  return names.length === 1 ? `${first}-ში ტექსტი ვერ ვიპოვე` : `${first}-ში და კიდევ ${names.length - 1} ფაილში ტექსტი ვერ ვიპოვე`;
}

/** Why, and what to try: slides (PPTX) have their own reason. */
export function noTextAdvice(names: string[]): string {
  const slides = names.length > 0 && names.every((name) => /\.(pptx?|key|odp)$/i.test(name));
  const why = slides ? "სლაიდებზე ტექსტი სურათადაა ჩასმული." : "ფაილში ტექსტი სურათადაა ან ცარიელია.";
  const tryNext = slides ? "სცადე იგივე ლექცია PDF-ად, ან ჩასვი ტექსტი ხელით." : "სცადე სხვა ფაილი, ან ჩასვი ტექსტი ხელით.";
  return `${why} ${tryNext} კრედიტი არ დახარჯულა.`;
}

/** „1 ფაილი გამოტოვებულია: ტექსტი ვერ ვიპოვე“ */
export function skippedFilesLabel(count: number): string {
  return `${count} ფაილი გამოტოვებულია: ტექსტი ვერ ვიპოვე`;
}
