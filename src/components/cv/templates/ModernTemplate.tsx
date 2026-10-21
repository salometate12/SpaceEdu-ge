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

/** Modern: name left, accent headline; a main column (~65%) and a light grey side column (~35%). */
export function ModernTemplate({ data, accent, photo, language, sections }: CvTemplateProps) {
  const contacts = contactItems(data);
  const side = sections.filter((section) => !MAIN.includes(section));
  return (
    <Sheet style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flex: 1, minHeight: "inherit" }}>
        <div style={{ width: "65%", padding: `${CV_MARGIN}px 28px ${CV_MARGIN}px ${CV_MARGIN}px` }}>
          <Block>
            <h1 style={{ margin: 0, fontSize: CV_TYPE.name, fontWeight: 700, color: CV_INK.strong, lineHeight: 1.15 }}>{data.fullName}</h1>
            {data.headline ? (
              <Paragraph style={{ marginTop: 6, fontSize: CV_TYPE.headline, fontWeight: 600, color: accent }}>{data.headline}</Paragraph>
            ) : null}
          </Block>
          {sections
            .filter((section) => MAIN.includes(section))
            .map((section) => (
              <section key={section} style={{ marginTop: 24 }}>
                <Block keepWithNext>
                  <SectionTitle id={section} language={language} color={accent} style={{ marginBottom: 8 }} />
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

        <aside style={{ width: "35%", background: CV_INK.panel, padding: `${CV_MARGIN}px 28px` }}>
          {photo && data.photo ? (
            <Block style={{ marginBottom: 20 }}>
              <Photo src={data.photo} size={96} shape="round" />
            </Block>
          ) : null}
          {contacts.length ? (
            <section>
              <Block keepWithNext>
                <SectionTitle id="contact" language={language} color={accent} style={{ marginBottom: 8 }} />
              </Block>
              {contacts.map((item) => (
                <Block key={item}>
                  <Paragraph style={{ fontSize: CV_TYPE.small, wordBreak: "break-word" }}>{item}</Paragraph>
                </Block>
              ))}
            </section>
          ) : null}
          {side.map((section) => (
            <section key={section} style={{ marginTop: 22 }}>
              <Block keepWithNext>
                <SectionTitle id={section} language={language} color={accent} style={{ marginBottom: 8 }} />
              </Block>
              {(section === "skills" ? allSkills(data) : section === "languages" ? data.languages : data.links).map((item) => (
                <Block key={item} style={{ marginTop: 3 }}>
                  <Paragraph style={{ fontSize: CV_TYPE.small, wordBreak: "break-word" }}>{item}</Paragraph>
                </Block>
              ))}
            </section>
          ))}
        </aside>
      </div>
    </Sheet>
  );
}
