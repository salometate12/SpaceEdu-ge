/**
 * The CV as a text PDF (@react-pdf/renderer): the same five templates as the
 * on-screen sheet (src/components/cv/templates), drawn with PDF primitives,
 * so the text can be selected, copied and read by ATS filters. Sizes come
 * from the same CV_TYPE scale (CSS px × 0.75 = pt).
 */

import { Document, Font, Image, Page, StyleSheet, Text as PdfText, View } from "@react-pdf/renderer";
import { Fragment, type ComponentProps, type ReactNode } from "react";
import { contactItems, CV_SECTION_TITLES, type CvData, type CvLanguage, type CvSectionId, type CvTemplateId } from "@/lib/cv-data";
import { CV_INK, CV_MARGIN, CV_TYPE } from "../templates/parts";

const pt = (px: number) => Math.round(px * 0.75 * 100) / 100;

let fontsRegistered = false;
/**
 * Registers the embedded fonts once. Each is a single font holding both
 * Latin and Georgian (see public/fonts/cv/README.md): a word must not mix
 * fonts, or react-pdf breaks it there with an extra hyphen.
 */
export function registerCvFonts(origin: string) {
  if (fontsRegistered) return;
  const family = (name: string, file: string) =>
    Font.register({
      family: name,
      fonts: [400, 600, 700].map((fontWeight) => ({ src: `${origin}/fonts/cv/${file}-${fontWeight}.woff`, fontWeight })),
    });
  family("CvSans", "cv-sans");
  family("CvSerif", "cv-serif");
  Font.registerHyphenationCallback(keepWords);
  fontsRegistered = true;
}

const SANS = "CvSans";
const SERIF = "CvSerif";

/**
 * Whole words only: no automatic hyphenation of names, e-mails or Georgian.
 * Set on every text node as well as globally, so it holds whichever store
 * the layout reads. textkit still splits a word where the script changes
 * ("Tailwind-ით") and offers a hyphenated break there, so that break is
 * made infinitely bad: lines only ever break at spaces.
 */
const keepWords = (word: string) => [word];
const NEVER = 10000;
function Text(props: ComponentProps<typeof PdfText>) {
  return <PdfText hyphenationCallback={keepWords} hyphenationPenalty={NEVER} {...props} />;
}


export interface CvPdfProps {
  template: CvTemplateId;
  data: CvData;
  accent: string;
  photo: boolean;
  language: CvLanguage;
  sections: CvSectionId[];
}

const base = StyleSheet.create({
  page: { fontFamily: SANS, fontSize: pt(CV_TYPE.body), lineHeight: CV_TYPE.lineHeight, color: CV_INK.text, backgroundColor: "#ffffff" },
  p: { fontSize: pt(CV_TYPE.body), lineHeight: CV_TYPE.lineHeight },
});

const title = (id: CvSectionId | "contact", language: CvLanguage) => {
  const text = CV_SECTION_TITLES[language][id];
  return language === "en" ? text.toUpperCase() : text;
};

/** Room a heading needs below it: one two-line education entry or ~four lines of text. */
const HEADING_KEEP = pt(88);

/** A section heading that never sits alone at the bottom of a page. */
function Heading({ id, language, color, rule, font, top = 0 }: { id: CvSectionId | "contact"; language: CvLanguage; color: string; rule?: string; font?: string; top?: number }) {
  return (
    <View minPresenceAhead={HEADING_KEEP} style={{ marginTop: top, marginBottom: pt(8), paddingBottom: rule ? pt(4) : 0, borderBottomWidth: rule ? 0.75 : 0, borderBottomColor: rule }}>
      <Text style={{ fontSize: pt(CV_TYPE.section), fontWeight: 700, letterSpacing: pt(CV_TYPE.section) * 0.08, color, fontFamily: font ?? SANS }}>
        {title(id, language)}
      </Text>
    </View>
  );
}

