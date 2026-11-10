/**
 * Photos sent to the AI teacher (a notebook problem, the board, a slide, a
 * graph, a textbook page): the limits, the messages, and making a photo
 * small in the browser before it goes up (the long side 1600px, JPEG 0.85,
 * usually 300–600 KB). The photo goes to the student's storage
 * (<user_id>/chat/<conversation>/…); a request carries only its path.
 */

/** A photo of a message: where it is in storage, and its size for the layout. */
export interface ChatImage {
  path: string;
  width?: number;
  height?: number;
}

export const CHAT_PHOTO_MAX = 4;
export const CHAT_PHOTO_MAX_BYTES = 10 * 1024 * 1024;
/** Photos of the last two questions go with a follow-up; older ones don't (they'd only cost more). */
export const CHAT_PHOTO_CONTEXT_MESSAGES = 2;

const LONG_SIDE = 1600;
const JPEG_QUALITY = 0.85;

export const CHAT_PHOTO_TOO_MANY = "მაქსიმუმ 4 ფოტო";
export const CHAT_PHOTO_TOO_BIG = "ფოტო 10 MB-ზე დიდია";
export const CHAT_PHOTO_UNREADABLE = "ეს ფორმატი ვერ წავიკითხე, სცადე JPG";
export const CHAT_PHOTO_SIGNED_OUT = "ფოტოს გასაგზავნად შედი ანგარიშზე";
export const CHAT_PHOTO_UPLOAD_FAILED = "ფოტო ვერ აიტვირთა. შეამოწმე ინტერნეტი და სცადე თავიდან.";
export const CHAT_PHOTO_MISSING = "ფოტო ვერ ვიპოვე. მიამაგრე ისევ.";
export const CHAT_PHOTO_NO_VISION = "AI ახლა ფოტოს ვერ კითხულობს, სცადე წუთში";

/** What the AI is asked when a photo goes without a question. */
export const PHOTO_ONLY_PROMPT = "ახსენი, რა არის ამ ფოტოზე, და თუ ამოცანაა, ამომიხსენი ნაბიჯ-ნაბიჯ";

/** What a photo-only question reads as in the history and the chat's title. */
export const PHOTO_PLACEHOLDER = "[ფოტო]";

const ACCEPTED = /^image\/(jpeg|jpg|png|webp|heic|heif)$/i;
const ACCEPTED_NAME = /\.(jpe?g|png|webp|heic|heif)$/i;

/** JPG, PNG, WEBP or HEIC (by type, or by name when the browser gives none, as with HEIC). */
export function isAcceptedPhoto(file: { type: string; name: string }): boolean {
  return ACCEPTED.test(file.type) || (!file.type && ACCEPTED_NAME.test(file.name)) || (file.type === "application/octet-stream" && ACCEPTED_NAME.test(file.name));
}

/** The size that fits `max` on the long side (never larger than the photo). */
export function fitWithin(width: number, height: number, max: number = LONG_SIDE): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Which of the picked files can be added, and what to tell the student about the rest. */
export function pickPhotos<T extends { type: string; name: string; size: number }>(
  files: T[],
  already: number,
): { accepted: T[]; error: string | null } {
  let error: string | null = null;
  const accepted: T[] = [];
  for (const file of files) {
    if (!isAcceptedPhoto(file)) {
      error ??= CHAT_PHOTO_UNREADABLE;
      continue;
    }
    if (file.size > CHAT_PHOTO_MAX_BYTES) {
      error ??= CHAT_PHOTO_TOO_BIG;
      continue;
    }
    if (already + accepted.length >= CHAT_PHOTO_MAX) {
      error = CHAT_PHOTO_TOO_MANY;
      break;
    }
    accepted.push(file);
  }
  return { accepted, error };
}

/**
 * What one chat message costs. A message with photos counts as one message
 * for now; when credits exist, the price of photos is set here, once.
 */
export function chatMessageCost({ images }: { images: number }): number {
  void images;
  return 1;
}

/** Draws the photo (a HEIC too, where the browser reads it) small, as JPEG. */
export async function compressPhoto(file: Blob): Promise<{ blob: Blob; width: number; height: number }> {
  const source = await decode(file);
  try {
    const size = fitWithin(source.width, source.height);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error(CHAT_PHOTO_UNREADABLE);
    // A transparent PNG (a screenshot) on white, not black.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size.width, size.height);
    context.drawImage(source.image, 0, 0, size.width, size.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) throw new Error(CHAT_PHOTO_UNREADABLE);
    return { blob, ...size };
  } finally {
    source.close();
  }
}

/** The photo as something a canvas draws, upright (EXIF), or the unreadable-format error. */
async function decode(file: Blob): Promise<{ image: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { image: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // Safari's older versions: an <img> below reads what the bitmap couldn't (HEIC on iOS).
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    if (!image.naturalWidth) throw new Error(CHAT_PHOTO_UNREADABLE);
    return { image, width: image.naturalWidth, height: image.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error(CHAT_PHOTO_UNREADABLE);
  }
}
