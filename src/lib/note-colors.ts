/**
 * The colours a note can be written in.
 *
 * Full class strings per colour rather than an interpolated colour name,
 * because Tailwind only generates the classes it can see in the source.
 * The roles map to where the colour actually lands in the notes widget:
 * the sheet the note is written on, its fields, its tab, and the chips
 * and bubbles that belong to it.
 */

export type NoteColor = "emerald" | "amber" | "sky" | "pink" | "violet";

export interface NoteColorScheme {
  /** Georgian label, shown as the swatch's title. */
  label: string;
  /** The note's own sheet. */
  card: string;
  /** Small uppercase field labels. */
  label_: string;
  /** Body copy that belongs to the note rather than the app. */
  body: string;
  /** Inputs and the long-form textarea. */
  field: string;
  /** The selected tab, and the selected keyword chip. */
  selected: string;
  /** Keyword chips and quick prompts. */
  chip: string;
  /** The reader's own chat bubble. */
  bubble: string;
  /** Solid buttons: new note, send. */
  solid: string;
  /** Icon tint. */
  icon: string;
  /** The picker dot. */
  swatch: string;
}

export const NOTE_COLORS: Record<NoteColor, NoteColorScheme> = {
  emerald: {
    label: "მწვანე",
    card: "border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-300/15 dark:bg-emerald-300/[0.06]",
    label_: "text-emerald-800/70 dark:text-emerald-200/80",
    body: "text-emerald-900/70 dark:text-emerald-100/70",
    field:
      "border-emerald-900/10 focus:border-emerald-600/40 dark:border-white/10",
    selected:
      "border-emerald-400 bg-emerald-100 text-emerald-900 dark:border-emerald-300/40 dark:bg-emerald-400/20 dark:text-emerald-100",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100",
    bubble: "bg-emerald-100 text-emerald-950 dark:bg-emerald-400/20 dark:text-emerald-50",
    solid:
      "bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400",
    icon: "text-emerald-600 dark:text-emerald-400",
    swatch: "bg-emerald-500",
  },
  amber: {
    label: "ქარვისფერი",
    card: "border-amber-200/80 bg-amber-50/70 dark:border-amber-300/15 dark:bg-amber-300/[0.06]",
    label_: "text-amber-800/70 dark:text-amber-200/80",
    body: "text-amber-900/70 dark:text-amber-100/70",
    field: "border-amber-900/10 focus:border-amber-600/40 dark:border-white/10",
    selected:
      "border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-300/40 dark:bg-amber-400/20 dark:text-amber-100",
    chip: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100",
    bubble: "bg-amber-100 text-amber-950 dark:bg-amber-400/20 dark:text-amber-50",
    solid:
      "bg-amber-600 text-white hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400",
    icon: "text-amber-600 dark:text-amber-400",
    swatch: "bg-amber-500",
  },
  sky: {
    label: "ცისფერი",
    card: "border-sky-200/80 bg-sky-50/70 dark:border-sky-300/15 dark:bg-sky-300/[0.06]",
    label_: "text-sky-800/70 dark:text-sky-200/80",
    body: "text-sky-900/70 dark:text-sky-100/70",
    field: "border-sky-900/10 focus:border-sky-600/40 dark:border-white/10",
    selected:
      "border-sky-400 bg-sky-100 text-sky-900 dark:border-sky-300/40 dark:bg-sky-400/20 dark:text-sky-100",
    chip: "border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-100",
    bubble: "bg-sky-100 text-sky-950 dark:bg-sky-400/20 dark:text-sky-50",
    solid: "bg-sky-600 text-white hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400",
    icon: "text-sky-600 dark:text-sky-400",
    swatch: "bg-sky-500",
  },
  pink: {
    label: "ვარდისფერი",
    card: "border-pink-200/80 bg-pink-50/70 dark:border-pink-300/15 dark:bg-pink-300/[0.06]",
    label_: "text-pink-800/70 dark:text-pink-200/80",
    body: "text-pink-900/70 dark:text-pink-100/70",
    field: "border-pink-900/10 focus:border-pink-600/40 dark:border-white/10",
    selected:
      "border-pink-400 bg-pink-100 text-pink-900 dark:border-pink-300/40 dark:bg-pink-400/20 dark:text-pink-100",
    chip: "border-pink-200 bg-pink-50 text-pink-900 hover:bg-pink-100 dark:border-pink-300/20 dark:bg-pink-400/10 dark:text-pink-100",
    bubble: "bg-pink-100 text-pink-950 dark:bg-pink-400/20 dark:text-pink-50",
    solid:
      "bg-pink-600 text-white hover:bg-pink-500 dark:bg-pink-500 dark:hover:bg-pink-400",
    icon: "text-pink-600 dark:text-pink-400",
    swatch: "bg-pink-500",
  },
  violet: {
    label: "იისფერი",
    card: "border-violet-200/80 bg-violet-50/70 dark:border-violet-300/15 dark:bg-violet-300/[0.06]",
    label_: "text-violet-800/70 dark:text-violet-200/80",
    body: "text-violet-900/70 dark:text-violet-100/70",
    field: "border-violet-900/10 focus:border-violet-600/40 dark:border-white/10",
    selected:
      "border-violet-400 bg-violet-100 text-violet-900 dark:border-violet-300/40 dark:bg-violet-400/20 dark:text-violet-100",
    chip: "border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100 dark:border-violet-300/20 dark:bg-violet-400/10 dark:text-violet-100",
    bubble: "bg-violet-100 text-violet-950 dark:bg-violet-400/20 dark:text-violet-50",
    solid:
      "bg-violet-600 text-white hover:bg-violet-500 dark:bg-violet-500 dark:hover:bg-violet-400",
    icon: "text-violet-600 dark:text-violet-400",
    swatch: "bg-violet-500",
  },
};

export const NOTE_COLOR_ORDER: NoteColor[] = [
  "emerald",
  "amber",
  "sky",
  "pink",
  "violet",
];

export const DEFAULT_NOTE_COLOR: NoteColor = "emerald";

export function noteColorScheme(color: string | undefined): NoteColorScheme {
  if (color && color in NOTE_COLORS) return NOTE_COLORS[color as NoteColor];
  return NOTE_COLORS[DEFAULT_NOTE_COLOR];
}
