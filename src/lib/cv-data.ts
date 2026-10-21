/**
 * The CV as data — one object every template renders (and, later, the
 * text PDF). Pure, so the templates and the tests share it.
 */

export const CV_TEMPLATES = ["classic", "modern", "executive", "minimal", "ats"] as const;
export type CvTemplateId = (typeof CV_TEMPLATES)[number];

export const CV_TEMPLATE_INFO: Record<CvTemplateId, { name: string; audience: string; note?: string }> = {
  classic: { name: "კლასიკური", audience: "აკადემია, სამართალი, ფინანსები" },
  modern: { name: "თანამედროვე", audience: "IT, ბიზნესი, მარკეტინგი" },
  executive: { name: "Executive", audience: "მენეჯმენტი, ძლიერი შთაბეჭდილება" },
  minimal: { name: "მინიმალური", audience: "დიზაინი, კრეატიული პროფესიები" },
  ats: {
    name: "ATS-თან თავსებადი",
    audience: "ონლაინ განაცხადები",
    note: "საუკეთესოა ონლაინ განაცხადებისა და საერთაშორისო კომპანიებისთვის: მხოლოდ ტექსტი, რომელსაც ავტომატური ფილტრები (ATS) უშეცდომოდ კითხულობენ.",
  },
};

/** Old template ids (before the professional set) → their closest new one. */
const LEGACY_TEMPLATES: Record<string, CvTemplateId> = {
  "minimal-tech": "modern",
  "creative-ui": "minimal",
  "academic-corporate": "classic",
};

export function normalizeCvTemplate(raw: unknown): CvTemplateId {
  const value = String(raw ?? "");
  if ((CV_TEMPLATES as readonly string[]).includes(value)) return value as CvTemplateId;
  return LEGACY_TEMPLATES[value] ?? "modern";
}

/** Six calm accents; used sparingly (name or headings, thin rules). */
export const CV_ACCENTS = [
  { id: "navy", label: "მუქი ლურჯი", color: "#1e3a5f" },
  { id: "teal", label: "ფირუზისფერი", color: "#0f766e" },
  { id: "burgundy", label: "ბორდო", color: "#7f1d1d" },
  { id: "graphite", label: "გრაფიტი", color: "#374151" },
  { id: "forest", label: "ტყის მწვანე", color: "#166534" },
  { id: "pink", label: "SpaceEdu ვარდისფერი", color: "#be185d" },
] as const;
export type CvAccentId = (typeof CV_ACCENTS)[number]["id"];

export function accentColor(id: string): string {
  return CV_ACCENTS.find((accent) => accent.id === id)?.color ?? CV_ACCENTS[0].color;
}

export type CvLanguage = "ka" | "en";

export type CvSectionId = "summary" | "experience" | "education" | "skills" | "languages" | "links";
/** The order every template uses. */
export const CV_SECTION_ORDER: CvSectionId[] = ["summary", "experience", "education", "skills", "languages", "links"];

export const CV_SECTION_TITLES: Record<CvLanguage, Record<CvSectionId | "contact", string>> = {
  ka: {
    summary: "პროფესიული შეჯამება",
    experience: "გამოცდილება",
    education: "განათლება",
    skills: "უნარები",
    languages: "ენები",
    links: "პორტფოლიო / ბმულები",
    contact: "კონტაქტი",
  },
  en: {
    summary: "Professional Summary",
    experience: "Experience",
    education: "Education",
    skills: "Skills",
    languages: "Languages",
    links: "Portfolio / Links",
    contact: "Contact",
  },
};

export interface CvEducation {
  institution: string;
  degree: string;
  year: string;
}

export interface CvData {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  /** Data URL of the photo, if the user added one. */
  photo: string | null;
  summary: string;
  /** Bullet points (the AI's), or the raw text as one paragraph before generation. */
  experience: string[];
  experienceText: string;
  education: CvEducation[];
  skills: string[];
  softSkills: string[];
  languages: string[];
  links: string[];
}

export interface CvPrefs {
  template: CvTemplateId;
  accent: CvAccentId;
  showPhoto: boolean;
  language: CvLanguage;
}

const filled = (value: string | null | undefined) => Boolean(value && value.trim());

/** Sections with something in them, in the standard order (empty ones are hidden). */
export function visibleSections(data: CvData): CvSectionId[] {
  return CV_SECTION_ORDER.filter((section) => {
    switch (section) {
      case "summary":
        return filled(data.summary);
      case "experience":
        return data.experience.some(filled) || filled(data.experienceText);
      case "education":
        return data.education.some((item) => filled(item.institution) || filled(item.degree));
      case "skills":
        return data.skills.some(filled) || data.softSkills.some(filled);
      case "languages":
        return data.languages.some(filled);
      case "links":
        return data.links.some(filled);
    }
  });
}

/** The photo is shown only when chosen, present, and never on the ATS template. */
export function showsPhoto(template: CvTemplateId, prefs: Pick<CvPrefs, "showPhoto">, data: Pick<CvData, "photo">): boolean {
  return template !== "ats" && prefs.showPhoto && Boolean(data.photo);
}

/** „კოლაბორაცია, პრობლემების გადაჭრა“ → separate skills. */
export function splitList(text: string): string[] {
  return text
    .split(/[,;\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Contact bits on one line: e-mail · phone (links have their own section). */
export function contactItems(data: Pick<CvData, "email" | "phone">): string[] {
  return [data.email, data.phone].map((value) => value.trim()).filter(Boolean);
}

/** The template to start with: what was saved, else ATS when the ATS pill is on, else Modern. */
export function defaultCvTemplate(saved: unknown, atsFocus: boolean): CvTemplateId {
  if (saved) return normalizeCvTemplate(saved);
  return atsFocus ? "ats" : "modern";
}

/** „ნინო ბერიძე“ → „CV_ნინო_ბერიძე.pdf“ (characters a file name can't hold are dropped). */
export function cvFileName(fullName: string): string {
  const parts = fullName
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length ? `CV_${parts.join("_")}.pdf` : "CV.pdf";
}
