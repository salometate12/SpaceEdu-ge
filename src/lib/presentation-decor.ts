/**
 * The drawn parts of the decorated templates, as data: the editor draws
 * them with divs and the PPTX export with shapes, from the same numbers.
 * Positions are percentages of the slide (x/w of its width, y/h of its
 * height), like photos.
 */

import { AURORA_GRADIENT } from "@/lib/presentation-theme";

export interface DecorShape {
  kind: "ellipse" | "rect";
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  /** 0–1 */
  opacity: number;
}

const CORAL = "#FF6B5A";
const NAVY = "#1E2A5A";
/** h% for a circle w% wide on a 16:9 slide. */
const round = (w: number) => (w * 16) / 9;

function circle(cx: number, cy: number, w: number, color: string, opacity = 1): DecorShape {
  const h = round(w);
  return { kind: "ellipse", x: cx - w / 2, y: cy - h / 2, w, h, color, opacity };
}

function dotGrid(x: number, y: number, cols: number, rows: number, color: string): DecorShape[] {
  const dots: DecorShape[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) dots.push(circle(x + col * 2.2, y + row * 3.9, 0.6, color, 0.35));
  }
  return dots;
}

/**
 * Geometric: a coral circle cut by the top-right corner, a navy one in the
 * bottom-left, bigger on the cover and the thank-you slide, which also get
 * a dot grid. Kept to the corners, outside the (inset) text box.
 */
export function geometricShapes(frame: boolean): DecorShape[] {
  if (frame) {
    return [
      circle(100, 0, 34, CORAL),
      circle(0, 100, 26, NAVY),
      { kind: "rect", x: 9, y: 78, w: 3.2, h: round(3.2), color: CORAL, opacity: 1 },
      ...dotGrid(82, 72, 5, 4, NAVY),
    ];
  }
  return [circle(100, 0, 18, CORAL), circle(0, 100, 14, NAVY)];
}

// ---- Aurora: a soft painted background, the same bitmap on screen and in the PPTX ----

let auroraCache: string | null = null;

/** Aurora's background as a JPEG data URL (drawn once, in the browser). */
export function auroraBackground(): string | null {
  if (auroraCache) return auroraCache;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 1920;
  canvas.height = 1080;
  const g = canvas.getContext("2d");
  if (!g) return null;
  g.fillStyle = "#0B1026";
  g.fillRect(0, 0, canvas.width, canvas.height);
  const glow = (x: number, y: number, radius: number, color: string, alpha: number) => {
    const gradient = g.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `${color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`);
    gradient.addColorStop(1, `${color}00`);
    g.fillStyle = gradient;
    g.fillRect(0, 0, canvas.width, canvas.height);
  };
  glow(140, 120, 760, "#7C3AED", 0.55);
  glow(1880, 1040, 820, "#2DD4BF", 0.4);
  glow(1720, 60, 520, "#EC4899", 0.35);
  glow(260, 1100, 480, "#2DD4BF", 0.18);
  auroraCache = canvas.toDataURL("image/jpeg", 0.88);
  return auroraCache;
}

let lineCache: string | null = null;

/** The gradient title underline as a small PNG, for the PPTX (shapes can't do gradients). */
export function auroraLine(): string | null {
  if (lineCache) return lineCache;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 12;
  const g = canvas.getContext("2d");
  if (!g) return null;
  const gradient = g.createLinearGradient(0, 0, canvas.width, 0);
  AURORA_GRADIENT.forEach((color, index) => gradient.addColorStop(index / (AURORA_GRADIENT.length - 1), color));
  g.fillStyle = gradient;
  g.fillRect(0, 0, canvas.width, canvas.height);
  lineCache = canvas.toDataURL("image/png");
  return lineCache;
}

export const AURORA_LINE_CSS = `linear-gradient(90deg, ${AURORA_GRADIENT.join(", ")})`;
