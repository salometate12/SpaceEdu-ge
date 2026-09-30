import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "SpaceEdu — AI სასწავლო პლატფორმა";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The card social and search show for spaceedu.ge.
 *
 * The Georgian line needs a font shipped with the request: `next/og`
 * renders in an isolated environment with a Latin-only default, so the
 * subtitle came out as a row of tofu boxes without this.
 */
/** The card is dark, so it takes the -dark logo (light top book, white
 * "Space"); the light files' deep-green book would vanish on it. Used as
 * the SVG itself: `next/og` rasterises SVG images through Resvg. */
async function logoDataUri(): Promise<string | null> {
  try {
    const file = await readFile(path.join(process.cwd(), "public/spaceedu-logo-dark.svg"));
    return `data:image/svg+xml;base64,${file.toString("base64")}`;
  } catch {
    return null;
  }
}

async function georgianFont(): Promise<ArrayBuffer | null> {
  try {
    const file = await readFile(
      path.join(process.cwd(), "public/fonts/bpg_extrasquare_mtavruli_2009.ttf"),
    );
    return file.buffer.slice(
      file.byteOffset,
      file.byteOffset + file.byteLength,
    ) as ArrayBuffer;
  } catch {
    return null;
  }
}

export default async function OpenGraphImage() {
  const [font, logo] = await Promise.all([georgianFont(), logoDataUri()]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#0a0a0f",
          padding: "80px 96px",
          gap: 36,
          fontFamily: font ? "Georgian" : undefined,
        }}
      >
        {/* The logo carries the "SpaceEdu" wordmark (325 x 100). */}
        {logo ? <img src={logo} alt="" width={650} height={200} /> : null}
        <div style={{ color: "#94a3b8", fontSize: 40 }}>
          AI სასწავლო პლატფორმა
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [{ name: "Georgian", data: font, style: "normal", weight: 400 }]
        : undefined,
    },
  );
}
