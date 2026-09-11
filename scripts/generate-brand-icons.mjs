import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function logoSvg(size, { padding = 0.22, radiusRatio = 0.22 } = {}) {
  const radius = Math.round(size * radiusRatio);
  const inset = size * padding;
  const rocketBox = size - inset * 2;
  const scale = rocketBox / 24;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#6D28D9"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#g)"/>
  <g transform="translate(${inset},${inset}) scale(${scale})" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09"/>
    <path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05"/>
  </g>
</svg>`;
}

function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  // ICO directory stores 256 as 0; any other size must match the PNG.
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

async function raster(svg, size) {
  return sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
}

const iconsDir = join(root, "public/icons");
const appDir = join(root, "src/app");
mkdirSync(iconsDir, { recursive: true });

const anySvg512 = logoSvg(512, { padding: 0.2, radiusRatio: 0.22 });
const maskSvg512 = logoSvg(512, { padding: 0.28, radiusRatio: 0.22 });
const any512 = await raster(anySvg512, 512);
const any192 = await raster(logoSvg(192, { padding: 0.2, radiusRatio: 0.22 }), 192);
const any48 = await raster(logoSvg(48, { padding: 0.18, radiusRatio: 0.22 }), 48);
const any32 = await raster(logoSvg(32, { padding: 0.16, radiusRatio: 0.22 }), 32);
const apple180 = await raster(logoSvg(180, { padding: 0.2, radiusRatio: 0.22 }), 180);
const mask512 = await raster(maskSvg512, 512);
const icoPng = await raster(logoSvg(48, { padding: 0.16, radiusRatio: 0.22 }), 48);

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

console.log("wrote SpaceEdu brand icons");
