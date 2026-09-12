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
  const font = await georgianFont();

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
        <div
          style={{
            width: 180,
            height: 180,
            borderRadius: 44,
            background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 92,
            fontWeight: 700,
          }}
        >
          🚀
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "white", fontSize: 72, fontWeight: 800, letterSpacing: -1.5 }}>
            SpaceEdu
          </div>
          <div style={{ color: "#94a3b8", fontSize: 32, marginTop: 14 }}>
            AI სასწავლო პლატფორმა
          </div>
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