function Bullets({ data, marker = "•", markerColor }: { data: CvData; marker?: string; markerColor?: string }) {
  const bullets = data.experience.filter((item) => item.trim());
  if (bullets.length === 0) return <Text style={base.p}>{data.experienceText}</Text>;
  return (
    <>
      {bullets.map((bullet, index) => (
        <View key={index} wrap={false} style={{ flexDirection: "row", marginTop: index ? pt(5) : 0 }}>
          <Text style={{ ...base.p, width: pt(14), color: markerColor }}>{marker}</Text>
          <Text style={{ ...base.p, flex: 1 }}>{bullet}</Text>
        </View>
      ))}
    </>
  );
}

function Education({ data, muted = CV_INK.muted, strong = CV_INK.strong }: { data: CvData; muted?: string; strong?: string }) {
  return (
    <>
      {data.education
        .filter((item) => item.institution.trim() || item.degree.trim())
        .map((item, index) => (
          <View key={index} wrap={false} style={{ marginTop: index ? pt(8) : 0 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ ...base.p, fontWeight: 700, color: strong, flex: 1 }}>{item.degree || item.institution}</Text>
              {item.year ? <Text style={{ ...base.p, color: muted }}>{item.year}</Text> : null}
            </View>
            {item.degree && item.institution ? <Text style={{ ...base.p, color: muted }}>{item.institution}</Text> : null}
          </View>
        ))}
    </>
  );
}

const skills = (data: CvData) => [...data.skills, ...data.softSkills].filter((item) => item.trim());
const listFor = (section: CvSectionId, data: CvData) =>
  section === "skills" ? skills(data) : section === "languages" ? data.languages : data.links;

function Photo({ src, size, round, border }: { src: string; size: number; round: boolean; border?: string }) {
  return (
    // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt
    <Image
      src={src}
      style={{ width: pt(size), height: pt(size), objectFit: "cover", borderRadius: round ? pt(size) / 2 : pt(10), borderWidth: border ? 2 : 0, borderColor: border }}
    />
  );
}

function SectionBody({ section, data, accent, inline = ", " }: { section: CvSectionId; data: CvData; accent?: string; inline?: string }) {
  if (section === "summary") return <Text style={base.p}>{data.summary}</Text>;
  if (section === "experience") return <Bullets data={data} markerColor={accent} />;
  if (section === "education") return <Education data={data} />;
  return <Text style={base.p}>{listFor(section, data).join(inline)}</Text>;
}

// ---- templates ----

function Classic({ data, accent, photo, language, sections }: CvPdfProps) {
  const contacts = [...contactItems(data), ...data.links];
  return (
    <Page size="A4" style={{ ...base.page, padding: pt(CV_MARGIN) }}>
      <View wrap={false} style={{ alignItems: "center" }}>
        {photo && data.photo ? (
          <View style={{ marginBottom: pt(12) }}>
            <Photo src={data.photo} size={84} round />
          </View>
        ) : null}
        <Text style={{ fontFamily: SERIF, fontSize: pt(CV_TYPE.name + 2), fontWeight: 700, lineHeight: 1.2, color: CV_INK.strong, textAlign: "center" }}>{data.fullName}</Text>
        {data.headline ? <Text style={{ fontFamily: SERIF, fontSize: pt(CV_TYPE.headline), color: accent, marginTop: pt(6), textAlign: "center" }}>{data.headline}</Text> : null}
        {contacts.length ? <Text style={{ fontSize: pt(CV_TYPE.small), color: CV_INK.muted, marginTop: pt(8), textAlign: "center" }}>{contacts.join("  ·  ")}</Text> : null}
      </View>
      {sections
        .filter((section) => section !== "links")
        .map((section) => (
          <Fragment key={section}>
            <Heading top={pt(22)} id={section} language={language} color={accent} rule={CV_INK.rule} font={SERIF} />
            <SectionBody section={section} data={data} />
          </Fragment>
        ))}
    </Page>
  );
}

const MAIN: CvSectionId[] = ["summary", "experience", "education"];

