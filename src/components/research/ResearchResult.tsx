"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookmarkPlus, Check, Download, Loader2 } from "lucide-react";
import { CopyButton } from "@/components/CodeBlock";
import {
  RESEARCH_SECTION_KEYS,
  type ResearchPoint,
  type ResearchResponse,
  type ResearchSectionKey,
} from "@/lib/ai/research-platform-schema";
import { parseInline } from "@/lib/markdown-blocks";
import { readingMinutes } from "@/lib/research-files";
import { ReadAloudButton } from "./ReadAloudButton";
import { RESEARCH_SECTIONS } from "./research-sections";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rp-accent)]/40";
export const RP_SECONDARY = `inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--rp-line)] bg-[var(--rp-card)] px-3.5 text-[13px] font-semibold text-[var(--rp-strong)] transition-colors hover:border-[var(--rp-muted)] disabled:pointer-events-none disabled:opacity-50 ${FOCUS}`;

function inline(text: string): ReactNode[] {
  return parseInline(text).map((segment, index) =>
    segment.type === "bold" ? <strong key={index}>{segment.text}</strong> : segment.type === "code" ? <code key={index}>{segment.text}</code> : segment.text,
  );
}

/** „გვ. 3“, „გვ. 3–4“, „გვ. 2, 7“ */
export function pagesLabel(pages: number[]): string {
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  const consecutive = sorted.length > 1 && sorted.every((page, index) => index === 0 || page === sorted[index - 1] + 1);
  return `გვ. ${consecutive ? `${sorted[0]}–${sorted[sorted.length - 1]}` : sorted.join(", ")}`;
}

function Point({ point, showPages }: { point: ResearchPoint; showPages: boolean }) {
  return (
    <>
      {inline(point.text)}
      {showPages && point.pages && point.pages.length > 0 ? (
        <span className="ml-1.5 inline-flex h-5 items-center whitespace-nowrap rounded-[6px] bg-[var(--rp-soft)] px-1.5 align-[1px] text-[12px] font-semibold text-[var(--rp-muted)]">
          {pagesLabel(point.pages)}
        </span>
      ) : null}
    </>
  );
}

/** The analysis as text, for copying and for the journal. */
export function researchToText(result: ResearchResponse, keys: ResearchSectionKey[], withPages: boolean): string {
  const line = (point: ResearchPoint) => `- ${point.text}${withPages && point.pages?.length ? ` (${pagesLabel(point.pages)})` : ""}`;
  const parts = [result.summary.trim()];
  for (const key of keys) {
    const meta = RESEARCH_SECTIONS[key];
    if (key === "criticalAnalysis") {
      const critique = result.criticalAnalysis;
      if (!critique) continue;
      parts.push(`**${meta.label}**\nძლიერი:\n${critique.strengths.map(line).join("\n")}\nსუსტი:\n${critique.weaknesses.map(line).join("\n")}`);
    } else {
      const points = result[key];
      if (points?.length) parts.push(`**${meta.label}**\n${points.map(line).join("\n")}`);
    }
  }
  return parts.filter(Boolean).join("\n\n");
}

/**
 * The analysis: title and reading time with copy · PDF · „ჟურნალში
 * შენახვა“, a sticky row of section links, then each section with its
 * colour, marker bold and page references (PDF only).
 */
