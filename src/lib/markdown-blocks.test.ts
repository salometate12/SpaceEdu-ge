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

  it("joins consecutive > lines into one quote, in order with what follows", () => {
    expect(parseMarkdownBlocks("შესავალი\n> მთავარი აზრი\n> გაგრძელება\n- პუნქტი")).toEqual([
      { type: "paragraph", text: "შესავალი" },
      { type: "quote", text: "მთავარი აზრი გაგრძელება" },
      { type: "list", ordered: false, items: ["პუნქტი"] },
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
  it("keeps a quote's text without the >", () => {
    expect(markdownToPlainText("> **მთავარი:** ფასი იზრდება")).toBe("მთავარი: ფასი იზრდება");
  });

  it("drops markdown syntax but keeps code lines and list markers", () => {
    expect(markdownToPlainText("## სათაური\n\n**მთავარი** `x`\n\n- ა\n- ბ\n\n```py\nprint(1)\n```")).toBe(
      "სათაური\n\nმთავარი x\n\n• ა\n• ბ\n\nprint(1)",
    );
  });
});

describe("maths", () => {
  const math = (latex: string, display = false) => ({ type: "math", latex, display });

  it("inline $…$ and \\(…\\) inside a line", () => {
    expect(parseInline("ფართობი $S = \\pi r^{2}$ და $\\alpha$ კუთხე")).toEqual([
      { type: "text", text: "ფართობი " },
      math("S = \\pi r^{2}"),
      { type: "text", text: " და " },
      math("\\alpha"),
      { type: "text", text: " კუთხე" },
    ]);
    expect(parseInline("ვექტორი \\(\\vec{v}\\) აქ")).toEqual([{ type: "text", text: "ვექტორი " }, math("\\vec{v}"), { type: "text", text: " აქ" }]);
  });

  it("a block: $$…$$ on one line, over several lines, and \\[…\\]", () => {
    expect(parseMarkdownBlocks("ფორმულა:\n\n$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$")).toEqual([
      { type: "paragraph", text: "ფორმულა:" },
      { type: "math", latex: "x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}", closed: true, source: "$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$" },
    ]);
    const multi = parseMarkdownBlocks("$$\nA=\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}\n$$\nშემდეგ");
    expect(multi[0]).toMatchObject({ type: "math", latex: "A=\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}", closed: true });
    expect(multi[1]).toEqual({ type: "paragraph", text: "შემდეგ" });
    expect(parseMarkdownBlocks("\\[\n\\int_0^2 x^2\\,dx = \\frac{8}{3}\n\\]")[0]).toMatchObject({ type: "math", latex: "\\int_0^2 x^2\\,dx = \\frac{8}{3}", closed: true });
  });

  it("aligned steps stay one block, line breaks and all", () => {
    const text = "$$\\begin{aligned}\n2A &= 2\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix} \\\\\n&= \\begin{pmatrix}2&4\\\\6&8\\end{pmatrix}\n\\end{aligned}$$";
    const [block] = parseMarkdownBlocks(text);
    expect(block).toMatchObject({ type: "math", closed: true });
    expect(block.type === "math" && block.latex.split("\n")).toHaveLength(4);
  });

  it("prices are not maths: „5$ და 10$“, „$5 and $10“", () => {
    expect(parseInline("ღირს 5$ და 10$")).toEqual([{ type: "text", text: "ღირს 5$ და 10$" }]);
    expect(parseInline("from $5 to $10 today")).toEqual([{ type: "text", text: "from $5 to $10 today" }]);
  });

  it("$ inside code (inline or a fence) stays code", () => {
    expect(parseInline("ცვლადი `$x$` და $y$")).toEqual([
      { type: "text", text: "ცვლადი " },
      { type: "code", text: "$x$" },
      { type: "text", text: " და " },
      math("y"),
    ]);
    const blocks = parseMarkdownBlocks("```bash\necho $HOME $PATH\n$$ not maths $$\n```");
    expect(blocks).toEqual([{ type: "code", lang: "bash", code: "echo $HOME $PATH\n$$ not maths $$", closed: true }]);
  });

  it("an unclosed $$ while streaming stays plain text until it closes", () => {
    const streaming = parseMarkdownBlocks("ასე:\n\n$$\nA=\\begin{pmatrix}1&2");
    expect(streaming[1]).toEqual({ type: "math", latex: "A=\\begin{pmatrix}1&2", closed: false, source: "$$\nA=\\begin{pmatrix}1&2" });
    expect(markdownToPlainText("$$\nA=\\begin{pmatrix}1&2")).toBe("$$\nA=\\begin{pmatrix}1&2");
  });

  it("plain text keeps the LaTeX source, without the $", () => {
    expect(markdownToPlainText("**ჯამი** $a+b$\n\n$$\\frac{1}{2}$$")).toBe("ჯამი a+b\n\n\\frac{1}{2}");
  });

  it("wrong LaTeX is still a formula segment (KaTeX shows its source, grey)", () => {
    expect(parseInline("$\\frac{1}{$")).toEqual([math("\\frac{1}{")]);
  });
});
