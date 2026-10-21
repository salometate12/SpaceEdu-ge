import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { A4_HEIGHT_MM, A4_WIDTH_MM, a4PageSlices } from "@/lib/cv-sheet";

/** Colour functions html2canvas 1.4 can't parse. */
const MODERN_COLOR = /\b(?:okl(?:ab|ch)|lab|lch|color|color-mix)\(/;

const COLOR_PROPS = [
  "color",
  "background-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "outline-color",
  "text-decoration-color",
  "column-rule-color",
] as const;

/**
 * html2canvas 1.4 can't parse the lab()/oklab()/oklch() colours Tailwind v4
 * computes, and gives up on the whole capture. In the clone it renders
 * from, every such colour becomes plain rgba(): the browser paints it into
 * one pixel and we read the pixel back. Shadows (also oklab) are dropped.
 */
function flattenModernColors(root: HTMLElement, view: Window) {
  const probe = view.document.createElement("canvas");
  probe.width = probe.height = 1;
  const context = probe.getContext("2d", { willReadFrequently: true });
  if (!context) return;
  const cache = new Map<string, string>();
  const toRgba = (value: string) => {
    let rgba = cache.get(value);
    if (!rgba) {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
      rgba = `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 1000) / 1000})`;
      cache.set(value, rgba);
    }
    return rgba;
  };
  for (const el of [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))]) {
    const style = view.getComputedStyle(el);
    for (const prop of COLOR_PROPS) {
      const value = style.getPropertyValue(prop);
      if (MODERN_COLOR.test(value)) el.style.setProperty(prop, toRgba(value));
    }
    if (MODERN_COLOR.test(style.boxShadow)) el.style.boxShadow = "none";
  }
}

/**
 * Saves the CV sheet as an A4 PDF. The on-screen sheet may be scaled down to
 * fit a phone; the capture is taken from a clone with that transform
 * removed, so the PDF is always the full-size page. Long CVs continue on
 * further A4 pages.
 */
export async function exportCvPdf(sheet: HTMLElement, filename: string) {
  const canvas = await html2canvas(sheet, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    onclone: (doc) => {
      const clone = doc.querySelector<HTMLElement>("[data-cv-sheet]");
      for (let el: HTMLElement | null = clone?.parentElement ?? null; el; el = el.parentElement) {
        el.style.transform = "none";
      }
      if (clone && doc.defaultView) flattenModernColors(clone, doc.defaultView);
    },
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageHeightMm = (height: number) => (height * A4_WIDTH_MM) / canvas.width;
  a4PageSlices(canvas.width, canvas.height).forEach((slice, index) => {
    const page = document.createElement("canvas");
    page.width = canvas.width;
    page.height = slice.height;
    page.getContext("2d")?.drawImage(canvas, 0, slice.y, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
    if (index > 0) pdf.addPage("a4", "portrait");
    pdf.addImage(page.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, A4_WIDTH_MM, Math.min(A4_HEIGHT_MM, pageHeightMm(slice.height)));
  });
  pdf.save(`${filename}.pdf`);
}
