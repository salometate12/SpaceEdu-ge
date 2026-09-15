import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

/**
 * Brand icons — favicon, PWA icons, apple-icon — from the SpaceEdu logo.
 *
 * The full logo (public/spaceedu-logo.png) is a detailed illustration with
 * the "SPACEEDU" wordmark arced over it: unreadable below ~120px. So the
 * small icons use only the ICON — brush, book stack, graduation cap —
 * cropped from that illustration and set on the logo's own cream paper, the
 * one element that still reads in a 16px browser tab.
 *
 * The full logo itself is used at large sizes (header, footer, OG image),
 * where the wordmark is legible.
 */

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOGO = join(root, "public/spaceedu-logo.png");

// The icon region within the 2048×2048 logo, excluding the wordmark arc.
const ICON_CROP = { left: 372, top: 655, width: 912, height: 1000 };
const CREAM = "#faf6ec";
const RADIUS_RATIO = 0.22;

/** Cream rounded-square background as an SVG buffer. */
function roundedBg(size) {
  const r = Math.round(size * RADIUS_RATIO);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${CREAM}"/></svg>`,
  );
}

/** The cropped icon, transparent, resized to `inner` px on its longest side. */
async function iconLayer(inner) {
  return sharp(LOGO)
    .extract(ICON_CROP)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

/**
 * A finished icon: the cropped illustration centred on cream.
 * `coverage` is how much of the square the icon fills (leave room to breathe;
 * maskable needs more so the OS circle/rounded mask never clips it).
 * `rounded` gives the app-icon corner; maskable stays a full-bleed square.
 */
async function makeIcon(size, { coverage = 0.72, rounded = true } = {}) {
  const inner = Math.round(size * coverage);
  const icon = await iconLayer(inner);
  const bg = rounded
    ? roundedBg(size)
    : Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${CREAM}"/></svg>`,
      );
  return sharp(bg).composite([{ input: icon, gravity: "center" }]).png().toBuffer();
}

/** Minimal single-image .ico wrapper around a PNG. */
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}

const iconsDir = join(root, "public/icons");
const appDir = join(root, "src/app");
mkdirSync(iconsDir, { recursive: true });

const any512 = await makeIcon(512);
const any192 = await makeIcon(192);
const any48 = await makeIcon(48, { coverage: 0.78 });
const any32 = await makeIcon(32, { coverage: 0.82 });
const apple180 = await makeIcon(180);
const mask512 = await makeIcon(512, { coverage: 0.6, rounded: false });
const icoPng = await makeIcon(48, { coverage: 0.78 });

writeFileSync(join(iconsDir, "icon-512x512.png"), any512);
writeFileSync(join(iconsDir, "icon-192x192.png"), any192);
writeFileSync(join(iconsDir, "icon-48x48.png"), any48);
writeFileSync(join(iconsDir, "icon-maskable-512x512.png"), mask512);
writeFileSync(join(appDir, "icon.png"), any48);
writeFileSync(join(appDir, "apple-icon.png"), apple180);
writeFileSync(join(appDir, "favicon.ico"), pngToIco(icoPng, 48));
writeFileSync(join(root, "public/favicon.ico"), pngToIco(icoPng, 48));
writeFileSync(join(root, "public/favicon-32x32.png"), any32);
writeFileSync(join(root, "public/favicon-48x48.png"), any48);

console.log("wrote SpaceEdu brand icons from the new logo");
