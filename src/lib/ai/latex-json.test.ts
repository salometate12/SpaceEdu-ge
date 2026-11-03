import katex from "katex";
import { describe, expect, it } from "vitest";
import { escapeLatexInJson, restoreLatex } from "./latex-json";
import { parseGeneratedFlashcardsJson } from "./parse-flashcards-json";

describe("LaTeX in a model's JSON", () => {
  it("single backslashes become valid JSON and the same LaTeX", () => {
    const raw = String.raw`{"a":"$\frac{1}{2} \cdot \sqrt{x} \times \theta \nabla \neq \rho \beta \text{ab}$"}`;
    expect(() => JSON.parse(raw)).toThrow();
    expect(JSON.parse(escapeLatexInJson(raw)).a).toBe(String.raw`$\frac{1}{2} \cdot \sqrt{x} \times \theta \nabla \neq \rho \beta \text{ab}$`);
  });

  it("escaped ones and real JSON escapes are left alone", () => {
    const raw = String.raw`{"a":"$\\frac{1}{2}$\nშემდეგი ხაზი\t\"ციტატა\" \u10D0"}`;
    expect(escapeLatexInJson(raw)).toBe(raw);
    expect(JSON.parse(escapeLatexInJson(raw)).a).toBe("$\\frac{1}{2}$\nშემდეგი ხაზი\t\"ციტატა\" ა");
  });

  it("an answer the AI SDK already parsed gets its swallowed commands back", () => {
    const parsed = JSON.parse(String.raw`{"q":["$\frac{a}{b}$, $x \times y$, $\beta$", "ხაზი\nმეორე"]}`);
    expect(restoreLatex(parsed)).toEqual({ q: [String.raw`$\frac{a}{b}$, $x \times y$, $\beta$`, "ხაზი\nმეორე"] });
  });

  it("flashcards with LaTeX parse", () => {
    const text = String.raw`{"deckTitle":"მატრიცები","deckDescription":"","cards":[{"question":"რას უდრის $\begin{vmatrix}1&2\\3&4\end{vmatrix}$?","answer":"$1\cdot4-2\cdot3=-2$"},{"question":"$\mathrm{H_2SO_4}$ რა არის?","answer":"გოგირდმჟავა"},{"question":"$\int_0^2 x^2\,dx$","answer":"$\frac{8}{3}$"},{"question":"q4","answer":"a4"},{"question":"q5","answer":"a5"}]}`;
    const deck = parseGeneratedFlashcardsJson(text);
    expect(deck.cards[0].answer).toBe(String.raw`$1\cdot4-2\cdot3=-2$`);
    expect(deck.cards[2].question).toBe(String.raw`$\int_0^2 x^2\,dx$`);
    expect(deck.cards[0].question).toContain(String.raw`\begin{vmatrix}1&2\\3&4\end{vmatrix}`);
  });

  it("KaTeX renders matrices, aligned steps and chemistry; wrong LaTeX shows as its source", () => {
    const options = { throwOnError: false, output: "htmlAndMathml" as const };
    for (const latex of [String.raw`A=\begin{pmatrix}1&2\\3&4\end{pmatrix}`, String.raw`\begin{aligned} a &= b \\ &= c \end{aligned}`, String.raw`\mathrm{H_2SO_4}`, String.raw`\lim_{x\to0}\frac{\sin x}{x}=1`]) {
      const html = katex.renderToString(latex, { ...options, displayMode: true });
      expect(html, latex).not.toContain("katex-error");
      expect(html).toContain("<annotation");
    }
    const broken = katex.renderToString(String.raw`\frac{1}{`, options);
    expect(broken).toContain("katex-error");
  });
});
