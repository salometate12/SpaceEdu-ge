/**
 * Text handed from one page to a tool it opens (the journal's „AI
 * დახმარება“ → the flashcard generator or the quiz): written to
 * sessionStorage right before navigating, read once by the tool.
 */
export type HandoffTarget = "cards" | "quiz";

export interface Handoff {
  title: string;
  text: string;
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
    return typeof parsed.text === "string" ? { title: String(parsed.title ?? ""), text: parsed.text } : null;
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

/** A new presentation's first step, filled in by the page that opens it (the task helper's structure). */
export interface PresentationHandoff {
  topic: string;
  subject?: string;
  slideCount?: number;
  extraInstructions?: string;
}

const PRESENTATION_KEY = "spaceedu-handoff:presentation";

export function handOffPresentation(value: PresentationHandoff): void {
  try {
    window.sessionStorage.setItem(PRESENTATION_KEY, JSON.stringify(value));
  } catch {
    // storage blocked: the wizard simply opens empty
  }
}

/** The handed-over form, once. */
export function takePresentationHandoff(): PresentationHandoff | null {
  try {
    const raw = window.sessionStorage.getItem(PRESENTATION_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(PRESENTATION_KEY);
    const parsed = JSON.parse(raw) as Partial<PresentationHandoff>;
    return typeof parsed.topic === "string" ? (parsed as PresentationHandoff) : null;
  } catch {
    return null;
  }
}
