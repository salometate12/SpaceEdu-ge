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
async function logoDataUri(): Promise<string | null> {
  try {
    const file = await readFile(path.join(process.cwd(), "public/spaceedu-logo.png"));
    return `data:image/png;base64,${file.toString("base64")}`;
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
          alignItems: "center",
          background: "#0a0a0f",
          padding: "80px 96px",
          gap: 48,
          fontFamily: font ? "Georgian" : undefined,
        }}
      >
        {/* The logo already carries the SPACEEDU wordmark. */}
        {logo ? (
          <img src={logo} alt="" width={360} height={360} />
        ) : null}
        <div style={{ color: "#94a3b8", fontSize: 34 }}>
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
