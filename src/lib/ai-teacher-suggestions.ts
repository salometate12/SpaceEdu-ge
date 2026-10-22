/**
 * The AI teacher's four starting cards, built from what the student already
 * has: their semester subjects, the latest journal entry on a subject, and
 * the upcoming dates from the syllabus analyser (abiturient: their exam
 * subjects). Templates only — no AI call, no credit. Pure, so it's testable.
 */

export type SuggestionKind = "lecture" | "exam" | "assignment" | "quiz";

export interface Suggestion {
  kind: SuggestionKind;
  title: string;
  /** The subject chip under the title; null on the general cards. */
  subject: string | null;
  subjectColor: string | null;
  description: string;
  /** Sent as the question when the card is tapped. */
  prompt: string;
  /** Sent along as reference material: subject, entry title, date. */
  context?: string;
}

export interface SuggestionSubject {
  name: string;
  color: string;
}

export interface SuggestionNote {
  title: string;
  subject?: string;
  /** YYYY-MM-DD */
  date: string;
  updatedAt: number;
}

export interface SuggestionEvent {
  title: string;
  /** YYYY-MM-DD */
  date: string;
  type: "midterm" | "quiz" | "final" | "deadline" | "study";
  description?: string;
}

export interface SuggestionContext {
  space: "student" | "abiturient";
  /** The subjects the student added; empty = none. */
  subjects: SuggestionSubject[];
  notes: SuggestionNote[];
  events: SuggestionEvent[];
  /** Today, YYYY-MM-DD. */
  today: string;
  /** The general cards, when there's nothing of the student's to build on. */
  fallback: { title: string; prompt: string }[];
}

const KIND_ORDER: SuggestionKind[] = ["lecture", "exam", "assignment", "quiz"];

const MONTHS_SHORT = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];
const WEEKDAYS = ["კვირას", "ორშაბათს", "სამშაბათს", "ოთხშაბათს", "ხუთშაბათს", "პარასკევს", "შაბათს"];

function parseDay(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  return Date.UTC(year, (month || 1) - 1, day || 1);
}

/** Whole days from `today` to `date` (0 = today). */
export function daysUntil(date: string, today: string): number {
  return Math.round((parseDay(date) - parseDay(today)) / 86_400_000);
}

