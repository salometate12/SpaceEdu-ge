import { BookOpenCheck, FileSearch, GraduationCap, Lightbulb, NotebookPen, type LucideIcon } from "lucide-react";

export type SmartSpace = "school" | "exam" | "university";

export interface SmartSpaceOption {
  id: SmartSpace;
  label: string;
}

export const SMART_SPACE_OPTIONS: SmartSpaceOption[] = [
  { id: "school", label: "🎒 სკოლის სივრცე" },
  { id: "exam", label: "🧠 საგამოცდო სივრცე" },
  { id: "university", label: "🎓 საუნივერსიტეტო სივრცე" },
];

export interface SideToolItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const SCHOOL_SPACE_ITEMS: SideToolItem[] = [
  { id: "homework", label: "საშინაო დავალება", icon: NotebookPen },
  { id: "eli5", label: "მარტივი ახსნა (ELI5)", icon: Lightbulb },
  { id: "subjects", label: "საგნები", icon: BookOpenCheck },
];

export const UNIVERSITY_SPACE_ITEMS: SideToolItem[] = [
  { id: "syllabus-summary", label: "სილაბუსის კონსპექტი", icon: GraduationCap },
  { id: "pdf-research", label: "PDF მკვლევარი (ატვირთვა)", icon: FileSearch },
  { id: "academic-translation", label: "აკადემიური თარგმანი", icon: NotebookPen },
  { id: "sources-search", label: "სამეცნიერო წყაროების ძებნა", icon: BookOpenCheck },
];

export function normalizeSmartSpace(value: string | undefined): SmartSpace {
  if (value === "school" || value === "university") return value;
  return "exam";
}

export function getSmartSpaceSystemInstruction(space: SmartSpace): string {
  if (space === "school") {
    return "Explain concepts using highly engaging, simple, and friendly Georgian, suitable for a school student.";
  }
  if (space === "exam") {
    return "Act as a strict, highly academic NAEC national exam tutor, focusing on official exam criteria and structured matrices.";
  }
  if (space === "university") {
    return "Act as a rigorous university professor. Provide deep critical analysis, complex academic Georgian vocabulary, and structure your responses with precise source citations.";
  }
  return "";
}
