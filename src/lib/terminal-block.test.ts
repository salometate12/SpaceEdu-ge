import { describe, expect, it } from "vitest";
import { commandAt, parseTerminalBlock, shellKind, terminalCommandsText } from "./terminal-block";

describe("shellKind", () => {
  it("recognises shell language tags", () => {
    expect(shellKind("bash")).toBe("posix");
    expect(shellKind("PowerShell")).toBe("powershell");
    expect(shellKind("cmd")).toBe("cmd");
    expect(shellKind("python")).toBeNull();
  });
});

describe("parseTerminalBlock", () => {
  it("treats every line as a command when there are no prompts", () => {
    const lines = parseTerminalBlock("npm install\nnpm run dev", "posix");
    expect(terminalCommandsText(lines)).toBe("npm install\nnpm run dev");
  });

  it("drops $ prompts and output from what is copied", () => {
    const lines = parseTerminalBlock("$ python --version\nPython 3.12.1\n$ pip list", "posix");
    expect(lines.map((l) => l.kind)).toEqual(["command", "output", "command"]);
    expect(terminalCommandsText(lines)).toBe("python --version\npip list");
  });

  it("keeps \\ continuations with their command", () => {
    const lines = parseTerminalBlock("docker run \\\n  -p 3000:3000 \\\n  app\nls", "posix");
    expect(commandAt(lines, 0)).toBe("docker run \\\n  -p 3000:3000 \\\n  app");
    expect(commandAt(lines, 3)).toBe("ls");
  });

  it("strips PS> prompts and marks comments", () => {
    const lines = parseTerminalBlock("# ვერსია\nPS> node -v\nv20.0.0", "powershell");
    expect(lines.map((l) => l.kind)).toEqual(["comment", "command", "output"]);
    expect(terminalCommandsText(lines)).toBe("node -v");
  });
});
