/**
 * The CV is an A4 sheet: laid out at a fixed width (210 mm at 96 dpi) and
 * scaled down on narrow screens, so a phone shows the same page the PDF
 * gets instead of reflowing it into a thin column. Pure, so it's tested.
 */

/** A4 at 96 dpi, in CSS pixels. */
export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;
/** A4 in millimetres (jsPDF units). */
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

/** How much to shrink the sheet to fit `available` pixels (never enlarges). */
export function sheetScale(available: number, sheetWidth = A4_WIDTH_PX): number {
  if (!(available > 0)) return 1;
  return Math.min(1, Math.round((available / sheetWidth) * 1000) / 1000);
}

/**
 * Splits a rendered sheet `heightPx` tall (at `widthPx` wide) into A4 pages:
 * the source rows of each page. One page when it fits (with 2px of slack for
 * rounding), more when the content runs long.
 */
export function a4PageSlices(widthPx: number, heightPx: number): { y: number; height: number }[] {
  const pageHeight = Math.round((widthPx * A4_HEIGHT_MM) / A4_WIDTH_MM);
  if (heightPx <= pageHeight + 2) return [{ y: 0, height: heightPx }];
  const slices: { y: number; height: number }[] = [];
  for (let y = 0; y < heightPx; y += pageHeight) slices.push({ y, height: Math.min(pageHeight, heightPx - y) });
  return slices;
}