function SideList({ data, section, color, size = CV_TYPE.small }: { data: CvData; section: CvSectionId; color?: string; size?: number }) {
  return (
    <>
      {listFor(section, data).map((item) => (
        <Text key={item} style={{ fontSize: pt(size), lineHeight: CV_TYPE.lineHeight, color, marginTop: pt(3) }}>
          {item}
        </Text>
      ))}
    </>
  );
}

function Modern({ data, accent, photo, language, sections }: CvPdfProps) {
  const contacts = contactItems(data);
  return (
    <Page size="A4" style={{ ...base.page, paddingVertical: pt(CV_MARGIN) }}>
      <View fixed style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "35%", backgroundColor: CV_INK.panel }} />
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: "65%", paddingLeft: pt(CV_MARGIN), paddingRight: pt(28) }}>
          <View wrap={false}>
            <Text style={{ fontSize: pt(CV_TYPE.name), fontWeight: 700, lineHeight: 1.2, color: CV_INK.strong }}>{data.fullName}</Text>
            {data.headline ? <Text style={{ fontSize: pt(CV_TYPE.headline), fontWeight: 600, color: accent, marginTop: pt(6) }}>{data.headline}</Text> : null}
          </View>
          {sections
            .filter((section) => MAIN.includes(section))
            .map((section) => (
              <Fragment key={section}>
                <Heading top={pt(24)} id={section} language={language} color={accent} />
                <SectionBody section={section} data={data} accent={accent} />
              </Fragment>
            ))}
        </View>
        <View style={{ width: "35%", paddingHorizontal: pt(28) }}>
          {photo && data.photo ? (
            <View style={{ marginBottom: pt(20) }}>
              <Photo src={data.photo} size={96} round />
            </View>
          ) : null}
          {contacts.length ? (
            <View>
              <Heading id="contact" language={language} color={accent} />
              {contacts.map((item) => (
                <Text key={item} style={{ fontSize: pt(CV_TYPE.small), lineHeight: CV_TYPE.lineHeight }}>
                  {item}
                </Text>
              ))}
            </View>
          ) : null}
          {sections
            .filter((section) => !MAIN.includes(section))
            .map((section) => (
              <Fragment key={section}>
                <Heading top={pt(22)} id={section} language={language} color={accent} />
                <SideList data={data} section={section} />
              </Fragment>
            ))}
        </View>
      </View>
    </Page>
  );
}

function Executive({ data, accent, photo, language, sections }: CvPdfProps) {
  const contacts = contactItems(data);
  const muted = "#e9eaee";
  return (
    <Page size="A4" style={{ ...base.page, paddingVertical: pt(CV_MARGIN) }}>
      <View fixed style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "32%", backgroundColor: accent }} />
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: "32%", paddingHorizontal: pt(26) }}>
          {photo && data.photo ? (
            <View style={{ marginBottom: pt(22) }}>
              <Photo src={data.photo} size={112} round border="#ffffff" />
            </View>
          ) : null}
          {contacts.length ? (
            <View>
              <Heading id="contact" language={language} color="#ffffff" rule="#ffffff" />
              {contacts.map((item) => (
                <Text key={item} style={{ fontSize: pt(CV_TYPE.small), lineHeight: CV_TYPE.lineHeight, color: muted }}>
                  {item}
                </Text>
              ))}
            </View>
          ) : null}
          {sections
            .filter((section) => !MAIN.includes(section))
            .map((section) => (
              <Fragment key={section}>
                <Heading top={pt(22)} id={section} language={language} color="#ffffff" rule="#ffffff" />
                <SideList data={data} section={section} color={muted} />
              </Fragment>
            ))}
        </View>
        <View style={{ width: "68%", paddingLeft: pt(34), paddingRight: pt(CV_MARGIN) }}>
          <View wrap={false}>
            <Text style={{ fontSize: pt(CV_TYPE.name + 2), fontWeight: 700, lineHeight: 1.2, color: CV_INK.strong }}>{data.fullName}</Text>
            {data.headline ? <Text style={{ fontSize: pt(CV_TYPE.headline), fontWeight: 600, color: accent, marginTop: pt(6) }}>{data.headline}</Text> : null}
            <View style={{ marginTop: pt(14), height: pt(3), width: pt(48), backgroundColor: accent, borderRadius: 1.5 }} />
          </View>
          {sections
            .filter((section) => MAIN.includes(section))
            .map((section) => (
              <Fragment key={section}>
                <Heading top={pt(24)} id={section} language={language} color={accent} rule={CV_INK.rule} />
                <SectionBody section={section} data={data} accent={accent} />
              </Fragment>
            ))}
        </View>
      </View>
    </Page>
  );
}

