import { contactItems } from "@/lib/cv-data";
import {
  allSkills,
  Block,
  CV_INK,
  CV_TYPE,
  EducationItems,
  ExperienceItems,
  Paragraph,
  Photo,
  SectionTitle,
  Sheet,
  type CvTemplateProps,
} from "./parts";

/** Minimal: lots of air, no frames or fills; headings in a narrow left column; the only colour is a short line before the name. */
export function MinimalTemplate({ data, accent, photo, language, sections }: CvTemplateProps) {
  const contacts = contactItems(data);
  const row = (section: (typeof sections)[number]) => (
    <section key={section} style={{ display: "flex", gap: 24, marginTop: 30 }}>
      <div style={{ width: "25%", flexShrink: 0 }}>
        <Block keepWithNext>
          <SectionTitle id={section} language={language} color={CV_INK.muted} style={{ fontWeight: 600, paddingTop: 1 }} />
        </Block>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {section === "summary" ? (
          <Block>
            <Paragraph>{data.summary}</Paragraph>
          </Block>
        ) : section === "experience" ? (
          <ExperienceItems data={data} marker="–" markerColor={CV_INK.muted} />
        ) : section === "education" ? (
          <EducationItems data={data} />
        ) : (
          <Block>
            <Paragraph style={{ wordBreak: "break-word" }}>
              {(section === "skills" ? allSkills(data) : section === "languages" ? data.languages : data.links).join("   ·   ")}
            </Paragraph>
          </Block>
        )}
      </div>
    </section>
  );
  return (
    <Sheet>
      <div style={{ padding: "72px 72px" }}>
        <Block style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span aria-hidden style={{ width: 22, height: 3, background: accent, borderRadius: 2, flexShrink: 0 }} />
              <h1 style={{ margin: 0, fontSize: CV_TYPE.name, fontWeight: 600, color: CV_INK.strong, lineHeight: 1.15 }}>{data.fullName}</h1>
            </div>
            {data.headline ? (
              <Paragraph style={{ marginTop: 6, marginLeft: 34, fontSize: CV_TYPE.headline, color: CV_INK.muted }}>{data.headline}</Paragraph>
            ) : null}
            {contacts.length ? (
              <Paragraph style={{ marginTop: 6, marginLeft: 34, fontSize: CV_TYPE.small, color: CV_INK.muted }}>{contacts.join("   ·   ")}</Paragraph>
            ) : null}
          </div>
          {photo && data.photo ? <Photo src={data.photo} size={76} shape="rounded" /> : null}
        </Block>
        {sections.map(row)}
      </div>
    </Sheet>
  );
}
