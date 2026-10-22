"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, BookmarkPlus, Check, Loader2 } from "lucide-react";
import { CopyButton } from "@/components/CodeBlock";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import { ELI5_LEVELS, stepEli5Level, type Eli5Level, type Eli5Response } from "@/lib/ai/eli5-schema";
import {
  addToHistory,
  eli5ToNoteText,
  historyItem,
  readEli5History,
  readEli5Level,
  writeEli5History,
  writeEli5Level,
  type Eli5HistoryItem,
} from "@/lib/eli5-history";
import {
  createBlankLectureNote,
  journalHref,
  loadLectureNotes,
  saveLectureNotes,
  upsertLectureNote,
} from "@/lib/lecture-notes";
import { markdownToPlainText, parseInline } from "@/lib/markdown-blocks";
import { handOff } from "@/lib/tool-handoff";

const BUSY_ERROR = "AI ახლა გადატვირთულია, სცადე ცოტა ხანში.";

const EXAMPLES = [
  { label: "ინფლაცია", tone: "green" },
  { label: "შავი ხვრელი", tone: "yellow" },
  { label: "რეკურსია", tone: "pink" },
  { label: "დნმ-ის რეპლიკაცია", tone: "blue" },
] as const;

const TONE: Record<(typeof EXAMPLES)[number]["tone"], string> = {
  green: "border-[var(--e-green-border)] bg-[var(--e-green-bg)] text-[var(--e-green-text)]",
  yellow: "border-[var(--e-yellow-border)] bg-[var(--e-yellow-bg)] text-[var(--e-yellow-text)]",
  pink: "border-[var(--e-pink-border)] bg-[var(--e-pink-bg)] text-[var(--e-pink-text)]",
  blue: "border-[var(--e-blue-border)] bg-[var(--e-blue-bg)] text-[var(--e-blue-text)]",
};

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--e-accent)]/40";
const CARD = "rounded-[22px] border border-[var(--e-card-border)] bg-[var(--e-card)]";
const QUIET_BUTTON = `inline-flex h-[34px] items-center gap-1.5 rounded-full border border-[var(--e-line)] bg-[var(--e-card)] px-3.5 text-[13px] font-semibold text-[var(--e-strong)] transition-colors hover:border-[var(--e-muted)] disabled:pointer-events-none disabled:opacity-45 ${FOCUS}`;
const ACCENT_PILL = `inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--e-accent-soft)] px-3.5 text-[13px] font-semibold text-[var(--e-accent-text)] transition-[filter] hover:brightness-95 ${FOCUS}`;

/** **bold** as a marker stroke (yellow, then pink …), `code` as code. */
function richText(text: string, mark: { next: number }): ReactNode[] {
  return parseInline(text).map((segment, index) =>
    segment.type === "bold" ? (
      <strong key={index} data-mark={mark.next++ % 2 === 0 ? "yellow" : "pink"}>
        {segment.text}
      </strong>
    ) : segment.type === "code" ? (
      <code key={index}>{segment.text}</code>
    ) : (
      segment.text
    ),
  );
}

/** One part of the explanation: a coloured dot and label over the text. */
function Part({ dot, label, labelColor, children }: { dot: string; label: string; labelColor: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="flex items-center gap-2 text-[13px] font-bold" style={{ color: labelColor }}>
        <span className="h-2 w-2 rounded-full" style={{ background: dot }} aria-hidden />
        {label}
      </h3>
      <p className="eli5-text mt-1.5 text-[16px] leading-[1.72] text-[var(--e-text)]">{children}</p>
    </section>
  );
}

/**
 * ELI5: the topic on the left (with the simplicity level and the latest
 * explanations), its explanation on the right in four parts — analogy, in
 * simple words, a real example, one sentence. One column below 900px.
 */
