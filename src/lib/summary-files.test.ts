import { describe, expect, it, vi } from "vitest";

// The PDF reader is server-only; these tests don't read PDFs.
vi.mock("server-only", () => ({}));
import {
  addFiles,
  FILE_MAX_BYTES,
  FILE_TOO_BIG,
  shareBudget,
  summaryCreditCost,
  summaryFilesSchema,
  TOO_MANY_FILES,
  TOTAL_TOO_BIG,
} from "./summary-files";
import { joinSections, MULTI_SOURCE_HINT, buildMultiFileSummaryMessage } from "./ai/multi-file-summary";

const MB = 1024 * 1024;
const file = (name: string, size = MB) => ({ name, size });

describe("summary files", () => {
  it("costs 1 credit for 1–3 files and 2 for 4–5", () => {
    expect([1, 2, 3, 4, 5].map(summaryCreditCost)).toEqual([1, 1, 1, 2, 2]);
  });

  it("adds up to five; a sixth is refused", () => {
    const four = addFiles([], [file("a"), file("b"), file("c"), file("d")], 5);
    expect(four).toEqual({ files: four.files, error: null });
    const more = addFiles(four.files, [file("e"), file("f")], 5);
    expect(more.files.map((item) => item.name)).toEqual(["a", "b", "c", "d", "e"]);
    expect(more.error).toBe(TOO_MANY_FILES);
  });

  it("refuses a file over 20 MB and anything past 50 MB in all, keeping the rest", () => {
    const big = addFiles([], [file("huge", FILE_MAX_BYTES + 1), file("ok")], 5);
    expect(big).toEqual({ files: [file("ok")], error: FILE_TOO_BIG });
    const total = addFiles([file("a", 18 * MB), file("b", 18 * MB)], [file("c", 18 * MB), file("d", 5 * MB)], 5);
    expect(total.files.map((item) => item.name)).toEqual(["a", "b", "d"]);
    expect(total.error).toBe(TOTAL_TOO_BIG);
  });

  it("the server checks the same limits", () => {
    const make = (name: string, size: number) => new File([new Uint8Array(size)], name);
    expect(summaryFilesSchema.safeParse([make("a.pdf", 10)]).success).toBe(true);
    expect(summaryFilesSchema.safeParse(Array.from({ length: 6 }, (_, i) => make(`${i}.pdf`, 10))).error?.issues[0]?.message).toBe(TOO_MANY_FILES);
    expect(summaryFilesSchema.safeParse([make("a.exe", 10)]).success).toBe(false);
    expect(summaryFilesSchema.safeParse([]).success).toBe(false);
  });

  it("shares the text budget equally, short texts keeping all of theirs", () => {
    expect(shareBudget([100, 100], 1000)).toEqual([100, 100]);
    expect(shareBudget([100, 5000, 5000], 1000)).toEqual([100, 450, 450]);
    expect(shareBudget([5000, 5000, 5000, 5000], 1000)).toEqual([250, 250, 250, 250]);
  });

  it("puts each file under its name and cuts only the long ones", () => {
    const joined = joinSections(
      [
        { name: "ლექცია 1.pdf", text: "მოკლე" },
        { name: "ლექცია 2.docx", text: "ა".repeat(500) },
      ],
      100,
    );
    expect(joined).toContain("### ლექცია 1.pdf\nმოკლე");
    expect(joined).toContain("### ლექცია 2.docx\n");
    expect(joined).toContain("[…]");
    expect(joined.length).toBeLessThan(200);
  });

  it("asks for one conspectus from all the sources", async () => {
    const message = await buildMultiFileSummaryMessage(
      [new File(["უჯრედის მემბრანა"], "ბიოლოგია.txt"), new File(["ბაზრის წონასწორობა"], "ეკონომიკა.md")],
      "გამოცდა",
    );
    const text = Array.isArray(message.content) && message.content[0].type === "text" ? message.content[0].text : "";
    expect(text).toContain(MULTI_SOURCE_HINT);
    expect(text).toContain("### ბიოლოგია.txt\nუჯრედის მემბრანა");
    expect(text).toContain("### ეკონომიკა.md\nბაზრის წონასწორობა");
    expect(text).toContain("გამოცდა");
  });
});
