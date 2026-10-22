import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/** PDF page size in points: 16:9, the shape of the slides. */
const PAGE_W = 960;
const PAGE_H = 540;

/**
 * One PDF page per slide: every `[data-slide-export]` element inside the
 * container is captured on its own, so photos land exactly where they are
 * on screen. Elements marked `data-html2canvas-ignore` (selection frame,
 * resize handles) are left out.
 */
export async function exportToPdf(elementId: string, filename: string) {
  const container = document.getElementById(elementId);
  if (!container) return;
  const slides = Array.from(container.querySelectorAll<HTMLElement>("[data-slide-export]"));
  if (slides.length === 0) return;

  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [PAGE_W, PAGE_H] });
  for (let index = 0; index < slides.length; index += 1) {
    const slide = slides[index];
    const canvas = await html2canvas(slide, {
      scale: Math.max(2, PAGE_W / slide.clientWidth),
      backgroundColor: null,
      useCORS: true,
    });
    if (index > 0) pdf.addPage([PAGE_W, PAGE_H], "landscape");
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, PAGE_W, PAGE_H);
  }
  pdf.save(`${filename}.pdf`);
}

/** A4 in points. */
const A4_W = 595.28;
const A4_H = 841.89;
const A4_MARGIN = 32;

/**
 * A tall element (an analysis, a document) as A4 pages: captured once and
 * cut into page-high slices. Elements marked `data-html2canvas-ignore`
 * (buttons, sticky navigation) are left out.
 */
export async function exportElementToA4Pdf(element: HTMLElement, filename: string, background = "#ffffff") {
  const canvas = await html2canvas(element, { scale: 2, backgroundColor: background, useCORS: true });
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const contentW = A4_W - A4_MARGIN * 2;
  const contentH = A4_H - A4_MARGIN * 2;
  // Canvas pixels that fit on one page at the page's width.
  const sliceH = Math.floor((contentH / contentW) * canvas.width);
  for (let top = 0, page = 0; top < canvas.height; top += sliceH, page += 1) {
    const height = Math.min(sliceH, canvas.height - top);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = height;
    const context = slice.getContext("2d");
    if (!context) break;
    context.fillStyle = background;
    context.fillRect(0, 0, slice.width, slice.height);
    context.drawImage(canvas, 0, top, canvas.width, height, 0, 0, canvas.width, height);
    if (page > 0) pdf.addPage("a4", "portrait");
    pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", A4_MARGIN, A4_MARGIN, contentW, (height / canvas.width) * contentW);
  }
  pdf.save(`${filename}.pdf`);
}
