/**
 * Syntax highlighting for chat code blocks. Loaded only with a dynamic
 * import when a code block appears, and only highlight.js's core with the
 * languages a student is likely to ask about — not the full bundle.
 */
import hljs from "highlight.js/lib/core";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import kotlin from "highlight.js/lib/languages/kotlin";
import php from "highlight.js/lib/languages/php";
import python from "highlight.js/lib/languages/python";
import r from "highlight.js/lib/languages/r";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import swift from "highlight.js/lib/languages/swift";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

const LANGUAGES = { c, cpp, csharp, css, go, java, javascript, json, kotlin, php, python, r, rust, sql, swift, typescript, xml, yaml };
for (const [name, language] of Object.entries(LANGUAGES)) hljs.registerLanguage(name, language);
hljs.registerAliases(["js", "jsx", "mjs"], { languageName: "javascript" });
hljs.registerAliases(["ts", "tsx"], { languageName: "typescript" });
hljs.registerAliases(["html", "svg"], { languageName: "xml" });
hljs.registerAliases(["py"], { languageName: "python" });
hljs.registerAliases(["c++", "cc", "h", "hpp"], { languageName: "cpp" });
hljs.registerAliases(["cs", "c#"], { languageName: "csharp" });
hljs.registerAliases(["yml"], { languageName: "yaml" });
hljs.registerAliases(["kt"], { languageName: "kotlin" });

/**
 * Highlighted HTML for the code, or null for an unknown language (then the
 * block shows plain, escaped text). highlight.js escapes the code itself.
 */
export function highlightCode(code: string, lang: string): string | null {
  if (!lang || !hljs.getLanguage(lang)) return null;
  try {
    return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
  } catch {
    return null;
  }
}
