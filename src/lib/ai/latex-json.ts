/**
 * LaTeX inside a model's JSON. A model asked for "$\\frac{1}{2}$" sometimes
 * writes "$\frac{1}{2}$": in JSON that's a form feed and „rac“, and
 * "$\cdot$" doesn't parse at all. Two repairs: before parsing, a backslash
 * that starts a LaTeX command is doubled; after parsing (when the JSON was
 * read elsewhere, e.g. the AI SDK), control characters that were a LaTeX
 * command's first letter are turned back.
 */

/** Commands whose first letter is also a JSON escape (\b \f \n \r \t): those must be told apart from real escapes. */
const AMBIGUOUS = new Set([
  "frac", "dfrac", "tfrac", "forall", "flat", "frown", "footnotesize",
  "beta", "begin", "bar", "binom", "boldsymbol", "bmatrix", "Bmatrix", "big", "Big", "bigl", "bigr", "Bigl", "Bigr", "bigg", "bullet", "backslash", "bot", "bigcup", "bigcap", "bf",
  "neq", "ne", "nabla", "nu", "not", "notin", "newline", "nolimits", "neg", "nleq", "ngeq", "nmid", "nexists",
  "rho", "right", "rightarrow", "Rightarrow", "rightleftharpoons", "rm", "rangle", "rceil", "rfloor", "rbrace", "Re",
  "times", "theta", "Theta", "tau", "text", "textbf", "textit", "textrm", "tan", "tanh", "to", "top", "tilde", "triangle", "therefore", "tfrac", "tiny",
]);

const HEX4 = /^[0-9a-fA-F]{4}$/;

function escapePass(raw: string, doublePairs: boolean): { out: string; fixed: number } {
  let out = "";
  let fixed = 0;
  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    if (char !== "\\") {
      out += char;
      continue;
    }
    const next = raw[index + 1] ?? "";
    // A model writing single backslashes wrote a LaTeX line break (\\) as two: kept as two.
    if (next === "\\") {
      out += doublePairs ? "\\\\\\\\" : "\\\\";
      index += 1;
      continue;
    }
    // Already a valid escape of its own: \" \/ \uXXXX.
    if (next === '"' || next === "/") {
      out += char + next;
      index += 1;
      continue;
    }
    if (next === "u" && HEX4.test(raw.slice(index + 2, index + 6))) {
      out += char;
      continue;
    }
    const word = raw.slice(index + 1).match(/^[a-zA-Z]+/)?.[0] ?? "";
    // \n, \t … as JSON means them, unless the word is a LaTeX command („\nabla“, „\times“).
    if (next !== "" && "bfnrt".includes(next) && !AMBIGUOUS.has(word)) {
      out += char;
      continue;
    }
    out += "\\\\";
    fixed += 1;
  }
  return { out, fixed };
}

/**
 * Doubles each backslash in raw JSON that starts LaTeX rather than a JSON
 * escape. When the answer has such single backslashes, its \\ were LaTeX
 * line breaks too (a matrix's rows) and are kept as two.
 */
export function escapeLatexInJson(raw: string): string {
  const first = escapePass(raw, false);
  return first.fixed > 0 ? escapePass(raw, true).out : first.out;
}

const FIX_INSIDE_MATH: [RegExp, string][] = [
  [/\t(?=(?:imes|heta|au|ext|an|o\b|op|ilde|riangle|herefore|frac))/g, "\\t"],
  [/\r(?=(?:ho|ight|m\b|angle|ceil|floor|brace))/g, "\\r"],
  [/\n(?=(?:abla|eq|e\b|u\b|ot|otin|ewline|olimits|eg))/g, "\\n"],
];

function fixString(text: string): string {
  // Form feed and backspace never belong in an answer: they were \f… and \b….
  let fixed = text.replace(/\f/g, "\\f").replace(/\x08/g, "\\b");
  if (!/[\t\r\n]/.test(fixed) || !fixed.includes("$")) return fixed;
  // Tab, CR and newline only inside $…$, where they can't be meant.
  fixed = fixed
    .split("$")
    .map((part, index) => (index % 2 === 1 ? FIX_INSIDE_MATH.reduce((value, [pattern, to]) => value.replace(pattern, to), part) : part))
    .join("$");
  return fixed;
}

/** Every string in a parsed answer, with LaTeX commands a JSON escape swallowed put back. */
export function restoreLatex<T>(value: T): T {
  if (typeof value === "string") return fixString(value) as T;
  if (Array.isArray(value)) return value.map(restoreLatex) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, restoreLatex(item)])) as T;
  }
  return value;
}
