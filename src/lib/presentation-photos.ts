/**
 * Photos for the presentation wizard. Everything happens in the browser:
 * the files are resized and compressed here and never sent to the server —
 * only their id, caption, name and orientation go to the AI.
 */

export interface UploadedPhoto {
  id: string;
  /** Resized, compressed image as a data URL. */
  dataUrl: string;
  width: number;
  height: number;
  name: string;
  caption: string;
}

export type PhotoOrientation = "landscape" | "portrait" | "square";

/** What the AI is told about a photo. */
export interface PhotoMeta {
  id: string;
  caption: string;
  name: string;
  orientation: PhotoOrientation;
}

export const MAX_PHOTOS = 10;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
/** Longest side after resizing. */
export const MAX_PHOTO_SIDE = 1600;
export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PHOTO_ACCEPT_ATTR = ACCEPTED_PHOTO_TYPES.join(",");

export function photoOrientation(width: number, height: number): PhotoOrientation {
  if (!width || !height) return "landscape";
  const ratio = width / height;
  if (ratio > 1.1) return "landscape";
  if (ratio < 0.9) return "portrait";
  return "square";
}

export function photoMeta(photo: UploadedPhoto): PhotoMeta {
  return {
    id: photo.id,
    caption: photo.caption.trim(),
    name: photo.name,
    orientation: photoOrientation(photo.width, photo.height),
  };
}

const HEIC_PATTERN = /\.(heic|heif)$/i;

/**
 * Why a file can't be used, in Georgian, or null if it can. Checked before
 * decoding, so a 40 MB file is rejected without being read.
 */
export function photoFileProblem(file: Pick<File, "name" | "type" | "size">): string | null {
  if (HEIC_PATTERN.test(file.name) || /hei[cf]/i.test(file.type)) {
    return `„${file.name}“: HEIC ფორმატი არ არის მხარდაჭერილი. შეინახე JPG-ად (iPhone: პარამეტრები → კამერა → ფორმატები → „ყველაზე თავსებადი“).`;
  }
  if (!(ACCEPTED_PHOTO_TYPES as readonly string[]).includes(file.type)) {
    return `„${file.name}“: მხოლოდ JPG, PNG ან WEBP ფოტოა დაშვებული.`;
  }
  if (file.size > MAX_PHOTO_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `„${file.name}“: ფაილი ძალიან დიდია (${mb} MB). მაქსიმუმი 10 MB-ია.`;
  }
  return null;
}

export interface PhotoBatchResult {
  accepted: File[];
  errors: string[];
}

/** Splits picked files into usable ones and readable errors, honouring
 * the 10-photo limit across what's already uploaded. */
export function checkPhotoBatch(files: File[], alreadyUploaded: number): PhotoBatchResult {
  const accepted: File[] = [];
  const errors: string[] = [];
  for (const file of files) {
    const problem = photoFileProblem(file);
    if (problem) {
      errors.push(problem);
      continue;
    }
    if (alreadyUploaded + accepted.length >= MAX_PHOTOS) {
      errors.push(`„${file.name}“: მაქსიმუმ ${MAX_PHOTOS} ფოტოს ატვირთვა შეიძლება.`);
      continue;
    }
    accepted.push(file);
  }
  return { accepted, errors };
}

/** Decodes with the EXIF orientation applied, so an upright iPhone photo
 * stays upright. */
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Fall through to <img>, which also honours EXIF in current browsers.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function hasTransparency(context: CanvasRenderingContext2D, width: number, height: number): boolean {
  const { data } = context.getImageData(0, 0, width, height);
  for (let i = 3; i < data.length; i += 16) {
    if (data[i] < 255) return true;
  }
  return false;
}

function newPhotoId(): string {
  return `photo-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

/** Resizes the long side to ≤1600 px and re-encodes: JPEG 0.85, or PNG
 * when a PNG actually uses transparency. */
export async function processPhotoFile(file: File): Promise<UploadedPhoto> {
  const source = await decode(file);
  const sourceW = "naturalWidth" in source ? source.naturalWidth : source.width;
  const sourceH = "naturalHeight" in source ? source.naturalHeight : source.height;
  const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(sourceW, sourceH));
  const width = Math.max(1, Math.round(sourceW * scale));
  const height = Math.max(1, Math.round(sourceH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error(`„${file.name}“: ფოტოს დამუშავება ვერ მოხერხდა.`);
  context.drawImage(source, 0, 0, width, height);
  if ("close" in source) source.close();

  const keepPng = file.type === "image/png" && hasTransparency(context, width, height);
  const dataUrl = keepPng ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.85);

  return {
    id: newPhotoId(),
    dataUrl,
    width,
    height,
    name: file.name.replace(/\.[a-z0-9]+$/i, ""),
    caption: "",
  };
}

/** Processes a batch, collecting per-file errors instead of throwing. */
export async function processPhotoFiles(
  files: File[],
  alreadyUploaded: number,
): Promise<{ photos: UploadedPhoto[]; errors: string[] }> {
  const { accepted, errors } = checkPhotoBatch(files, alreadyUploaded);
  const photos: UploadedPhoto[] = [];
  for (const file of accepted) {
    try {
      photos.push(await processPhotoFile(file));
    } catch {
      errors.push(`„${file.name}“: ფოტოს წაკითხვა ვერ მოხერხდა. სცადე სხვა ფაილი.`);
    }
  }
  return { photos, errors };
}
