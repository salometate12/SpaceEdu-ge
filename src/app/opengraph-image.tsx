import { ImageResponse } from "next/og";

export const alt = "SpaceEdu — AI სასწავლო პლატფორმა";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
    { ...size },
  );
}