/** „15 ოქტ“ */
export function shortDate(iso: string): string {
  const [, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS_SHORT[(month || 1) - 1]}`;
}

/** „დღეს“, „ხვალ“, a weekday within the week, else „15 ოქტ-ს“. */
export function dueDay(date: string, today: string): string {
  const days = daysUntil(date, today);
  if (days === 0) return "დღეს";
  if (days === 1) return "ხვალ";
  if (days < 7) return WEEKDAYS[new Date(parseDay(date)).getUTCDay()];
  return `${shortDate(date)}-ს`;
}

/**
 * „სტატისტიკა“ → „სტატისტიკაზე“, „სტრუქტურები“ → „სტრუქტურებზე“; an
 * adjective in front agrees too: „ქართული ენა“ → „ქართულ ენაზე“.
 */
export function onSubject(name: string): string {
  const dropI = (word: string) => (word.endsWith("ი") ? word.slice(0, -1) : word);
  const words = name.trim().split(/\s+/);
  const last = words.pop() ?? "";
  return [...words.map(dropI), `${dropI(last)}ზე`].join(" ");
}

const EXAM_LABEL: Partial<Record<SuggestionEvent["type"], string>> = {
  midterm: "შუალედური",
  final: "ფინალური",
  quiz: "ქვიზი",
};

/** The subject an event is about, when its title or description names one. */
function subjectOf(text: string, subjects: SuggestionSubject[]): SuggestionSubject | null {
  const lower = text.toLowerCase();
  return subjects.find((subject) => lower.includes(subject.name.toLowerCase())) ?? null;
}

function general(ctx: SuggestionContext): Suggestion[] {
  return ctx.fallback.slice(0, 4).map((card, index) => ({
    kind: KIND_ORDER[index % KIND_ORDER.length],
    title: card.title,
    subject: null,
    subjectColor: null,
    description: card.prompt,
    prompt: card.prompt,
  }));
}

/** Hands out subjects so the cards differ while there are enough of them. */
function subjectPicker(subjects: SuggestionSubject[]) {
  const used = new Set<string>();
  let turn = 0;
  return (preferred?: SuggestionSubject | null): SuggestionSubject => {
    const pick = preferred ?? subjects.find((subject) => !used.has(subject.name)) ?? subjects[turn % subjects.length];
    used.add(pick.name);
    turn += 1;
    return pick;
  };
}

function abiturient(ctx: SuggestionContext): Suggestion[] {
  const pick = subjectPicker(ctx.subjects);
  const chip = (subject: SuggestionSubject) => ({ subject: subject.name, subjectColor: subject.color });
  const a = pick();
  const b = pick();
  const c = pick();
  const d = pick();
  return [
    {
      kind: "lecture",
      title: "თემის ახსნა",
      ...chip(a),
      description: `${a.name}: რთული თემა მარტივად, მაგალითით`,
      prompt: `${a.name}-ის ეროვნული გამოცდის ერთ-ერთი რთული თემა ამიხსენი მარტივად, მაგალითით.`,
      context: `საგამოცდო საგანი: ${a.name}`,
    },
    {
      kind: "exam",
      title: "ტიპური ამოცანა",
      ...chip(b),
      description: `${b.name}: ტესტის ტიპური ამოცანა`,
      prompt: `${b.name}-ის ეროვნული გამოცდის ერთი ტიპური ამოცანა მომეცი და ნაბიჯ-ნაბიჯ გავარჩიოთ.`,
      context: `საგამოცდო საგანი: ${b.name}`,
    },
    {
      kind: "assignment",
      title: "გასული წლის საკითხი",
      ...chip(c),
      description: `${c.name}: გასული წლის საკითხის გარჩევა`,
      prompt: `${c.name}-ის გასული წლების ეროვნული გამოცდის ტიპის ერთი საკითხი გავარჩიოთ: პირობა, ამოხსნა და ხშირი შეცდომები.`,
      context: `საგამოცდო საგანი: ${c.name}`,
    },
    {
      kind: "quiz",
      title: "სწრაფი ქვიზი",
      ...chip(d),
      description: `5 კითხვა ${onSubject(d.name)}`,
      prompt: `ქვიზი გამიკეთე: 5 კითხვა ${onSubject(d.name)}, ეროვნული გამოცდის დონით. ჯერ კითხვები, პასუხები ბოლოს.`,
      context: `საგამოცდო საგანი: ${d.name}`,
    },
  ];
}

export function buildSuggestions(ctx: SuggestionContext): Suggestion[] {
  if (ctx.subjects.length === 0) return general(ctx);
  if (ctx.space === "abiturient") return abiturient(ctx);

  const { subjects, today } = ctx;
  const pick = subjectPicker(subjects);
  const chip = (subject: SuggestionSubject) => ({ subject: subject.name, subjectColor: subject.color });
  const upcoming = ctx.events
    .filter((event) => /^\d{4}-\d{2}-\d{2}$/.test(event.date) && daysUntil(event.date, today) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  const notesOnSubjects = ctx.notes
    .filter((note) => note.title.trim() && note.subject && subjects.some((subject) => subject.name === note.subject))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  // 1. The subject of the latest journal entry.
  const latest = notesOnSubjects[0];
  const lectureSubject = pick(latest ? subjects.find((subject) => subject.name === latest.subject) : null);
  const lecture: Suggestion = latest
    ? {
        kind: "lecture",
        title: "ლექციის თემის ახსნა",
        ...chip(lectureSubject),
        description: `ბოლო ლექცია: ${latest.title.trim()} — ამიხსენი მაგალითით`,
        prompt: `ამიხსენი ლექციის თემა „${latest.title.trim()}“ (${lectureSubject.name}) მარტივად, ერთი რეალური მაგალითით.`,
        context: `საგანი: ${lectureSubject.name}. ბოლო ლექციის ჩანაწერი: „${latest.title.trim()}“ (${latest.date}).`,
      }
    : {
        kind: "lecture",
        title: "ლექციის თემის ახსნა",
        ...chip(lectureSubject),
        description: `${lectureSubject.name}: მთავარი ცნებები — ამიხსენი მაგალითით`,
        prompt: `${lectureSubject.name}-ის მთავარი ცნებები ამიხსენი მარტივად, ერთი რეალური მაგალითით.`,
        context: `საგანი: ${lectureSubject.name}.`,
      };

  // 2. The nearest exam.
  const exam = upcoming.find((event) => event.type === "midterm" || event.type === "final" || event.type === "quiz");
  const examSubject = pick(exam ? subjectOf(`${exam.title} ${exam.description ?? ""}`, subjects) : null);
  let examCard: Suggestion;
  if (exam) {
    const days = Math.max(1, daysUntil(exam.date, today));
    const label = EXAM_LABEL[exam.type] ?? "გამოცდა";
    examCard = {
      kind: "exam",
      title: "გამოცდისთვის მზადება",
      ...chip(examSubject),
      description: `${label} ${shortDate(exam.date)} — ${days}-დღიანი გეგმა`,
      prompt: `${shortDate(exam.date)}-ს მაქვს ${label} („${exam.title}“), ${days} დღე დარჩა. შემიდგინე ${days}-დღიანი გამეორების გეგმა დღეების მიხედვით და ჩამომიწერე ტიპური საკითხები.`,
      context: `საგანი: ${examSubject.name}. ${label}: „${exam.title}“, ${exam.date}.`,
    };
  } else {
    examCard = {
      kind: "exam",
      title: "გამოცდისთვის მზადება",
      ...chip(examSubject),
      description: `${examSubject.name}: გამეორების გეგმა`,
      prompt: `${examSubject.name}-ის გამოცდისთვის შემიდგინე ერთკვირიანი გამეორების გეგმა და ჩამომიწერე ტიპური საკითხები.`,
      context: `საგანი: ${examSubject.name}.`,
    };
  }

  // 3. The nearest deadline.
  const due = upcoming.find((event) => event.type === "deadline");
  const dueSubject = pick(due ? subjectOf(`${due.title} ${due.description ?? ""}`, subjects) : null);
  const assignment: Suggestion = due
    ? {
        kind: "assignment",
        title: "დავალებაში დახმარება",
        ...chip(dueSubject),
        description: `„${due.title}“ — ჩაბარება ${dueDay(due.date, today)}, გავარჩიოთ ნაბიჯ-ნაბიჯ`,
        prompt: `დავალება „${due.title}“ ${dueDay(due.date, today)} უნდა ჩავაბარო. გავარჩიოთ ნაბიჯ-ნაბიჯ: საიდან დავიწყო და რა უნდა შევამოწმო.`,
        context: `საგანი: ${dueSubject.name}. დავალება: „${due.title}“, ჩაბარება ${due.date}.`,
      }
    : {
        kind: "assignment",
        title: "დავალებაში დახმარება",
        ...chip(dueSubject),
        description: `${dueSubject.name}: დავალების ნაბიჯ-ნაბიჯ გარჩევა`,
        prompt: `${dueSubject.name}-ის დავალებაში დამეხმარე: ტიპური ამოცანა ნაბიჯ-ნაბიჯ გავარჩიოთ.`,
        context: `საგანი: ${dueSubject.name}.`,
      };

  // 4. The subject left alone the longest (no entry at all comes first).
  const lastWorked = (subject: SuggestionSubject) =>
    notesOnSubjects.find((note) => note.subject === subject.name)?.updatedAt ?? -Infinity;
  const stalest = [...subjects].sort((a, b) => lastWorked(a) - lastWorked(b))[0];
  const quizSubject = pick(subjects.length > 1 ? stalest : null);
  const topic = notesOnSubjects.find((note) => note.subject === quizSubject.name)?.title.trim();
  const quiz: Suggestion = {
    kind: "quiz",
    title: "სწრაფი ქვიზი",
    ...chip(quizSubject),
    description: topic ? `5 კითხვა თემაზე „${topic}“` : `5 კითხვა ${onSubject(quizSubject.name)}`,
    prompt: topic
      ? `ქვიზი გამიკეთე: 5 კითხვა თემაზე „${topic}“ (${quizSubject.name}). ჯერ კითხვები, პასუხები ბოლოს.`
      : `ქვიზი გამიკეთე: 5 კითხვა ${onSubject(quizSubject.name)}. ჯერ კითხვები, პასუხები ბოლოს.`,
    context: `საგანი: ${quizSubject.name}.${topic ? ` თემა: „${topic}“.` : ""}`,
  };

  return [lecture, examCard, assignment, quiz];
}
