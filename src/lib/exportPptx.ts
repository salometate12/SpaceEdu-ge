import pptxgen from "pptxgenjs";
import type { GeneratedSlide } from "@/components/presentation/PresentationWizard";

export async function exportToPptx(
  slides: GeneratedSlide[],
  template: string,
  title: string,
) {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";

  const colors: Record<string, { bg: string; title: string; body: string; accent: string }> = {
    galaxy: { bg: "0F0520", title: "F0EBFF", body: "C4B5FD", accent: "A78BFA" },
    ocean: { bg: "021825", title: "ECFEFF", body: "67E8F9", accent: "22D3EE" },
    forest: { bg: "021A0E", title: "DCFCE7", body: "86EFAC", accent: "22C55E" },
    sunset: { bg: "1C0F00", title: "FEF3C7", body: "FCD34D", accent: "F59E0B" },
    minimal: { bg: "FFFFFF", title: "0F172A", body: "334155", accent: "7C3AED" },
    bold: { bg: "7C3AED", title: "FFFFFF", body: "EDE9FE", accent: "22D3EE" },
  };

  const c = colors[template] ?? colors.galaxy;

  slides.forEach((slide) => {
    const s = pptx.addSlide();
    s.background = { color: c.bg };
    s.addText(slide.title, {
      x: 0.5,
      y: 0.4,
      w: "90%",
      h: 1,
      fontSize: slide.type === "cover" ? 34 : 24,
      bold: true,
      color: c.title,
      fontFace: "Calibri",
    });

    if (slide.points?.length) {
      slide.points.forEach((pt, i) => {
        s.addText(`• ${pt}`, {
          x: 0.5,
          y: 1.6 + i * 0.55,
          w: "90%",
          fontSize: 16,
          color: c.body,
          fontFace: "Calibri",
        });
      });
    } else if (slide.body) {
      s.addText(slide.body, {
        x: 0.5,
        y: 1.6,
        w: "90%",
        h: 2.5,
        fontSize: 16,
        color: c.body,
        fontFace: "Calibri",
        wrap: true,
      });
    }

    if (slide.photoBase64) {
      s.addImage({ data: slide.photoBase64, x: 6, y: 1.5, w: 3.5, h: 2.5 });
    }
  });

  await pptx.writeFile({ fileName: `${title}.pptx` });
}
