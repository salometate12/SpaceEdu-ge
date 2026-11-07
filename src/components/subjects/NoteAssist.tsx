"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent, type MutableRefObject } from "react";
import { ArrowUp, Check, Copy, Layers, ListChecks, NotebookText, Sparkles, TextCursorInput, X } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { useKeyboardInset } from "@/hooks/useKeyboardInset";
import { fetchAiTextStream } from "@/lib/ai/fetch-ai";
import { setMobileOverlay } from "@/lib/mobile-overlay";
import {
  appendAsk,
  askPayload,
  askSuggestions,
  noteToolHref,
  type AskMessage,
  type NoteTool,
  type SubjectNote,
} from "@/lib/subject-notes";

/* --- „ჰკითხე ამ ჩანაწერს“: the conversation ------------------------------ */

export interface AskState {
  /** The question being answered, and the answer so far. */
  pending: { question: string; answer: string } | null;
  error: string | null;
  send: (message: string) => void;
  stop: () => void;
}

/**
 * Questions about the note: the note (title, subject, text up to 8k) and
 * the last 10 messages go with each one; the answer streams in, and both
 * are kept with the note (the last 20).
 */
export function useAskNote(
  noteRef: MutableRefObject<SubjectNote | null>,
  subjectName: string | null,
  saveHistory: (history: AskMessage[]) => void,
): AskState {
  const [pending, setPending] = useState<AskState["pending"]>(null);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);

  const send = useCallback(
    (message: string) => {
      const question = message.trim();
      const note = noteRef.current;
      if (!question || !note || abort.current) return;
      const controller = new AbortController();
      abort.current = controller;
      setError(null);
      setPending({ question, answer: "" });
      let answer = "";
      void fetchAiTextStream(
        { pageType: "lecture-notes", responseMode: "stream", signal: controller.signal, payload: askPayload(note, subjectName, question) },
        (partial) => {
          answer = partial;
          setPending({ question, answer: partial });
        },
      )
        .then(() => {
          if (!answer.trim()) throw new Error("AI-მ პასუხი ვერ დააბრუნა. სცადე თავიდან.");
          const at = Date.now();
          const latest = noteRef.current ?? note;
          saveHistory(appendAsk(latest.askHistory, { role: "user", text: question, at }, { role: "assistant", text: answer.trim(), at: at + 1 }));
        })
        .catch((reason: unknown) => {
          if (controller.signal.aborted) return;
          setError(reason instanceof Error && reason.message ? reason.message : "AI ამჟამად მიუწვდომელია. სცადე თავიდან.");
        })
        .finally(() => {
          if (abort.current === controller) abort.current = null;
          setPending(null);
        });
    },
    [noteRef, subjectName, saveHistory],
  );

  const stop = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    setPending(null);
  }, []);

  return { pending, error, send, stop };
}

/* --- „საკვანძო თემები“ -------------------------------------------------- */

export function KeyTopics({
  keywords,
  busy,
  state,
  onPick,
  layout = "wrap",
}: {
  keywords: string[];
  busy: boolean;
  /** Without topics: the text is too short, they're on their way, or none came back for this text. */
  state: "short" | "waiting" | "failed";
  onPick: (topic: string) => void;
  /** `row`: one line that scrolls sideways (phones). */
  layout?: "wrap" | "row";
}) {
  if (layout === "row") {
    if (keywords.length === 0) return null;
    return (
      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-7 sm:px-7" aria-label="საკვანძო თემები">
        {keywords.map((topic) => (
          <button key={topic} type="button" onClick={() => onPick(topic)} className="sj-key-topic sj-focus shrink-0">
            {topic}
          </button>
        ))}
      </div>
    );
  }
  return (
    <section className="sj-card p-5" aria-labelledby="key-topics-title">
      <h2 id="key-topics-title" className="text-[15px] font-bold text-[var(--sj-title)]">
        საკვანძო თემები
      </h2>
      <p className="mt-0.5 text-[13px] text-[var(--sj-muted)]">დააჭირე და AI აგიხსნის</p>
      {keywords.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {keywords.map((topic) => (
            <button key={topic} type="button" onClick={() => onPick(topic)} className="sj-key-topic sj-focus">
              {topic}
            </button>
          ))}
        </div>
      ) : busy || state === "waiting" ? (
        <div className="mt-3 flex flex-wrap gap-2" aria-busy="true" aria-label="საკვანძო თემები მზადდება">
          {[72, 96, 60].map((width) => (
            <span key={width} className="h-8 animate-pulse rounded-full bg-[var(--sj-hover)] motion-reduce:animate-none" style={{ width }} />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--sj-text)]">
          {state === "failed" ? "თემები ვერ გამოვყავით. ჩანაწერს რომ შეცვლი, ისევ ვცდით." : "თემები გამოჩნდება, როცა ჩანაწერში 300 სიმბოლოზე მეტი იქნება."}
        </p>
      )}
    </section>
  );
}

