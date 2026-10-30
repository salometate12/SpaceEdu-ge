import { Camera } from "lucide-react";
import type { CvLanguage } from "@/lib/cv-data";
import { hasContent, type CvExperience } from "@/lib/cv-experience";

export interface CvDraft {
  fullName: string;
  email: string;
  phone: string;
  portfolio: string;
  photo: string | null;
  university: string;
  degree: string;
  graduationYear: string;
  experiences: CvExperience[];
  tools: string[];
  softSkills: string[];
}

const HEADINGS: Record<CvLanguage, { education: string; experience: string; skills: string; name: string }> = {
  ka: { education: "განათლება", experience: "გამოცდილება", skills: "უნარები", name: "შენი სახელი" },
  en: { education: "Education", experience: "Experience", skills: "Skills", name: "Your name" },
};

/** Grey bars where nothing is written yet. */
function Bars({ widths }: { widths: string[] }) {
  return (
    <span className="flex flex-col gap-1.5" aria-hidden>
      {widths.map((width, index) => (
        <span key={index} className="h-[7px] rounded-full bg-[#ece9e4]" style={{ width }} />
      ))}
    </span>
  );
}

function Heading({ children }: { children: string }) {
  return <h4 className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#9d174d]">{children}</h4>;
}

/**
 * The CV as it's being filled in: a quick sketch of the sheet from the
 * form's own values (no AI), grey bars where a field is still empty, the
 * headings in the CV's language.
 */
export function CvLivePreview({ draft, language }: { draft: CvDraft; language: CvLanguage }) {
  const h = HEADINGS[language];
  const contacts = [draft.email, draft.phone, draft.portfolio].map((value) => value.trim()).filter(Boolean);
  const education = [draft.university, draft.degree, draft.graduationYear].some((value) => value.trim());
  const experiences = draft.experiences.filter(hasContent);
  const skills = [...draft.tools, ...draft.softSkills];

  return (
    <div className="rounded-[14px] bg-white p-5 text-[#1c1a17] shadow-[0_1px_3px_rgba(28,26,23,0.08)]">
      <div className="flex items-center gap-3 border-b border-[#f1efeb] pb-4">
        <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#fdf2f8] text-[#db2777]">
          {draft.photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- local data URL
            <img src={draft.photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-5 w-5" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          {draft.fullName.trim() ? (
            <p className="truncate text-[17px] font-bold leading-tight">{draft.fullName}</p>
          ) : (
            <p className="text-[17px] font-bold leading-tight text-[#d6d3d1]">{h.name}</p>
          )}
          {contacts.length ? (
            <p className="mt-1 truncate text-[10.5px] text-[#57534e]">{contacts.join(" · ")}</p>
          ) : (
            <div className="mt-1.5">
              <Bars widths={["70%"]} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <section className="flex flex-col gap-1.5">
          <Heading>{h.education}</Heading>
          {education ? (
            <div className="text-[11.5px] leading-snug">
              <p className="font-semibold">{draft.university.trim() || "…"}</p>
              <p className="text-[#57534e]">{[draft.degree.trim(), draft.graduationYear.trim()].filter(Boolean).join(", ")}</p>
            </div>
          ) : (
            <Bars widths={["80%", "55%"]} />
          )}
        </section>

        <section className="flex flex-col gap-1.5">
          <Heading>{h.experience}</Heading>
          {experiences.length ? (
            <ul className="flex flex-col gap-2">
              {experiences.map((experience, index) => (
                <li key={index} className="text-[11.5px] leading-snug">
                  <p className="font-semibold">{[experience.role.trim(), experience.place.trim()].filter(Boolean).join(", ") || "…"}</p>
                  {experience.description.trim() ? <p className="line-clamp-3 text-[#57534e]">{experience.description}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <Bars widths={["90%", "75%", "60%"]} />
          )}
        </section>

        <section className="flex flex-col gap-1.5">
          <Heading>{h.skills}</Heading>
          {skills.length ? (
            <div className="flex flex-wrap gap-1">
              {skills.map((skill) => (
                <span key={skill} className="rounded-full bg-[#f5f4f0] px-2 py-0.5 text-[10.5px] font-medium">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <Bars widths={["65%", "40%"]} />
          )}
        </section>
      </div>
    </div>
  );
}
