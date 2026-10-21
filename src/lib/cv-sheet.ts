/**
 * The CV is an A4 sheet: laid out at a fixed width (210 mm at 96 dpi) and
 * scaled down on narrow screens, so a phone shows the same page the PDF
 * gets instead of reflowing it into a thin column. Pure, so it's tested.
 */

/** A4 at 96 dpi, in CSS pixels. */
export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

/** How much to shrink the sheet to fit `available` pixels (never enlarges). */
export function sheetScale(available: number, sheetWidth = A4_WIDTH_PX): number {
  if (!(available > 0)) return 1;
  return Math.min(1, Math.round((available / sheetWidth) * 1000) / 1000);
}
