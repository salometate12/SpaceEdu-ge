import { describe, expect, it } from "vitest";
import {
  addResearchHistory,
  countPdfPages,
  formatBytes,
  isTooLarge,
  parseResearchHistory,
  readingMinutes,
  researchFileKind,
  type ResearchHistoryItem,
} from "./research-files";

describe("research files", () => {
  it("knows the kinds", () => {
    expect(researchFileKind({ name: "a.PDF", type: "" })).toBe("pdf");
    expect(researchFileKind({ name: "lecture.m4a", type: "" })).toBe("audio");
    expect(researchFileKind({ name: "x.jpg", type: "image/jpeg" })).toBe("image");
    expect(researchFileKind({ name: "notes.md", type: "" })).toBe("text");
    expect(researchFileKind({ name: "deck.pptx", type: "" })).toBeNull();
  });

  it("checks the 15 MB limit and formats sizes", () => {
    expect(isTooLarge(15 * 1024 * 1024)).toBe(false);
    expect(isTooLarge(24 * 1024 * 1024)).toBe(true);
    expect(formatBytes(24 * 1024 * 1024)).toBe("24 MB");
    expect(formatBytes(4.2 * 1024 * 1024)).toBe("4.2 MB");
    expect(formatBytes(800 * 1024)).toBe("800 KB");
  });

  it("counts PDF pages, not the /Pages tree", () => {
    const raw = "<< /Type /Pages /Count 3 >> << /Type /Page >> << /Type/Page /Parent 1 >> << /Type /Page >>";
    expect(countPdfPages(raw)).toBe(3);
    expect(countPdfPages("not a pdf")).toBeNull();
  });

  it("estimates reading time", () => {
    expect(readingMinutes("სიტყვა ".repeat(540))).toBe(3);
    expect(readingMinutes("ორი სიტყვა")).toBe(1);
  });
});

describe("research history", () => {
  const item = (name: string, at: number): ResearchHistoryItem => ({
    id: `${name}:${at}`,
    name,
    kind: "pdf",
    sections: ["theses"],
    result: { title: name, summary: "…", sources: [], quotes: [] },
    at,
  });

  it("keeps newest first, one per file, at most 20", () => {
    let history: ResearchHistoryItem[] = [];
    for (let index = 0; index < 25; index += 1) history = addResearchHistory(history, item(`f${index}.pdf`, index));
    expect(history).toHaveLength(20);
    history = addResearchHistory(history, item("f20.pdf", 99));
    expect(history[0].at).toBe(99);
    expect(history.filter((entry) => entry.name === "f20.pdf")).toHaveLength(1);
  });

  it("ignores broken stored data", () => {
    expect(parseResearchHistory("{")).toEqual([]);
    expect(parseResearchHistory(JSON.stringify([{ id: 1 }, item("ok.pdf", 1)]))).toHaveLength(1);
  });
});
