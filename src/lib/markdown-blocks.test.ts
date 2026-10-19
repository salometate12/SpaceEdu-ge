import { describe, expect, it } from "vitest";
import { markdownToPlainText, parseInline, parseMarkdownBlocks } from "./markdown-blocks";
import { sanitizeChatMarkdown } from "./ai/sanitize-chat-markdown";
import { stripCodeFences } from "./ai/parse-flashcards-json";

const TWO_BLOCKS = [
  "ჯერ დააინსტალირე:",
  "",
  "```bash",
  "pip install requests",
  "```",
  "",
  "შემდეგ `main.py`:",
  "",
  "```python",
  "import requests",
  "# კომენტარი",
  "print(requests.get('https://x').status_code)",
  "```",
].join("\n");

describe("sanitizeChatMarkdown", () => {
  it("keeps an answer with several code blocks intact", () => {
    expect(sanitizeChatMarkdown(TWO_BLOCKS)).toBe(TWO_BLOCKS);
  });

  it("unwraps an answer the model wrapped in ```markdown", () => {
    expect(sanitizeChatMarkdown("```markdown\n# სათაური\n\nტექსტი\n```")).toBe("# სათაური\n\nტექსტი");
  });

  it("leaves the flashcards fence stripping as it was", () => {
    expect(stripCodeFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });
});

describe("parseMarkdownBlocks", () => {
  it("splits prose and fenced blocks with their language", () => {
    const blocks = parseMarkdownBlocks(TWO_BLOCKS);
    const code = blocks.filter((b) => b.type === "code");
    expect(code).toEqual([
      { type: "code", lang: "bash", code: "pip install requests", closed: true },
      {
        type: "code",
        lang: "python",
        code: "import requests\n# კომენტარი\nprint(requests.get('https://x').status_code)",
        closed: true,
      },
    ]);
    expect(blocks.some((b) => b.type === "heading")).toBe(false);
  });

  it("handles a block without a language and ~~~ fences", () => {
    expect(parseMarkdownBlocks("```\nx = 1\n```")).toEqual([{ type: "code", lang: "", code: "x = 1", closed: true }]);
    expect(parseMarkdownBlocks("~~~js\nlet a\n~~~")).toEqual([{ type: "code", lang: "js", code: "let a", closed: true }]);
  });

  it("keeps markdown-looking lines and indentation inside a block", () => {
    const [block] = parseMarkdownBlocks("```python\ndef f():\n    # **არა სათაური**\n    - 1\n```");
    expect(block).toEqual({ type: "code", lang: "python", code: "def f():\n    # **არა სათაური**\n    - 1", closed: true });
  });

  it("marks a block still streaming as not closed", () => {
    expect(parseMarkdownBlocks("ტექსტი\n\n```js\nconsole.log(1)")).toEqual([
      { type: "paragraph", text: "ტექსტი" },
      { type: "code", lang: "js", code: "console.log(1)", closed: false },
    ]);
  });

  it("parses headings and lists outside blocks", () => {
    expect(parseMarkdownBlocks("## ნაბიჯები\n- ერთი\n- ორი\n1. პირველი")).toEqual([
      { type: "heading", level: 2, text: "ნაბიჯები" },
      { type: "list", ordered: false, items: ["ერთი", "ორი"] },
      { type: "list", ordered: true, items: ["პირველი"] },
    ]);
  });
});

describe("parseInline", () => {
  it("finds inline code and bold", () => {
    expect(parseInline("გაუშვი `npm run dev` და **დაელოდე**")).toEqual([
      { type: "text", text: "გაუშვი " },
      { type: "code", text: "npm run dev" },
      { type: "text", text: " და " },
      { type: "bold", text: "დაელოდე" },
    ]);
  });

  it("doesn't apply bold inside inline code", () => {
    expect(parseInline("`a **b** c`")).toEqual([{ type: "code", text: "a **b** c" }]);
  });
});

describe("markdownToPlainText", () => {
  it("drops markdown syntax but keeps code lines and list markers", () => {
    expect(markdownToPlainText("## სათაური\n\n**მთავარი** `x`\n\n- ა\n- ბ\n\n```py\nprint(1)\n```")).toBe(
      "სათაური\n\nმთავარი x\n\n• ა\n• ბ\n\nprint(1)",
    );
  });
});
