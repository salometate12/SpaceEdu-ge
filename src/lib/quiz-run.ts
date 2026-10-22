/**
 * The quiz screen's small rules, as pure functions: each question's state
 * on the progress bar, and whether an answer reads as code (shown in the
 * mono font).
 */

/** How a question was answered; null until it's checked. */
export type QuestionResult = "correct" | "wrong" | null;

export type SegmentState = "correct" | "wrong" | "current" | "pending";

/** One segment per question: its result once checked, else current or still to come. */
export function progressSegments(results: QuestionResult[], currentIndex: number): SegmentState[] {
  return results.map((result, index) => result ?? (index === currentIndex ? "current" : "pending"));
}

const CLI_START =
  /^(?:sudo|git|npm|npx|yarn|pnpm|pip3?|python3?|node|cd|ls|mkdir|rm|cp|mv|cat|echo|curl|wget|chmod|chown|ssh|docker|kubectl|brew|apt(?:-get)?|touch|grep|export|java|javac|gcc|make|SELECT|INSERT|UPDATE|DELETE|CREATE|DROP)\b/;

/**
 * An answer shown in the mono font: a command or a piece of code — backticks,
 * `>`, `|`, `--`, a path-like `/` (not „და/ან“), a call like `f(x)`, or a
 * line that starts like a CLI command.
 */
export function looksLikeCode(text: string): boolean {
  const value = text.trim();
  if (!value) return false;
  if (/[`|>]|--/.test(value)) return true;
  if (/(?:^|[\s.~])\/[\w.-]|[\w.-]\/[\w.-]*[a-zA-Z_.]/.test(value) && /[a-zA-Z]/.test(value)) return true;
  if (/^[A-Za-z_$][\w$.]*\([^)]*\);?$/.test(value)) return true;
  return CLI_START.test(value);
}
