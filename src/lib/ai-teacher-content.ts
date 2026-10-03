import {
  BookOpen,
  Calculator,
  ClipboardCheck,
  Dna,
  FileText,
  GraduationCap,
  Globe2,
  Landmark,
  ListChecks,
  PenLine,
  Presentation,
  Sigma,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";

/** The two AI teachers: university courses vs. national-exam prep. */
export type AiTeacherSpace = "student" | "abiturient";

export type AiTeacherAccent = "emerald" | "cyan" | "violet" | "amber";

export interface AiTeacherSuggestion {
  title: string;
  prompt: string;
  icon: LucideIcon;
  /** A CSS colour for the card's icon chip. */
  color: string;
}

export interface AiTeacherPanelTopic {
  icon: LucideIcon;
  title: string;
  /** Small line under the title; also sent to the AI as the subject. */
  subject: string;
  accent: AiTeacherAccent;
  greeting: string;
  followUps: { label: string; prompt: string }[];
}

export interface AiTeacherContent {
  headerTitle: string;
  headerSubtitle: string;
  /** First line of the greeting; `{name}` is the user's first name. */
  greetingWithName: string;
  greetingWithoutName: string;
  /** The gradient second line of the greeting. */
  greetingQuestion: string;
  intro: string;
  placeholder: string;
  emptyHistory: string;
  suggestions: AiTeacherSuggestion[];
  panelTopics: AiTeacherPanelTopic[];
}

/**
 * Every text the AI-teacher page (`ChatInterface`) and the floating chat
 * window (`AIChatSidePanel`) show, per space. The whole UI speaks in the
 * informal „შენ“ form.
 */
export const AI_TEACHER_CONTENT: Record<AiTeacherSpace, AiTeacherContent> = {
  student: {
    headerTitle: "AI მასწავლებელი",
    headerSubtitle: "უნივერსიტეტის კურსები და ლექციები",
    greetingWithName: "გამარჯობა, {name}!",
    greetingWithoutName: "გამარჯობა!",
    greetingQuestion: "რომელ საგანზე ვიმუშაოთ დღეს?",
    intro:
      "მკითხე ლექციის მასალაზე, სემინარის საკითხზე ან გამოცდისთვის მზადებაზე. აგიხსნი ნაბიჯ-ნაბიჯ, მაგალითებით და ზუსტი ტერმინებით.",
    placeholder: "მკითხე ლექციაზე, დავალებაზე ან გამოცდაზე...",
    emptyHistory: "აქ გამოჩნდება შენი ბოლო საუბრები ლექციებსა და დავალებებზე.",
    suggestions: [
      {
        title: "ლექციის თემის ახსნა",
        prompt: "ამიხსენი მოთხოვნის ფასით ელასტიურობა — ინტუიცია, ფორმულა და რეალური მაგალითი.",
        icon: Presentation,
        color: "var(--accent-green)",
      },
      {
        title: "შუალედურისთვის მზადება",
        prompt:
          "ერთ კვირაში სტატისტიკის შუალედური მაქვს. დამიგეგმე გამეორება დღეების მიხედვით და ჩამომიწერე ტიპური საკითხები.",
        icon: ClipboardCheck,
        color: "var(--accent-cyan)",
      },
      {
        title: "ესეს სტრუქტურა",
        prompt:
          "დამეხმარე აკადემიური ესეს სტრუქტურის აწყობაში თემაზე „ხელოვნური ინტელექტი განათლებაში“: თეზისი, არგუმენტები, დასკვნა.",
        icon: PenLine,
        color: "var(--accent-purple)",
      },
      {
        title: "ამოცანის გარჩევა",
        prompt: "ნაბიჯ-ნაბიჯ ამიხსენი, როგორ ვპოულობ ფუნქციის ექსტრემუმს წარმოებულით, ამოხსნილი მაგალითით.",
        icon: TrendingUp,
        color: "var(--accent-amber)",
      },
    ],
    panelTopics: [
      {
        icon: Presentation,
        title: "ლექცია",
        subject: "ლექციის მასალა",
        accent: "emerald",
        greeting: "მზად ვარ! რომელი ლექციის თემა გავარჩიოთ?",
        followUps: [
          { label: "მთავარი იდეები", prompt: "ჩამომიწერე ამ თემის მთავარი იდეები და ტერმინები" },
          { label: "მარტივად ახსნა", prompt: "ამიხსენი ეს თემა მარტივად, მაგალითით" },
        ],
      },
      {
        icon: GraduationCap,
        title: "გამოცდა",
        subject: "შუალედური და ფინალური",
        accent: "cyan",
        greeting: "შუალედური თუ ფინალური? მოდი, ერთად მოვემზადოთ.",
        followUps: [
          {
            label: "გამეორების გეგმა",
            prompt: "შემიდგინე გამოცდამდე გამეორების გეგმა დღეების მიხედვით და ჩამომიწერე ტიპური საკითხები",
          },
          {
            label: "საცდელი კითხვები",
            prompt: "მომეცი 5 ღია კითხვა ამ თემაზე და შემიმოწმე პასუხები",
          },
        ],
      },
      {
        icon: FileText,
        title: "აკადემიური წერა",
        subject: "ესე, რეფერატი, საკურსო",
        accent: "violet",
        greeting: "ესე, რეფერატი თუ საკურსო — საიდან დავიწყოთ?",
        followUps: [
          {
            label: "სტრუქტურა",
            prompt: "დამეხმარე ნაშრომის სტრუქტურის აწყობაში: თეზისი, არგუმენტები და დასკვნა",
          },
          { label: "წყაროების ციტირება", prompt: "ამიხსენი APA სტილით ციტირება მაგალითებით" },
        ],
      },
      {
        icon: Sigma,
        title: "ამოცანა",
        subject: "ნაბიჯ-ნაბიჯ ამოხსნა",
        accent: "amber",
        greeting: "გამომიგზავნე ამოცანა და ნაბიჯ-ნაბიჯ გავარჩევთ.",
        followUps: [
          {
            label: "ამოხსნის ლოგიკა",
            prompt: "ამიხსენი ამ ამოცანის ამოხსნის ლოგიკა: საიდან დავიწყო და რატომ",
          },
          {
            label: "მსგავსი ამოცანა",
            prompt: "მომეცი მსგავსი ამოცანა სავარჯიშოდ და ბოლოს შემიმოწმე ამოხსნა",
          },
        ],
      },
    ],
  },
  abiturient: {
    headerTitle: "AI მასწავლებელი",
    headerSubtitle: "ეროვნული გამოცდებისთვის მზადება",
    greetingWithName: "გამარჯობა, {name}!",
    greetingWithoutName: "გამარჯობა!",
    greetingQuestion: "რომელ საგანს ვიმეცადინოთ?",
    intro:
      "აგიხსნი ნებისმიერ თემას ეროვნული გამოცდების პროგრამის მიხედვით: მაგალითებით, ტიპური ხაფანგებით და გამოცდის სტილის ამოცანებით.",
    placeholder: "მკითხე ნებისმიერ საგანზე ან თემაზე...",
    emptyHistory: "აქ გამოჩნდება შენი ბოლო საუბრები გამოცდისთვის მზადებაზე.",
    suggestions: [
      {
        title: "მათემატიკა",
        prompt: "ამიხსენი კვადრატული განტოლების ამოხსნის ხერხები და როგორ მოდის ეს თემა გამოცდაზე.",
        icon: Calculator,
        color: "var(--accent-green)",
      },
      {
        title: "ქართული ლიტერატურა",
        prompt: "ამიხსენი „ვეფხისტყაოსნის“ მთავარი იდეა და პერსონაჟები: რა უნდა ვიცოდე გამოცდისთვის?",
        icon: BookOpen,
        color: "var(--accent-cyan)",
      },
      {
        title: "ისტორია",
        prompt: "ამიხსენი საქართველოს გაერთიანების მიზეზები და შედეგები, თარიღებითა და მთავარი პირებით.",
        icon: Landmark,
        color: "var(--accent-purple)",
      },
      {
        title: "ტესტის ვარჯიში",
        prompt:
          "მომეცი 5 გამოცდის სტილის ტესტური კითხვა ინგლისურის გრამატიკაზე და ბოლოს შემიმოწმე პასუხები.",
        icon: ListChecks,
        color: "var(--accent-amber)",
      },
    ],
    panelTopics: [
      {
        icon: Dna,
        title: "ბიოლოგია",
        subject: "ბიოლოგია",
        accent: "emerald",
        greeting: "მზად ვარ! ბიოლოგიის რომელი თემა გაინტერესებს? 🧬",
        followUps: [
          { label: "უჯრედის აგებულება", prompt: "ამიხსენი უჯრედის აგებულება და ორგანოიდები." },
          { label: "გამოცდის სტილის კითხვა", prompt: "მომეცი 3 გამოცდის სტილის კითხვა ამ თემაზე" },
        ],
      },
      {
        icon: Sigma,
        title: "ფორმულა",
        subject: "მათემატიკა",
        accent: "cyan",
        greeting: "მზად ვარ! მათემატიკის რომელი თემა გაინტერესებს? 📐",
        followUps: [
          {
            label: "კვადრატული განტოლება",
            prompt: "ამიხსენი კვადრატული განტოლების ამოხსნის წესი მაგალითით.",
          },
          { label: "გამოცდის სტილის კითხვა", prompt: "მომეცი 3 გამოცდის სტილის კითხვა ამ თემაზე" },
        ],
      },
      {
        icon: BookOpen,
        title: "ლიტერატურა",
        subject: "ქართული ენა და ლიტერატურა",
        accent: "violet",
        greeting: "მზად ვარ! ქართული ენისა და ლიტერატურის რომელი თემა გაინტერესებს? 📚",
        followUps: [
          {
            label: "ლიტერატურული ანალიზი",
            prompt: "დამეხმარე ვეფხისტყაოსნის მთავარი გმირების ანალიზში.",
          },
          { label: "გამოცდის სტილის კითხვა", prompt: "მომეცი 3 გამოცდის სტილის კითხვა ამ თემაზე" },
        ],
      },
      {
        icon: Globe2,
        title: "ისტორია",
        subject: "ისტორია",
        accent: "amber",
        greeting: "მზად ვარ! ისტორიის რომელი პერიოდი გაინტერესებს? 🌍",
        followUps: [
          {
            label: "საქართველოს ისტორია",
            prompt: "ამიხსენი საქართველოს გაერთიანების ისტორია მოკლედ.",
          },
          { label: "გამოცდის სტილის კითხვა", prompt: "მომეცი 3 გამოცდის სტილის კითხვა ამ თემაზე" },
        ],
      },
    ],
  },
};

/** Abiturient and school users get the exam-prep teacher; everyone else
 * (students, and an unknown space) the university one. */
export function aiTeacherSpaceFor(space: SpaceeduSpace | null | undefined): AiTeacherSpace {
  return space === "abiturient" || space === "school" ? "abiturient" : "student";
}
