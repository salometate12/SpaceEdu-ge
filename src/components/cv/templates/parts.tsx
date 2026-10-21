import type { CSSProperties, ReactNode } from "react";
import { CV_SECTION_TITLES, type CvData, type CvLanguage, type CvSectionId } from "@/lib/cv-data";

/** Sizes in CSS px on the 794px A4 sheet (96 dpi). */
export const CV_TYPE = {
  name: 28,
  headline: 13.5,
  section: 11.5,
  body: 11.5,
  small: 10.5,
  lineHeight: 1.45,
} as const;

/** Page margin ≈ 17 mm. */
export const CV_MARGIN = 64;

export const CV_INK = { text: "#1f2937", strong: "#111827", muted: "#4b5563", rule: "#d1d5db", panel: "#f3f4f6" } as const;

export const SANS = 'var(--font-dm-sans), var(--font-noto-georgian), "Noto Sans Georgian", Arial, sans-serif';
export const SERIF = 'var(--font-noto-serif-georgian), "Noto Serif Georgian", Georgia, serif';

export interface CvTemplateProps {
  data: CvData;
  /** Resolved accent colour. */
  accent: string;
  photo: boolean;
  language: CvLanguage;
  sections: CvSectionId[];
}

/**
 * A unit the paginator keeps on one page (a heading with its first lines,
 * an experience bullet, an education entry).
 */
export function Block({
  children,
  style,
  className,
  keepWithNext = false,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  /** A heading: never left alone at the bottom of a page. */
  keepWithNext?: boolean;
}) {
  return (
    <div
      data-cv-block
      data-cv-keep-next={keepWithNext ? "" : undefined}
      className={className}
      style={{ breakInside: "avoid", breakAfter: keepWithNext ? "avoid" : undefined, ...style }}
    >
      {children}
    </div>
  );
}

/**
 * Section heading. Uppercase + letter-spacing for English only: CSS
 * uppercase turns Georgian into Mtavruli (and ATS searches would miss it).
 */
export function SectionTitle({
  id,
  language,
  color,
  rule,
  style,
}: {
  id: CvSectionId | "contact";
  language: CvLanguage;
  color: string;
  rule?: string;
  style?: CSSProperties;
}) {
  return (
    <h2
      style={{
        margin: 0,
        fontSize: CV_TYPE.section,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: language === "en" ? "uppercase" : "none",
        color,
        paddingBottom: rule ? 4 : 0,
        borderBottom: rule ? `1px solid ${rule}` : undefined,
        ...style,
      }}
    >
      {CV_SECTION_TITLES[language][id]}
    </h2>
  );
}

export function Paragraph({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <p style={{ margin: 0, fontSize: CV_TYPE.body, lineHeight: CV_TYPE.lineHeight, ...style }}>{children}</p>;
}

/** Experience: the AI's bullets, each its own block; or the raw text before generation. */
export function ExperienceItems({ data, marker = "•", markerColor }: { data: CvData; marker?: string; markerColor?: string }) {
  const bullets = data.experience.filter((item) => item.trim());
  if (bullets.length === 0) {
    return (
      <Block>
        <Paragraph style={{ whiteSpace: "pre-line" }}>{data.experienceText}</Paragraph>
      </Block>
    );
  }
  return (
    <>
      {bullets.map((bullet, index) => (
        <Block key={index} style={{ display: "flex", gap: 8, marginTop: index ? 5 : 0 }}>
          <span aria-hidden style={{ color: markerColor, fontSize: CV_TYPE.body, lineHeight: CV_TYPE.lineHeight }}>
            {marker}
          </span>
          <Paragraph>{bullet}</Paragraph>
        </Block>
      ))}
    </>
  );
}

export function EducationItems({ data, muted = CV_INK.muted, strong = CV_INK.strong }: { data: CvData; muted?: string; strong?: string }) {
  return (
    <>
      {data.education
        .filter((item) => item.institution.trim() || item.degree.trim())
        .map((item, index) => (
          <Block key={index} style={{ marginTop: index ? 8 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <Paragraph style={{ fontWeight: 700, color: strong }}>{item.degree || item.institution}</Paragraph>
              {item.year ? <Paragraph style={{ color: muted, whiteSpace: "nowrap" }}>{item.year}</Paragraph> : null}
            </div>
            {item.degree && item.institution ? <Paragraph style={{ color: muted }}>{item.institution}</Paragraph> : null}
          </Block>
        ))}
    </>
  );
}

/** All skills (tools first, then personal skills). */
export function allSkills(data: CvData): string[] {
  return [...data.skills, ...data.softSkills].filter((skill) => skill.trim());
}

export function Photo({ src, size, shape, border }: { src: string; size: number; shape: "round" | "rounded"; border?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local data URL
    <img
      src={src}
      alt=""
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        objectFit: "cover",
        borderRadius: shape === "round" ? "9999px" : 10,
        border,
        display: "block",
      }}
    />
  );
}

/** The A4 sheet every template draws on: white paper, even in dark mode. */
export function Sheet({ children, font = SANS, style }: { children: ReactNode; font?: string; style?: CSSProperties }) {
  return (
    <div style={{ background: "#ffffff", color: CV_INK.text, fontFamily: font, minHeight: "inherit", ...style }}>{children}</div>
  );
}