/* --- „ამ ჩანაწერიდან შექმენი“ ----------------------------------------- */

const TOOLS: { tool: NoteTool; label: string; icon: typeof ListChecks; tone: string }[] = [
  { tool: "quiz", label: "ქვიზი", icon: ListChecks, tone: "tool-quiz sj-tool-icon" },
  { tool: "cards", label: "ფლეშბარათები", icon: Layers, tone: "tool-cards sj-tool-icon" },
  { tool: "summary", label: "კონსპექტი", icon: NotebookText, tone: "tool-summary sj-tool-icon" },
];

/** The three tools; `ready` once the note has text, `beforeOpen` saves it first. */
export function NoteTools({
  noteId,
  ready,
  beforeOpen,
  layout = "card",
  role,
}: {
  noteId: string;
  ready: boolean;
  beforeOpen: () => void;
  /** `card`: the side column. `row`: three tiles (the chat sheet). `menu`: „⋯“ rows. */
  layout?: "card" | "row" | "menu";
  role?: "menuitem";
}) {
  if (layout === "menu") {
    return (
      <>
        <p className="px-3 pb-1 pt-2 text-[12px] font-semibold text-[var(--sj-muted)]">ამ ჩანაწერიდან შექმენი</p>
        {TOOLS.map(({ tool, label, icon: Icon, tone }) =>
          ready ? (
            <Link key={tool} href={noteToolHref(noteId, tool)} role={role} onClick={beforeOpen} className="sj-menu-item sj-focus">
              <span className={`${tone} flex h-6 w-6 items-center justify-center rounded-md`}>
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              {label}
            </Link>
          ) : null,
        )}
        {!ready ? <p className="px-3 pb-2 text-[13px] text-[var(--sj-muted)]">ჯერ ჩაწერე რამე ჩანაწერში.</p> : null}
      </>
    );
  }
  const tiles = (
    <div className={layout === "row" ? "grid grid-cols-3 gap-2" : "mt-3 grid gap-2"}>
      {TOOLS.map(({ tool, label, icon: Icon, tone }) => {
        const inner = (
          <>
            <span className={`${tone} flex h-8 w-8 shrink-0 items-center justify-center rounded-lg`}>
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 truncate">{label}</span>
          </>
        );
        const shape =
          layout === "row"
            ? "flex flex-col items-center gap-1.5 rounded-xl border border-[var(--sj-border)] px-2 py-2.5 text-[12.5px] font-semibold text-[var(--sj-title)]"
            : "flex items-center gap-3 rounded-xl border border-[var(--sj-border)] px-3 py-2.5 text-[14px] font-semibold text-[var(--sj-title)]";
        return ready ? (
          <Link key={tool} href={noteToolHref(noteId, tool)} onClick={beforeOpen} className={`${shape} sj-focus hover:bg-[var(--sj-hover)]`}>
            {inner}
          </Link>
        ) : (
          <span key={tool} aria-disabled="true" className={`${shape} cursor-not-allowed opacity-50`}>
            {inner}
          </span>
        );
      })}
    </div>
  );
  if (layout === "row") return tiles;
  return (
    <section className="sj-card p-5" aria-labelledby="note-tools-title">
      <h2 id="note-tools-title" className="text-[15px] font-bold text-[var(--sj-title)]">
        ამ ჩანაწერიდან შექმენი
      </h2>
      {tiles}
      {!ready ? <p className="mt-2 text-[13px] text-[var(--sj-muted)]">ჯერ ჩაწერე რამე ჩანაწერში.</p> : null}
    </section>
  );
}

