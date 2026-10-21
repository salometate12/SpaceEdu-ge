"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy, TerminalSquare } from "lucide-react";
import { copyToClipboard } from "@/lib/copy-to-clipboard";
import {
  commandAt,
  parseTerminalBlock,
  SHELL_LABEL,
  SHELL_PROMPT,
  shellKind,
  terminalCommandsText,
  type ShellKind,
} from "@/lib/terminal-block";

/** How a language tag is shown in the block's header. */
const LANG_LABEL: Record<string, string> = {
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  py: "python",
  cpp: "c++",
  cc: "c++",
  cs: "c#",
  csharp: "c#",
  yml: "yaml",
  kt: "kotlin",
};

const LONG_BLOCK = 30;
const PREVIEW_LINES = 20;
const MONO = 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace';
/** Monospace text as typed: no `->` → arrow or `==` ligatures. */
const MONO_STYLE = { fontFamily: MONO, fontVariantLigatures: "none" } as const;

/** „კოპირება“ → „დაკოპირდა ✓“ (or „ვერ დაკოპირდა“) for ~2 s. */
export function CopyButton({
  text,
  label = "კოპირება",
  iconOnly = false,
  className = "",
}: {
  text: string;
  label?: string;
  iconOnly?: boolean;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const shown = state === "done" ? "დაკოპირდა" : state === "failed" ? "ვერ დაკოპირდა" : label;
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copyToClipboard(text);
        setState(ok ? "done" : "failed");
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setState("idle"), 2000);
      }}
      aria-label={shown}
      title={shown}
      className={`inline-flex items-center gap-1.5 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${className}`}
    >
      {state === "done" ? (
        iconOnly ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : null
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {iconOnly ? null : <span>{shown}{state === "done" ? " ✓" : ""}</span>}
    </button>
  );
}

function BlockHeader({ children, copyText }: { children: React.ReactNode; copyText: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/[0.07] bg-white/[0.03] px-3 py-1.5">
      <span className="flex gap-1.5" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
      </span>
      <span className="ml-1 flex min-w-0 flex-1 items-center gap-1.5 truncate text-xs font-medium text-zinc-400">{children}</span>
      <CopyButton text={copyText} className="px-1.5 py-1 text-zinc-400 hover:bg-white/10 hover:text-white" />
    </div>
  );
}

/** Highlights once the block scrolls into view (and again as it streams). */
function useHighlight(code: string, lang: string, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || visible) return;
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "200px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, visible]);

  useEffect(() => {
    if (!enabled || !visible) return;
    let active = true;
    void import("@/lib/highlight-code").then((module) => {
      if (active) setHtml(module.highlightCode(code, lang));
    });
    return () => {
      active = false;
    };
  }, [code, lang, enabled, visible]);

  return { ref, html };
}

function EditorBlock({ code, lang }: { code: string; lang: string }) {
  const lines = code.replace(/\n$/, "").split("\n");
  const long = lines.length > LONG_BLOCK;
  const [expanded, setExpanded] = useState(false);
  const { ref, html } = useHighlight(code.replace(/\n$/, ""), lang, true);
  const showNumbers = lines.length >= 3;
  const collapsed = long && !expanded;

  return (
    <div ref={ref} className="code-block not-prose my-3 overflow-hidden rounded-xl border border-white/10 bg-[#0f1117] text-[#e6e6e6] shadow-sm">
      <BlockHeader copyText={code.replace(/\n$/, "")}>{lang ? LANG_LABEL[lang] ?? lang : "კოდი"}</BlockHeader>
      <div className="relative">
        <div
          className="flex overflow-x-auto"
          style={collapsed ? { maxHeight: `calc(${PREVIEW_LINES} * 1.6em + 1.5rem)`, overflowY: "hidden" } : undefined}
        >
          {showNumbers ? (
            <div
              aria-hidden
              className="shrink-0 select-none border-r border-white/[0.06] py-3 pl-3 pr-2.5 text-right text-[13px] leading-[1.6] text-zinc-600"
              style={MONO_STYLE}
            >
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
          ) : null}
          <pre className="min-w-0 flex-1 py-3 pl-3.5 pr-4 text-[13px] leading-[1.6]" style={MONO_STYLE}>
            {html !== null ? (
              // highlight.js escapes the code; only its own spans are added.
              <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <code>{code.replace(/\n$/, "")}</code>
            )}
          </pre>
        </div>
        {collapsed ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0f1117] to-transparent" />
        ) : null}
      </div>
      {long ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex w-full items-center justify-center gap-1 border-t border-white/[0.07] py-1.5 text-xs font-medium text-zinc-400 hover:bg-white/[0.04] hover:text-white"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {expanded ? "შეკეცვა" : `მთლიანად ნახვა (${lines.length} ხაზი)`}
        </button>
      ) : null}
    </div>
  );
}

function TerminalBlock({ code, kind }: { code: string; kind: ShellKind }) {
  const lines = parseTerminalBlock(code, kind);
  const prompt = SHELL_PROMPT[kind];
  return (
    <div className="code-block not-prose my-3 overflow-hidden rounded-xl border border-white/10 bg-[#0c0d10] text-[#e6e6e6] shadow-sm">
      <BlockHeader copyText={terminalCommandsText(lines)}>
        <TerminalSquare className="h-3.5 w-3.5 shrink-0" />
        {SHELL_LABEL[kind]}
      </BlockHeader>
      <div className="overflow-x-auto py-2.5 text-[13px] leading-[1.6]" style={MONO_STYLE}>
        {lines.map((line, index) => (
          <div key={index} className="group flex min-w-max items-start gap-2 px-3.5">
            {line.kind === "command" && !line.continuation ? (
              <span className="select-none text-zinc-500" aria-hidden>
                {prompt}
              </span>
            ) : (
              <span className="select-none" aria-hidden style={{ width: `${prompt.length}ch` }} />
            )}
            <span
              className={`whitespace-pre ${
                line.kind === "output" ? "text-zinc-400" : line.kind === "comment" ? "text-zinc-500" : "text-[#e6e6e6]"
              }`}
            >
              {line.text || " "}
            </span>
            {line.kind === "command" && !line.continuation ? (
              <CopyButton
                text={commandAt(lines, index)}
                label="ბრძანების კოპირება"
                iconOnly
                className="ml-1 p-0.5 text-zinc-500 opacity-0 hover:text-white focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * A fenced code block from a chat answer: an editor-style card for code, a
 * terminal-style card (no prompts or output in what's copied) for shells.
 */
export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const kind = shellKind(lang);
  return kind ? <TerminalBlock code={code} kind={kind} /> : <EditorBlock code={code} lang={lang} />;
}
