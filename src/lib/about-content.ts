import type { Language } from "@/components/LanguageProvider";

/**
 * Copy for the About page, kept in one place so the Georgian and English
 * versions stay structurally identical — the page renders whichever the
 * language switch selects, and TypeScript catches a missing translation.
 *
 * Paragraphs are arrays of segments rather than plain strings so a phrase
 * can be highlighted inline, the way the printed original underlines its
 * keywords.
 */

export type AboutAccent = "blue" | "green" | "pink" | "amber";

export interface AboutSegment {
  text: string;
  accent?: AboutAccent;
}

export interface AboutChapter {
  heading: AboutSegment[];
  body: AboutSegment[][];
}

export interface AboutAudienceItem {
  label: string;
  text: string;
  accent: AboutAccent;
}

export interface AboutContent {
  meta: { title: string; description: string };
  eyebrow: string;
  title: AboutSegment[];
  intro: AboutSegment[];
  chapters: AboutChapter[];
  audience: {
    heading: AboutSegment[];
    items: AboutAudienceItem[];
  };
  values: {
    heading: string;
    items: string[];
  };
  closing: string;
  languageSwitchLabel: string;
}

const ka: AboutContent = {
  meta: {
    title: "ჩვენს შესახებ",
    description:
      "SpaceEdu-ს ისტორია — საიდან გაჩნდა იდეა და რატომ გავხადეთ სწავლა ერთიან სივრცედ.",
  },
  eyebrow: "ჩვენი ისტორია",
  title: [{ text: "საიდან გაჩნდა " }, { text: "იდეა?", accent: "blue" }],
  intro: [
    { text: "ყველაფერი ერთი მარტივი შეკითხვით დაიწყო — " },
    { text: "რატომ არის სწავლა ასეთი გაფანტული?", accent: "green" },
  ],
  chapters: [
    {
      heading: [{ text: "აკადემიური " }, { text: "ქაოსი", accent: "pink" }],
      body: [
        [
          {
            text: "კონსპექტები ერთ რვეულში, ლექციები მეორეში, სავარჯიშოები — ტელეფონში. საგამოცდო მასალა კი ათ სხვადასხვა საიტზე მიმოფანტული.",
          },
        ],
        [
          { text: "დროის ნახევარი იმაზე მიდიოდა, რომ გენახა, " },
          { text: "სად რა გქონდა", accent: "amber" },
          { text: " — და არა იმაზე, რომ გესწავლა." },
        ],
      ],
    },
    {
      heading: [{ text: "ჩვენ ეს გავხადეთ " }, { text: "ერთიანი სივრცე", accent: "blue" }],
      body: [
        [
          {
            text: "SpaceEdu დაიბადა როგორც ერთი ადგილი, სადაც შენი სასწავლო გეგმა, კონსპექტები, ქვიზები და AI მასწავლებელი ერთმანეთს ელაპარაკებიან.",
          },
        ],
        [
          { text: "არა კიდევ ერთი აპლიკაცია — არამედ სივრცე, რომელიც " },
          { text: "შენს ტემპს ერგება", accent: "green" },
          { text: "." },
        ],
      ],
    },
  ],
  audience: {
    heading: [{ text: "SpaceEdu " }, { text: "შენთვისაა", accent: "pink" }],
    items: [
      {
        label: "აბიტურიენტს",
        text: "ეროვნული გამოცდების არქივი, იმიტირებული ტესტები და წერითი დავალების შემფასებელი.",
        accent: "blue",
      },
      {
        label: "სტუდენტს",
        text: "ლექციების კონსპექტები, სემესტრის გეგმა და მასალის სწრაფი ანალიზი.",
        accent: "green",
      },
      {
        label: "მოსწავლეს",
        text: "საგნების მარტივი ახსნა, ქვიზები და ყოველდღიური სასწავლო რიტმი.",
        accent: "amber",
      },
    ],
  },
  values: {
    heading: "რაშიც გვჯერა",
    items: ["ყველაფერი ერთ სივრცეში", "მარტივად, ზედმეტი ხმაურის გარეშე", "შენს ტემპზე მორგებული"],
  },
  closing: "შენი პერსონალური სასწავლო სივრცე — სკოლიდან უნივერსიტეტამდე.",
  languageSwitchLabel: "ენის შეცვლა",
};

const en: AboutContent = {
  meta: {
    title: "About us",
    description:
      "The story behind SpaceEdu — where the idea came from, and why we turned studying into one single space.",
  },
  eyebrow: "Our story",
  title: [{ text: "Where did the " }, { text: "idea", accent: "blue" }, { text: " come from?" }],
  intro: [
    { text: "It started with one simple question — " },
    { text: "why is studying so scattered?", accent: "green" },
  ],
  chapters: [
    {
      heading: [{ text: "Academic " }, { text: "chaos", accent: "pink" }],
      body: [
        [
          {
            text: "Notes in one notebook, lectures in another, exercises on your phone. Exam material spread across ten different websites.",
          },
        ],
        [
          { text: "Half the time went into finding " },
          { text: "where things were", accent: "amber" },
          { text: " — not into actually learning them." },
        ],
      ],
    },
    {
      heading: [{ text: "So we made it " }, { text: "one single space", accent: "blue" }],
      body: [
        [
          {
            text: "SpaceEdu started as one place where your study plan, notes, quizzes and AI teacher all talk to each other.",
          },
        ],
        [
          { text: "Not another app — a space that " },
          { text: "moves at your pace", accent: "green" },
          { text: "." },
        ],
      ],
    },
  ],
  audience: {
    heading: [{ text: "SpaceEdu is " }, { text: "for you", accent: "pink" }],
    items: [
      {
        label: "Exam candidates",
        text: "The national exam archive, timed mock papers and an essay grader.",
        accent: "blue",
      },
      {
        label: "Students",
        text: "Lecture notes, a semester plan and quick analysis of your material.",
        accent: "green",
      },
      {
        label: "Pupils",
        text: "Subjects explained simply, quizzes and a daily study rhythm.",
        accent: "amber",
      },
    ],
  },
  values: {
    heading: "What we believe in",
    items: ["Everything in one space", "Simple, without the noise", "Built around your pace"],
  },
  closing: "Your personal learning space — from school to university.",
  languageSwitchLabel: "Change language",
};

export const ABOUT_CONTENT: Record<Language, AboutContent> = { ka, en };
