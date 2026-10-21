import { contactItems } from "@/lib/cv-data";
import {
  allSkills,
  Block,
  CV_INK,
  CV_MARGIN,
  CV_TYPE,
  EducationItems,
  ExperienceItems,
  Paragraph,
  Photo,
  SectionTitle,
  Sheet,
  type CvTemplateProps,
} from "./parts";

const MAIN: string[] = ["summary", "experience", "education"];
const SIDE_TEXT = "#ffffff";
const SIDE_MUTED = "rgba(255,255,255,0.78)";

/** Executive: a dark accent side band (~32%) with photo, contact, skills, languages; a white main column. */
export function ExecutiveTemplate({ data, accent, photo, language, sections }: CvTemplateProps) {
  const contacts = contactItems(data);
  const side = sections.filter((section) => !MAIN.includes(section));
  return (
    <Sheet>
      <div style={{ display: "flex", minHeight: "inherit" }}>
        <aside style={{ width: "32%", background: accent, color: SIDE_TEXT, padding: `${CV_MARGIN}px 26px` }}>
          {photo && data.photo ? (
            <Block style={{ marginBottom: 22 }}>
              <Photo src={data.photo} size={112} shape="round" border="3px solid rgba(255,255,255,0.85)" />
            </Block>
          ) : null}
          {contacts.length ? (
            <section>
              <Block keepWithNext>
                <SectionTitle id="contact" language={language} color={SIDE_TEXT} rule="rgba(255,255,255,0.35)" style={{ marginBottom: 8 }} />
              </Block>
              {contacts.map((item) => (
                <Block key={item}>
                  <Paragraph style={{ fontSize: CV_TYPE.small, color: SIDE_MUTED, wordBreak: "break-word" }}>{item}</Paragraph>
                </Block>
              ))}
            </section>
          ) : null}
          {side.map((section) => (
            <section key={section} style={{ marginTop: 22 }}>
              <Block keepWithNext>
                <SectionTitle id={section} language={language} color={SIDE_TEXT} rule="rgba(255,255,255,0.35)" style={{ marginBottom: 8 }} />
              </Block>
              {(section === "skills" ? allSkills(data) : section === "languages" ? data.languages : data.links).map((item) => (
                <Block key={item} style={{ marginTop: 3 }}>
                  <Paragraph style={{ fontSize: CV_TYPE.small, color: SIDE_MUTED, wordBreak: "break-word" }}>{item}</Paragraph>
                </Block>
              ))}
            </section>
          ))}
        </aside>

        <div style={{ width: "68%", padding: `${CV_MARGIN}px ${CV_MARGIN}px ${CV_MARGIN}px 34px` }}>
          <Block>
            <h1 style={{ margin: 0, fontSize: CV_TYPE.name + 2, fontWeight: 700, color: CV_INK.strong, lineHeight: 1.12 }}>{data.fullName}</h1>
            {data.headline ? (
              <Paragraph style={{ marginTop: 6, fontSize: CV_TYPE.headline, fontWeight: 600, color: accent }}>{data.headline}</Paragraph>
            ) : null}
            <div style={{ marginTop: 14, height: 3, width: 48, background: accent, borderRadius: 2 }} />
          </Block>
          {sections
            .filter((section) => MAIN.includes(section))
            .map((section) => (
              <section key={section} style={{ marginTop: 24 }}>
                <Block keepWithNext>
                  <SectionTitle id={section} language={language} color={accent} rule={CV_INK.rule} style={{ marginBottom: 8 }} />
                </Block>
                {section === "summary" ? (
                  <Block>
                    <Paragraph>{data.summary}</Paragraph>
                  </Block>
                ) : section === "experience" ? (
                  <ExperienceItems data={data} markerColor={accent} />
                ) : (
                  <EducationItems data={data} />
                )}
              </section>
            ))}
        </div>
      </div>
    </Sheet>
  );
}