/* --- The thread and its input ----------------------------------------- */

function CopyAnswer({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => setCopied(true), () => undefined);
      }}
      className="sj-answer-action sj-focus"
    >
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {copied ? "კოპირებულია" : "კოპირება"}
    </button>
  );
}

function Answer({ text, onInsert, streaming = false }: { text: string; onInsert?: (text: string) => void; streaming?: boolean }) {
  return (
    <div className="text-[14.5px] leading-relaxed text-[var(--sj-title)]">
      {text ? (
        <div className="sj-answer">
          <MarkdownContent content={text} />
        </div>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-[13.5px] text-[var(--sj-muted)]">
          <Sparkles className="h-3.5 w-3.5 animate-pulse motion-reduce:animate-none" aria-hidden />
          ფიქრობს…
        </span>
      )}
      {!streaming && text && onInsert ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button type="button" onClick={() => onInsert(text)} className="sj-answer-action sj-focus">
            <TextCursorInput className="h-3.5 w-3.5" aria-hidden />
            ჩანაწერში ჩასმა
          </button>
          <CopyAnswer text={text} />
        </div>
      ) : null}
    </div>
  );
}

/** The messages (or suggestions, when there are none yet). */
export function AskThread({
  history,
  ask,
  keywords,
  onInsert,
  canAsk,
}: {
  history: AskMessage[];
  ask: AskState;
  keywords: string[];
  onInsert: (text: string) => void;
  canAsk: boolean;
}) {
  const end = useRef<HTMLDivElement>(null);
  const pendingAnswer = ask.pending?.answer;
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [history.length, pendingAnswer]);

  if (history.length === 0 && !ask.pending) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-[13.5px] text-[var(--sj-muted)]">{canAsk ? "ჰკითხე რამე ამ ლექციაზე, ან სცადე:" : "ჯერ ჩაწერე რამე ჩანაწერში, მერე ჰკითხე."}</p>
        {canAsk
          ? askSuggestions(keywords).map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => ask.send(suggestion)} className="sj-suggestion sj-focus">
                {suggestion}
              </button>
            ))
          : null}
        {ask.error ? <p role="alert" className="text-[13px] font-medium text-rose-600 dark:text-rose-400">{ask.error}</p> : null}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {history.map((message) =>
        message.role === "user" ? (
          <p key={`${message.at}-u`} className="sj-question">
            {message.text}
          </p>
        ) : (
          <Answer key={`${message.at}-a`} text={message.text} onInsert={onInsert} />
        ),
      )}
      {ask.pending ? (
        <>
          <p className="sj-question">{ask.pending.question}</p>
          <Answer text={ask.pending.answer} streaming />
        </>
      ) : null}
      {ask.error ? <p role="alert" className="text-[13px] font-medium text-rose-600 dark:text-rose-400">{ask.error}</p> : null}
      <div ref={end} />
    </div>
  );
}

export function AskInput({ ask, canAsk, autoFocus = false }: { ask: AskState; canAsk: boolean; autoFocus?: boolean }) {
  const [value, setValue] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!value.trim() || ask.pending || !canAsk) return;
    ask.send(value);
    setValue("");
  };
  return (
    <form onSubmit={submit} className="sj-ask-pill">
      <Sparkles className="h-4 w-4 shrink-0 text-[#e11d74]" aria-hidden />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="ჰკითხე ამ ჩანაწერს"
        aria-label="კითხვა ჩანაწერზე"
        disabled={!canAsk}
        autoFocus={autoFocus}
        enterKeyHint="send"
        className="min-w-0 flex-1 bg-transparent text-[14.5px] text-[var(--sj-title)] outline-none placeholder:text-[var(--sj-muted)] disabled:cursor-not-allowed"
      />
      {ask.pending ? (
        <button type="button" onClick={ask.stop} aria-label="შეჩერება" className="sj-send sj-focus">
          <span className="h-2.5 w-2.5 rounded-[2px] bg-current" aria-hidden />
        </button>
      ) : (
        <button type="submit" aria-label="გაგზავნა" disabled={!value.trim() || !canAsk} className="sj-send sj-focus">
          <ArrowUp className="h-4 w-4" strokeWidth={2.6} aria-hidden />
        </button>
      )}
    </form>
  );
}