export function ResearchResult({
  result,
  sections,
  showPages,
  savedNoteId,
  exporting,
  onSaveToJournal,
  onExportPdf,
  articleRef,
}: {
  result: ResearchResponse;
  sections: ResearchSectionKey[];
  showPages: boolean;
  savedNoteId: string | null;
  exporting: boolean;
  onSaveToJournal: () => void;
  onExportPdf: () => void;
  articleRef: React.RefObject<HTMLElement | null>;
}) {
  const keys = RESEARCH_SECTION_KEYS.filter(
    (key) => sections.includes(key) && (key === "criticalAnalysis" ? result.criticalAnalysis : result[key]?.length),
  );
  const [active, setActive] = useState<ResearchSectionKey | null>(keys[0] ?? null);
  const nodes = useRef(new Map<ResearchSectionKey, HTMLElement>());
  const text = researchToText(result, keys, showPages);
  const minutes = readingMinutes(text);

  // The link of the section in view is the active one.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const key = visible[0]?.target.getAttribute("data-section") as ResearchSectionKey | null;
        if (key) setActive(key);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    nodes.current.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [keys.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  const jump = (key: ResearchSectionKey) => {
    setActive(key);
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    nodes.current.get(key)?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  };

  return (
    <article ref={articleRef} className="min-w-0">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-[1_1_240px]">
          <h2 className="break-words text-[21px] font-bold leading-snug text-[var(--rp-strong)] sm:text-[22px]">{result.title}</h2>
          <p className="mt-1 text-[13px] text-[var(--rp-muted)]">
            {keys.length} სექცია · ~{minutes} წთ საკითხავი
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2" data-html2canvas-ignore>
          <ReadAloudButton key={text} text={`${result.title}. ${text.replace(/\*\*/g, "")}`} className="h-9 px-3.5 text-[13px] font-semibold" />
          <CopyButton
            text={`${result.title}\n\n${text.replace(/\*\*/g, "")}`}
            iconOnly
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--rp-line)] text-[var(--rp-muted)] transition-colors hover:text-[var(--rp-strong)]"
          />
          <button type="button" onClick={onExportPdf} disabled={exporting} className={RP_SECONDARY}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
            PDF
          </button>
          {savedNoteId ? (
            <Link
              href={`/journal?id=${savedNoteId}`}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--rp-ink)] px-3.5 text-[13px] font-semibold text-[var(--rp-ink-text)] ${FOCUS}`}
            >
              <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden />
              ჟურნალშია — ნახვა
            </Link>
          ) : (
            <button
              type="button"
              onClick={onSaveToJournal}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--rp-ink)] px-3.5 text-[13px] font-semibold text-[var(--rp-ink-text)] transition-opacity hover:opacity-90 ${FOCUS}`}
            >
              <BookmarkPlus className="h-4 w-4" aria-hidden />
              ჟურნალში შენახვა
            </button>
          )}
        </div>
      </header>

      {result.summary.trim() ? <p className="mt-4 text-[15px] leading-[1.7] text-[var(--rp-text)]">{inline(result.summary)}</p> : null}

      {keys.length > 1 ? (
        <nav
          aria-label="სექციები"
          data-html2canvas-ignore
          className="sticky top-[calc(var(--safe-top)+var(--site-header-h)+8px)] z-10 -mx-1 mt-4 flex gap-1.5 overflow-x-auto bg-[var(--rp-card)] px-1 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {keys.map((key) => (
            <a
              key={key}
              href={`#rp-${key}`}
              onClick={(event) => {
                event.preventDefault();
                jump(key);
              }}
              aria-current={active === key ? "true" : undefined}
              className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors ${FOCUS} ${
                active === key ? "bg-[var(--rp-soft)] text-[var(--rp-strong)]" : "text-[var(--rp-muted)] hover:text-[var(--rp-strong)]"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: `var(--rp-${key})` }} aria-hidden />
              {RESEARCH_SECTIONS[key].short}
            </a>
          ))}
        </nav>
      ) : null}

      <div className="mt-3 space-y-7">
        {keys.map((key) => {
          const meta = RESEARCH_SECTIONS[key];
          return (
            <section
              key={key}
              id={`rp-${key}`}
              data-section={key}
              ref={(node) => {
                if (node) nodes.current.set(key, node);
                else nodes.current.delete(key);
              }}
              className="scroll-mt-[calc(var(--safe-top)+var(--site-header-h)+64px)]"
            >
              <h3 className="flex items-center gap-2 text-[16px] font-bold text-[var(--rp-strong)]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: `var(--rp-${key})` }} aria-hidden />
                {meta.label}
              </h3>
              {key === "criticalAnalysis" && result.criticalAnalysis ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["strengths", "ძლიერი", "bg-[var(--rp-strong-bg)]", "text-[var(--rp-strong-text)]"],
                      ["weaknesses", "სუსტი", "bg-[var(--rp-weak-bg)]", "text-[var(--rp-weak-text)]"],
                    ] as const
                  ).map(([side, label, bg, tone]) => (
                    <div key={side} className={`rounded-[14px] px-4 py-3.5 ${bg}`}>
                      <p className={`text-[13px] font-bold ${tone}`}>{label}</p>
                      <ul className="mt-2 space-y-2 text-[15px] leading-[1.65] text-[var(--rp-text)]">
                        {result.criticalAnalysis![side].map((point, index) => (
                          <li key={index}>
                            <Point point={point} showPages={showPages} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : key === "theses" ? (
                <ol className="mt-3 space-y-2.5">
                  {(result.theses ?? []).map((point, index) => (
                    <li key={index} className="flex gap-3 text-[15.5px] leading-[1.7] text-[var(--rp-text)]">
                      <span className="w-5 shrink-0 text-right font-bold tabular-nums text-[var(--rp-number)]">{index + 1}.</span>
                      <span className="min-w-0">
                        <Point point={point} showPages={showPages} />
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {(result[key as Exclude<ResearchSectionKey, "criticalAnalysis">] ?? []).map((point, index) => (
                    <p key={index} className="text-[15.5px] leading-[1.7] text-[var(--rp-text)]">
                      <Point point={point} showPages={showPages} />
                    </p>
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {result.sources.length > 0 || result.quotes.length > 0 ? (
          <details className="rounded-[14px] border border-[var(--rp-card-border)] px-4 py-3" data-html2canvas-ignore>
            <summary className={`cursor-pointer rounded text-[14px] font-semibold text-[var(--rp-strong)] ${FOCUS}`}>
              წყაროები და ციტატები
            </summary>
            <div className="mt-3 space-y-4 text-[14.5px] leading-relaxed text-[var(--rp-text)]">
              {result.sources.length > 0 ? (
                <ul className="space-y-2">
                  {result.sources.map((source, index) => (
                    <li key={index}>
                      <span className="font-semibold text-[var(--rp-strong)]">{source.citation}</span> — {source.relevance}
                    </li>
                  ))}
                </ul>
              ) : null}
              {result.quotes.length > 0 ? (
                <ul className="space-y-3">
                  {result.quotes.map((quote, index) => (
                    <li key={index} className="border-l-2 border-[var(--rp-line-strong)] pl-3">
                      „{quote.quote}“
                      <span className="mt-0.5 block text-[13px] text-[var(--rp-muted)]">
                        {quote.context}
                        {quote.location ? ` · ${quote.location}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </details>
        ) : null}
      </div>
    </article>
  );
}
