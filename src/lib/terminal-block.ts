/**
 * Terminal code blocks (```bash, ```powershell …): which lines are commands
 * the student should copy, and which are output or comments they shouldn't.
 */

export type ShellKind = "posix" | "powershell" | "cmd";

const SHELLS: Record<string, ShellKind> = {
  bash: "posix",
  sh: "posix",
  zsh: "posix",
  shell: "posix",
  console: "posix",
  terminal: "posix",
  powershell: "powershell",
  ps: "powershell",
  ps1: "powershell",
  pwsh: "powershell",
  cmd: "cmd",
  bat: "cmd",
  batch: "cmd",
};

/** The shell a code block's language tag names, or null for ordinary code. */
export function shellKind(lang: string): ShellKind | null {
  return SHELLS[lang.toLowerCase()] ?? null;
}

export const SHELL_LABEL: Record<ShellKind, string> = {
  posix: "ტერმინალი",
  powershell: "PowerShell",
  cmd: "Command Prompt",
};

export const SHELL_PROMPT: Record<ShellKind, string> = {
  posix: "$",
  powershell: "PS>",
  cmd: ">",
};

export type TerminalLine =
  | { kind: "command"; text: string; /** a `\`-continued line of the previous command */ continuation: boolean }
  | { kind: "output"; text: string }
  | { kind: "comment"; text: string }
  | { kind: "blank"; text: "" };

const PROMPTS: Record<ShellKind, RegExp> = {
  posix: /^\s*\$ ?/,
  // "PS>", "PS C:\Users\x>"
  powershell: /^\s*PS(?: [^>]*)?> ?/,
  // "C:\Users\x>" or a bare ">"
  cmd: /^\s*(?:[A-Za-z]:\\[^>]*)?> ?/,
};

/**
 * Splits a terminal block into lines. If any line starts with a prompt, the
 * block is a transcript: prompted lines (and their `\` continuations) are
 * commands and everything else is output. Otherwise every line is a command.
 * Lines starting with # (posix/PowerShell) or REM/:: (cmd) are comments.
 */
export function parseTerminalBlock(code: string, kind: ShellKind): TerminalLine[] {
  const prompt = PROMPTS[kind];
  const isComment = (line: string) =>
    kind === "cmd" ? /^\s*(rem\b|::)/i.test(line) : /^\s*#/.test(line);
  const lines = code.replace(/\r\n/g, "\n").replace(/\n+$/, "").split("\n");
  const transcript = lines.some((line) => prompt.test(line) && line.replace(prompt, "").trim().length > 0);

  const out: TerminalLine[] = [];
  let continuing = false;
  for (const line of lines) {
    if (!line.trim()) {
      out.push({ kind: "blank", text: "" });
      continuing = false;
      continue;
    }
    if (continuing) {
      out.push({ kind: "command", text: line, continuation: true });
      continuing = /\\\s*$|`\s*$/.test(line);
      continue;
    }
    const prompted = prompt.test(line);
    const text = prompted ? line.replace(prompt, "") : line;
    if (isComment(text)) {
      out.push({ kind: "comment", text });
      continue;
    }
    if (transcript && !prompted) {
      out.push({ kind: "output", text: line });
      continue;
    }
    out.push({ kind: "command", text, continuation: false });
    // bash `\`, PowerShell backtick line continuations
    continuing = /\\\s*$|`\s*$/.test(text);
  }
  return out;
}

/** What „კოპირება“ copies: only the commands, one per line, no prompts. */
export function terminalCommandsText(lines: TerminalLine[]): string {
  return lines
    .filter((line): line is Extract<TerminalLine, { kind: "command" }> => line.kind === "command")
    .map((line) => line.text)
    .join("\n");
}

/** One command with its continuation lines, for the per-line copy icon. */
export function commandAt(lines: TerminalLine[], index: number): string {
  const parts: string[] = [];
  for (let i = index; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.kind !== "command" || (i > index && !line.continuation)) break;
    parts.push(line.text);
  }
  return parts.join("\n");
}
