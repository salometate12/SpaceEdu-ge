/**
 * Text handed from one page to a tool it opens (the journal's „AI
 * დახმარება“ → the flashcard generator or the quiz): written to
 * sessionStorage right before navigating, read once by the tool.
 */
export type HandoffTarget = "cards" | "quiz";

export interface Handoff {
  title: string;
  text: string;
  /** „ჩემი საგნები“: the subject and topic what's made belongs to. */
  link?: { subjectId: string; topicId: string };
}

const key = (target: HandoffTarget) => `spaceedu-handoff:${target}`;

export function handOff(target: HandoffTarget, value: Handoff): void {
  try {
    window.sessionStorage.setItem(key(target), JSON.stringify(value));
  } catch {
    // storage blocked: the tool simply opens empty
  }
}

/** The handed-over text, once (it's removed as it's read). */
export function takeHandoff(target: HandoffTarget): Handoff | null {
  try {
    const raw = window.sessionStorage.getItem(key(target));
    if (!raw) return null;
    window.sessionStorage.removeItem(key(target));
    const parsed = JSON.parse(raw) as Partial<Handoff>;
    if (typeof parsed.text !== "string") return null;
    const link = parsed.link && typeof parsed.link.subjectId === "string" && typeof parsed.link.topicId === "string" ? { subjectId: parsed.link.subjectId, topicId: parsed.link.topicId } : undefined;
    return { title: String(parsed.title ?? ""), text: parsed.text, ...(link ? { link } : {}) };
  } catch {
    return null;
  }
}

/** Whether a tool has text waiting (it should open on its „ახალი“ tab). */
export function hasHandoff(target: HandoffTarget): boolean {
  try {
    return window.sessionStorage.getItem(key(target)) !== null;
  } catch {
    return false;
  }
}

/**
 * A new presentation, filled in by the page that opens it: every field of
 * the wizard's steps (info, design, details). What isn't given keeps the
 * wizard's default. `autoStart` skips the steps and starts generating.
 */
export interface PresentationHandoff {
  topic: string;
  subject?: string;
  slideCount?: number;
  /** „ბაკალავრიატი“ / „მაგისტრატურა“ / „დოქტორანტურა“. */
  level?: string;
  /** The wizard's language value: „ქართული“ / „ინგლისური“ / „ქართული + ინგლისური“. */
  language?: string;
  extraInstructions?: string;
  /** A design's id (lib/presentation-templates). */
  theme?: string;
  /** „დეტალები“. */
  goal?: string;
  audience?: string;
  tone?: string;
  keyPoint?: string;
  /** Straight to generating, without the steps. */
  autoStart?: boolean;
  /** Where it was made from: the way back, and the link between the two. */
  source?: { kind: "task-helper"; id: string };
  /** „ჩემი საგნები“: what the presentation is for. */
  subjectId?: string;
  topicId?: string;
}

const PRESENTATION_KEY = "spaceedu-handoff:presentation";

export function handOffPresentation(value: PresentationHandoff): void {
  try {
    window.sessionStorage.setItem(PRESENTATION_KEY, JSON.stringify(value));
  } catch {
    // storage blocked: the wizard simply opens empty
  }
}

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value : undefined);

/** Only fields of the right type survive (the rest fall back to the wizard's defaults). */
export function parsePresentationHandoff(value: unknown): PresentationHandoff | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.topic !== "string") return null;
  const source = raw.source as Record<string, unknown> | undefined;
  const handed: PresentationHandoff = { topic: raw.topic };
  for (const key of ["subject", "level", "language", "extraInstructions", "theme", "goal", "audience", "tone", "keyPoint", "subjectId", "topicId"] as const) {
    const field = text(raw[key]);
    if (field !== undefined) handed[key] = field;
  }
  if (typeof raw.slideCount === "number" && Number.isFinite(raw.slideCount)) handed.slideCount = raw.slideCount;
  if (raw.autoStart === true) handed.autoStart = true;
  if (source?.kind === "task-helper" && typeof source.id === "string" && source.id) handed.source = { kind: "task-helper", id: source.id };
  return handed;
}

/** The handed-over form, once. */
export function takePresentationHandoff(): PresentationHandoff | null {
  try {
    const raw = window.sessionStorage.getItem(PRESENTATION_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(PRESENTATION_KEY);
    return parsePresentationHandoff(JSON.parse(raw));
  } catch {
    return null;
  }
}