export function Eli5Explainer() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<Eli5Level>("kid");
  const [shown, setShown] = useState<Eli5HistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Eli5HistoryItem[]>([]);
  // The journal entry made from the shown explanation.
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const resultRef = useRef<HTMLElement>(null);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const stored = readEli5Level();
      if (stored) setLevel(stored);
      setHistory(readEli5History());
    });
  }, []);

  const chooseLevel = (next: Eli5Level) => {
    setLevel(next);
    writeEli5Level(next);
  };

  /** One column: the answer is below the form, so bring it into view. */
  const revealResult = () => {
    if (!window.matchMedia("(max-width: 900px)").matches) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() =>
      resultRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" }),
    );
  };

  const explain = async (topic = query, atLevel = level) => {
    const term = topic.trim();
    if (!term || isLoading) return;
    setQuery(term);
    if (atLevel !== level) chooseLevel(atLevel);
    setIsLoading(true);
    setError(null);
    setSavedNoteId(null);
    revealResult();
    try {
      const result = await fetchAiJson<Eli5Response>({
        pageType: "eli5",
        responseMode: "json",
        payload: { query: term, level: atLevel },
      });
      const item = historyItem(term, atLevel, result);
      setShown(item);
      setHistory((current) => {
        const next = addToHistory(current, item);
        writeEli5History(next);
        return next;
      });
      revealResult();
    } catch (err) {
      // A Georgian message (e.g. the daily limit) is worth showing as is.
      const message = err instanceof Error ? err.message : "";
      setError(/[ა-ჿ]/.test(message) ? message : BUSY_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  /** From „ბოლოს ახსნილი“: the saved explanation, no AI call. */
  const reopen = (item: Eli5HistoryItem) => {
    setShown(item);
    setQuery(item.query);
    chooseLevel(item.level);
    setError(null);
    setSavedNoteId(null);
    revealResult();
  };

  const saveToJournal = () => {
    if (!shown) return;
    const note = {
      ...createBlankLectureNote("ai-notes"),
      title: shown.result.title.trim() || shown.query,
      content: eli5ToNoteText(shown.result),
    };
    saveLectureNotes(upsertLectureNote(loadLectureNotes(), note));
    setSavedNoteId(note.id);
  };

  const plainText = shown ? `${shown.result.title}\n\n${markdownToPlainText(eli5ToNoteText(shown.result))}` : "";

  const quizMe = () => {
    if (!shown) return;
    handOff("quiz", { title: shown.result.title || shown.query, text: plainText });
    router.push("/quiz");
  };

  const simpler = shown ? stepEli5Level(shown.level, -1) : null;
  const deeper = shown ? stepEli5Level(shown.level, 1) : null;
  const mark = { next: 0 };

  return (
    // Phones: the page colour also runs under the shell's dock padding.
    <div className="eli5 under-site-header min-h-dvh max-md:-mt-[var(--safe-top)] max-md:-mb-36 max-md:pb-36">
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-16 pt-[calc(var(--safe-top)+16px)] sm:px-6 md:pt-10">
        <header className="flex items-center gap-3">
          <Link
            href="/dashboard-student"
            aria-label="დეშბორდზე დაბრუნება"
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--e-line)] bg-[var(--e-card)] text-[var(--e-strong)] transition-colors hover:border-[var(--e-muted)] ${FOCUS}`}
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[24px] font-bold leading-tight text-[var(--e-strong)] sm:text-[26px]">ELI5 ახსნა</h1>
            <p className="text-[14px] text-[var(--e-muted)]">რთული თემა — მარტივი ენით</p>
          </div>
        </header>

        <div className="mt-6 flex flex-wrap items-start gap-5 sm:mt-8">
          {/* Left: the topic. */}
          <section aria-label="თემა" className={`${CARD} min-w-0 flex-[1_1_340px] p-5 max-[901px]:basis-full min-[901px]:max-w-[400px]`}>
            <label htmlFor="eli5-query" className="text-[13px] font-semibold text-[var(--e-muted)]">
              რა აგიხსნა?
            </label>
            <textarea
              id="eli5-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  void explain();
                }
              }}
              placeholder="მაგ: ინფლაცია, რეკურსია, useEffect…"
              rows={3}
              // 16px: iOS zooms into anything smaller.
              className="mt-2 min-h-[110px] w-full resize-y rounded-[16px] border border-[var(--e-line)] bg-[var(--e-card)] px-4 py-3 text-[16px] leading-[1.6] text-[var(--e-strong)] outline-none transition-colors placeholder:text-[var(--e-muted)] focus:border-[var(--e-strong)]"
            />

            <p id="eli5-level-label" className="mt-5 text-[13px] font-semibold text-[var(--e-muted)]">
              სიმარტივის დონე
            </p>
            <div role="group" aria-labelledby="eli5-level-label" className="mt-2 flex gap-1 rounded-[14px] bg-[var(--e-soft)] p-1">
              {ELI5_LEVELS.map((item) => {
                const active = level === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => chooseLevel(item.id)}
                    className={`h-9 flex-auto whitespace-nowrap rounded-[10px] px-1.5 text-[12.5px] transition-colors sm:text-[13px] ${FOCUS} ${
                      active
                        ? "bg-[var(--e-seg-active)] font-bold text-[var(--e-strong)] shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                        : "font-medium text-[var(--e-muted)] hover:text-[var(--e-strong)]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => void explain()}
              disabled={!query.trim() || isLoading}
              className={`mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--e-accent)] text-[15px] font-bold text-white transition-[filter,opacity] hover:brightness-110 disabled:pointer-events-none disabled:opacity-45 ${FOCUS}`}
            >
              {isLoading ? <Loader2 className="h-[18px] w-[18px] animate-spin motion-reduce:animate-none" aria-hidden /> : null}
              {isLoading ? "ვფიქრობ…" : "მარტივად ამიხსენი"}
            </button>
            <p className="mt-2 hidden text-center text-[12px] text-[var(--e-muted)] [@media(hover:hover)]:block">⌘/Ctrl + Enter</p>

            {history.length > 0 ? (
              <div className="mt-5 border-t border-[var(--e-card-border)] pt-4">
                <p className="text-[13px] font-semibold text-[var(--e-muted)]">ბოლოს ახსნილი</p>
                <ul className="mt-2 space-y-0.5">
                  {history.slice(0, 5).map((item) => (
                    <li key={`${item.level}-${item.query}`}>
                      <button
                        type="button"
                        onClick={() => reopen(item)}
                        className={`flex w-full items-center justify-between gap-3 rounded-[10px] px-2.5 py-2 text-left text-[14px] text-[var(--e-text)] transition-colors hover:bg-[var(--e-soft)] ${FOCUS}`}
                      >
                        <span className="min-w-0 truncate">{item.query}</span>
                        <span className="shrink-0 text-[12px] text-[var(--e-muted)]">
                          {ELI5_LEVELS.find((entry) => entry.id === item.level)?.label}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {/* Right: the explanation. */}
          <section
            ref={resultRef}
            aria-label="ახსნა"
            aria-busy={isLoading}
            className={`${CARD} min-w-0 flex-[999_1_480px] scroll-mt-4 p-5 sm:p-7 max-[901px]:basis-full`}
          >
            {isLoading ? (
              <div className="space-y-6">
                <div className="h-7 w-1/2 animate-pulse rounded-lg bg-[var(--e-soft)] motion-reduce:animate-none" />
                {[0, 1, 2].map((block) => (
                  <div key={block} className="space-y-2.5">
                    <div className="h-3 w-24 animate-pulse rounded bg-[var(--e-soft)] motion-reduce:animate-none" />
                    <div className="h-4 w-full animate-pulse rounded bg-[var(--e-soft)] motion-reduce:animate-none" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--e-soft)] motion-reduce:animate-none" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div role="alert">
                <p className="text-[16px] font-semibold text-[var(--e-strong)]">ახსნა ვერ მოვამზადე</p>
                <p className="mt-1 text-[15px] text-[var(--e-muted)]">{error}</p>
                <button type="button" onClick={() => void explain()} disabled={!query.trim()} className={`${QUIET_BUTTON} mt-4`}>
                  ხელახლა ცდა
                </button>
              </div>
            ) : shown ? (
              <article>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <h2 className="min-w-0 flex-1 break-words text-[22px] font-bold leading-snug text-[var(--e-strong)] sm:text-[24px]">
                    {shown.result.title || shown.query}
                  </h2>
                  <div className="flex shrink-0 items-center gap-2">
                    <CopyButton
                      text={plainText}
                      iconOnly
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--e-line)] text-[var(--e-muted)] transition-colors hover:text-[var(--e-strong)]"
                    />
                    {savedNoteId ? (
                      <Link href={journalHref(savedNoteId, "ai-notes")} className={ACCENT_PILL}>
                        <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden />
                        ჟურნალშია — ნახვა
                      </Link>
                    ) : (
                      <button type="button" onClick={saveToJournal} className={ACCENT_PILL}>
                        <BookmarkPlus className="h-4 w-4" aria-hidden />
                        ჟურნალში შენახვა
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-5 space-y-5">
                  <Part dot="#facc15" label="ანალოგია" labelColor="var(--e-label-analogy)">
                    {richText(shown.result.analogy, mark)}
                  </Part>
                  <Part dot="#4ade80" label="მარტივად" labelColor="var(--e-label-simple)">
                    {richText(shown.result.simple, mark)}
                  </Part>
                  {shown.result.example?.trim() ? (
                    <Part dot="#ec4899" label="რეალური მაგალითი" labelColor="var(--e-label-example)">
                      {richText(shown.result.example, mark)}
                    </Part>
                  ) : null}
                  <section className="rounded-[16px] bg-[var(--e-soft)] px-4 py-3.5">
                    <h3 className="text-[13px] font-bold text-[var(--e-muted)]">ერთი წინადადებით</h3>
                    <p className="eli5-text mt-1 text-[16px] font-semibold leading-[1.6] text-[var(--e-strong)]">
                      {richText(shown.result.oneLiner, mark)}
                    </p>
                  </section>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!simpler}
                    onClick={() => simpler && void explain(shown.query, simpler)}
                    className={QUIET_BUTTON}
                  >
                    უფრო მარტივად
                  </button>
                  <button
                    type="button"
                    disabled={!deeper}
                    onClick={() => deeper && void explain(shown.query, deeper)}
                    className={QUIET_BUTTON}
                  >
                    უფრო ღრმად
                  </button>
                  <button type="button" onClick={quizMe} className={QUIET_BUTTON}>
                    შემამოწმე ქვიზით
                  </button>
                </div>
              </article>
            ) : (
              <div>
                <p className="text-[15px] text-[var(--e-muted)]">ჩაწერე თემა მარცხნივ, ან სცადე:</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {EXAMPLES.map((example) => (
                    <button
                      key={example.label}
                      type="button"
                      onClick={() => void explain(example.label)}
                      className={`inline-flex h-[34px] items-center rounded-full border px-3.5 text-[13px] font-semibold transition-[filter] hover:brightness-95 ${TONE[example.tone]} ${FOCUS}`}
                    >
                      {example.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
