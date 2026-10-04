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
