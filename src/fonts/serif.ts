import localFont from "next/font/local";

/** The CV's classic template and Paper's slide titles. Self-hosted (src/fonts/README.md). */
export const notoSerifGeorgian = localFont({
  src: [{ path: "./noto-serif-georgian/NotoSerifGeorgian-Variable.woff2", weight: "400 700", style: "normal" }],
  variable: "--font-noto-serif-georgian",
  display: "swap",
  fallback: ["Georgia", "serif"],
});
