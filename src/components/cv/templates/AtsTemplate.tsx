import { contactItems } from "@/lib/cv-data";
import { allSkills, Block, CV_MARGIN, CV_TYPE, EducationItems, ExperienceItems, Paragraph, SectionTitle, Sheet, type CvTemplateProps } from "./parts";

const BLACK = "#111827";

/**
 * ATS-friendly: plain text in one column — standard section names, no
 * photo, columns, icons or tables; only bold and rules. Accent is ignored.
 */
export function AtsTemplate({ data, language, sections }: CvTemplateProps) {
  const contacts = [...contactItems(data), ...(sections.includes("links") ? [] : data.links)];
  return (
    <Sheet>
      <div style={{ padding: CV_MARGIN, color: BLACK }}>
        <Block>
          <h1 style={{ margin: 0, fontSize: CV_TYPE.name - 2, fontWeight: 700, lineHeight: 1.15 }}>{data.fullName}</h1>
          {data.headline ? <Paragraph style={{ marginTop: 4, fontSize: CV_TYPE.headline }}>{data.headline}</Paragraph> : null}
          {contacts.length ? <Paragraph style={{ marginTop: 4 }}>{contacts.join(" | ")}</Paragraph> : null}
        </Block>
        {sections.map((section) => (
          <section key={section} style={{ marginTop: 18 }}>
            <Block keepWithNext>
              <SectionTitle id={section} language={language} color={BLACK} rule={BLACK} style={{ marginBottom: 6 }} />
            </Block>
            {section === "summary" ? (
              <Block>
                <Paragraph>{data.summary}</Paragraph>
              </Block>
            ) : section === "experience" ? (
              <ExperienceItems data={data} />
            ) : section === "education" ? (
              <EducationItems data={data} muted={BLACK} strong={BLACK} />
            ) : (
              <Block>
                <Paragraph>{(section === "skills" ? allSkills(data) : section === "languages" ? data.languages : data.links).join(", ")}</Paragraph>
              </Block>
            )}
          </section>
        ))}
      </div>
    </Sheet>
  );
}