function Minimal({ data, accent, photo, language, sections }: CvPdfProps) {
  const contacts = contactItems(data);
  return (
    <Page size="A4" style={{ ...base.page, padding: pt(72) }}>
      <View wrap={false} style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: pt(22), height: pt(3), backgroundColor: accent, borderRadius: 1.5, marginRight: pt(12) }} />
            <Text style={{ fontSize: pt(CV_TYPE.name), fontWeight: 600, lineHeight: 1.2, color: CV_INK.strong }}>{data.fullName}</Text>
          </View>
          {data.headline ? <Text style={{ fontSize: pt(CV_TYPE.headline), color: CV_INK.muted, marginTop: pt(6), marginLeft: pt(34) }}>{data.headline}</Text> : null}
          {contacts.length ? (
            <Text style={{ fontSize: pt(CV_TYPE.small), color: CV_INK.muted, marginTop: pt(6), marginLeft: pt(34) }}>{contacts.join("   ·   ")}</Text>
          ) : null}
        </View>
        {photo && data.photo ? <Photo src={data.photo} size={76} round={false} /> : null}
      </View>
      {sections.map((section) => (
        <View key={section} style={{ flexDirection: "row", marginTop: pt(30) }}>
          <View minPresenceAhead={HEADING_KEEP} style={{ width: "25%", paddingRight: pt(24) }}>
            <Text style={{ fontSize: pt(CV_TYPE.section), fontWeight: 600, letterSpacing: pt(CV_TYPE.section) * 0.08, color: CV_INK.muted }}>
              {title(section, language)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            {section === "experience" ? <Bullets data={data} marker="–" markerColor={CV_INK.muted} /> : <SectionBody section={section} data={data} inline="   ·   " />}
          </View>
        </View>
      ))}
    </Page>
  );
}

function Ats({ data, language, sections }: CvPdfProps) {
  const black = "#111827";
  const contacts = [...contactItems(data), ...(sections.includes("links") ? [] : data.links)];
  return (
    <Page size="A4" style={{ ...base.page, padding: pt(CV_MARGIN), color: black }}>
      <View wrap={false}>
        <Text style={{ fontSize: pt(CV_TYPE.name - 2), fontWeight: 700, lineHeight: 1.2 }}>{data.fullName}</Text>
        {data.headline ? <Text style={{ fontSize: pt(CV_TYPE.headline), marginTop: pt(4) }}>{data.headline}</Text> : null}
        {contacts.length ? <Text style={{ ...base.p, marginTop: pt(4) }}>{contacts.join(" | ")}</Text> : null}
      </View>
      {sections.map((section) => (
        <Fragment key={section}>
          <Heading top={pt(18)} id={section} language={language} color={black} rule={black} />
          {section === "education" ? <Education data={data} muted={black} strong={black} /> : <SectionBody section={section} data={data} />}
        </Fragment>
      ))}
    </Page>
  );
}

const PAGES: Record<CvTemplateId, (props: CvPdfProps) => ReactNode> = {
  classic: Classic,
  modern: Modern,
  executive: Executive,
  minimal: Minimal,
  ats: Ats,
};

export function CvPdfDocument(props: CvPdfProps) {
  const Template = PAGES[props.template];
  return (
    <Document title={`CV — ${props.data.fullName}`} author={props.data.fullName} creator="SpaceEdu" producer="SpaceEdu" language={props.language}>
      <Template {...props} />
    </Document>
  );
}
