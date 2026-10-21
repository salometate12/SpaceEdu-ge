import { cvFileName } from "@/lib/cv-data";
import type { CvPdfProps } from "./CvPdfDocument";

/** The PDF only reads JPEG/PNG: any photo (WEBP, HEIC shown by the browser…) becomes a JPEG. */
async function toJpeg(dataUrl: string): Promise<string> {
  if (/^data:image\/(jpe?g|png);/i.test(dataUrl)) return dataUrl;
  const image = new window.Image();
  image.src = dataUrl;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  canvas.getContext("2d")?.drawImage(image, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.9);
}

/**
 * Builds the text PDF and downloads it as CV_<სახელი>_<გვარი>.pdf. The PDF
 * library and the fonts load only when this runs (not with the page).
 */
export async function downloadCvPdf(props: CvPdfProps): Promise<void> {
  const [{ pdf }, { CvPdfDocument, registerCvFonts }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./CvPdfDocument"),
  ]);
  registerCvFonts(window.location.origin);
  const data = props.photo && props.data.photo ? { ...props.data, photo: await toJpeg(props.data.photo) } : props.data;
  const blob = await pdf(<CvPdfDocument {...props} data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = cvFileName(props.data.fullName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
