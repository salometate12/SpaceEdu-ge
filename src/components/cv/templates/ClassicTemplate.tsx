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
  SERIF,
  Sheet,
  type CvTemplateProps,
} from "./parts";

/** Classic: one column, a centred serif name, contacts on one line, thin rules. */
export function ClassicTemplate({ data, accent, photo, language, sections }: CvTemplateProps) {
  const contacts = [...contactItems(data), ...data.links];
  return (
    <Sheet>
      <div style={{ padding: CV_MARGIN }}>
        <Block style={{ textAlign: "center" }}>
          {photo && data.photo ? (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <Photo src={data.photo} size={84} shape="round" />
            </div>
          ) : null}
          <h1 style={{ margin: 0, fontFamily: SERIF, fontSize: CV_TYPE.name + 2, fontWeight: 700, color: CV_INK.strong, lineHeight: 1.15 }}>
            {data.fullName}
          </h1>
          {data.headline ? (
            <Paragraph style={{ marginTop: 6, fontSize: CV_TYPE.headline, color: accent, fontFamily: SERIF }}>
              {data.headline}
            </Paragraph>
          ) : null}
          {contacts.length ? (
            <Paragraph style={{ marginTop: 8, color: CV_INK.muted, fontSize: CV_TYPE.small }}>{contacts.join("  ·  ")}</Paragraph>
          ) : null}
        </Block>

        {sections
          .filter((section) => section !== "links")
          .map((section) => (
            <section key={section} style={{ marginTop: 22 }}>
              <Block keepWithNext>
                <SectionTitle id={section} language={language} color={accent} rule={CV_INK.rule} style={{ fontFamily: SERIF, marginBottom: 8 }} />
              </Block>
              {section === "summary" ? (
                <Block>
                  <Paragraph>{data.summary}</Paragraph>
                </Block>
              ) : section === "experience" ? (
                <ExperienceItems data={data} />
              ) : section === "education" ? (
                <EducationItems data={data} />
              ) : section === "skills" ? (
                <Block>
                  <Paragraph>{allSkills(data).join(", ")}</Paragraph>
                </Block>
              ) : section === "languages" ? (
                <Block>
                  <Paragraph>{data.languages.join(", ")}</Paragraph>
                </Block>
              ) : null}
            </section>
          ))}
      </div>
    </Sheet>
  );
}