/** The side column's chat card. */
export function AskCard(props: Parameters<typeof AskThread>[0]) {
  return (
    <section className="sj-card flex max-h-[min(36rem,calc(100dvh-8rem))] flex-col p-5" aria-labelledby="ask-note-title">
      <h2 id="ask-note-title" className="text-[15px] font-bold text-[var(--sj-title)]">
        ჰკითხე ამ ჩანაწერს
      </h2>
      <div className="-mx-1 mt-3 min-h-0 flex-1 overflow-y-auto px-1" aria-live="polite">
        <AskThread {...props} />
      </div>
      <div className="mt-3">
        <AskInput ask={props.ask} canAsk={props.canAsk} />
      </div>
    </section>
  );
}

/* --- Phones: the pill at the bottom and the chat sheet ---------------- */

export function MobileAsk({
  open,
  onOpen,
  onClose,
  noteId,
  toolsReady,
  beforeOpenTool,
  ...thread
}: Parameters<typeof AskThread>[0] & {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  noteId: string;
  toolsReady: boolean;
  beforeOpenTool: () => void;
}) {
  const keyboard = useKeyboardInset();
  useEffect(() => {
    setMobileOverlay("note-ask", open);
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      setMobileOverlay("note-ask", false);
    };
  }, [open, onClose]);

  return (
    <div className="lg:hidden">
      {!open ? (
        <button
          type="button"
          onClick={onOpen}
          className="sj-ask-pill sj-focus fixed inset-x-4 z-40 mx-auto max-w-[560px] text-left shadow-[0_12px_32px_-14px_rgb(0_0_0/0.35)]"
          style={{ bottom: `calc(${keyboard ? `${keyboard}px` : "env(safe-area-inset-bottom)"} + 12px)` }}
        >
          <Sparkles className="h-4 w-4 shrink-0 text-[#e11d74]" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-[14.5px] text-[var(--sj-muted)]">ჰკითხე ამ ჩანაწერს</span>
          <span className="sj-send" aria-hidden>
            <ArrowUp className="h-4 w-4" strokeWidth={2.6} />
          </span>
        </button>
      ) : (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="ask-sheet-title">
          <button type="button" aria-label="დახურვა" onClick={onClose} className="absolute inset-0 bg-black/40" />
          <div
            className="sj-sheet absolute inset-x-0 flex flex-col"
            style={{ bottom: keyboard, maxHeight: `calc(100dvh - ${keyboard}px - 40px)` }}
          >
            <div className="flex items-center gap-3 px-4 pb-2 pt-3">
              <h2 id="ask-sheet-title" className="flex-1 text-[16px] font-bold text-[var(--sj-title)]">
                ჰკითხე ამ ჩანაწერს
              </h2>
              <button type="button" onClick={onClose} aria-label="დახურვა" className="sj-secondary sj-focus h-9 w-9">
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="px-4 pb-3">
              <NoteTools noteId={noteId} ready={toolsReady} beforeOpen={beforeOpenTool} layout="row" />
            </div>
            <div className="min-h-[8rem] flex-1 overflow-y-auto border-t border-[var(--sj-border)] px-4 py-4" aria-live="polite">
              <AskThread {...thread} />
            </div>
            <div className="border-t border-[var(--sj-border)] px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3" style={keyboard ? { paddingBottom: 12 } : undefined}>
              <AskInput ask={thread.ask} canAsk={thread.canAsk} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
