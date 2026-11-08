"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, Square } from "lucide-react";
import { fetchAiTextStream } from "@/lib/ai/fetch-ai";
import type { Conspectus } from "@/lib/conspectus-storage";
import { MarkdownContent } from "@/components/MarkdownContent";

/** How much of the conspectus goes with each question, and how many earlier messages. */
const ASK_CONTEXT_CHARS = 12_000;
const ASK_HISTORY = 6;

export interface AskTurn {
  question: string;
  answer: string;
}

export interface ConspectusAskState {
  turns: AskTurn[];
  pending: AskTurn | null;
  error: string | null;
  send: (question: string) => void;
  stop: () => void;
}

/** „ჰკითხე კონსპექტს“: answers from the conspectus's own text (the notes' AI endpoint). Kept while the page is open. */
export function useConspectusAsk(conspectus: Conspectus, subjectName: string | null): ConspectusAskState {
  const [turns, setTurns] = useState<AskTurn[]>([]);
  const [pending, setPending] = useState<AskTurn | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const turnsRef = useRef<AskTurn[]>([]);
  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);
  useEffect(() => () => abort.current?.abort(), []);

  const send = useCallback(
    (message: string) => {
      const question = message.trim();
      if (!question || abort.current) return;
      const controller = new AbortController();
      abort.current = controller;
      setError(null);
      setPending({ question, answer: "" });
      let answer = "";
      const history = turnsRef.current
        .slice(-ASK_HISTORY / 2)
        .flatMap((turn) => [
          { role: "user" as const, text: turn.question },
          { role: "assistant" as const, text: turn.answer },
        ]);
      void fetchAiTextStream(
        {
          pageType: "lecture-notes",
          responseMode: "stream",
          signal: controller.signal,
          payload: {
            mode: "chat",
            title: conspectus.title,
            subject: subjectName ?? undefined,
            content: conspectus.content.slice(0, ASK_CONTEXT_CHARS),
            history,
            message: question,
          },
        },
        (partial) => {
          answer = partial;
          setPending({ question, answer: partial });
        },
      )
        .then(() => {
          if (!answer.trim()) throw new Error("AI-მ პასუხი ვერ დააბრუნა. სცადე თავიდან.");
          setTurns((current) => [...current, { question, answer: answer.trim() }]);
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
    [conspectus.title, conspectus.content, subjectName],
  );

  const stop = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    setPending(null);
  }, []);

  return { turns, pending, error, send, stop };
}

/** The question field with its pink send (or stop, while answering). */
export function AskInput({ ask, autoFocus = false }: { ask: ConspectusAskState; autoFocus?: boolean }) {
  const [value, setValue] = useState("");
  const busy = ask.pending !== null;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (busy || !value.trim()) return;
    ask.send(value);
    setValue("");
  };
  return (
    <form onSubmit={submit} className="cs-field">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="მაგ. ამიხსენი მარტივად"
        aria-label="კითხვა კონსპექტზე"
        autoFocus={autoFocus}
        maxLength={500}
        enterKeyHint="send"
      />
      {busy ? (
        <button type="button" onClick={ask.stop} className="cs-send cs-focus" aria-label="შეჩერება">
          <Square className="h-3.5 w-3.5 fill-current" aria-hidden />
        </button>
      ) : (
        <button type="submit" disabled={!value.trim()} className="cs-send cs-focus" aria-label="გაგზავნა">
          <ArrowUp className="h-4 w-4" strokeWidth={2.6} aria-hidden />
        </button>
      )}
    </form>
  );
}

function Turn({ turn, streaming = false }: { turn: AskTurn; streaming?: boolean }) {
  return (
    <div className="space-y-2">
      <p className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-md bg-[var(--cs-soft)] px-3 py-2 text-[14px] font-medium text-[var(--cs-title)]">{turn.question}</p>
      {turn.answer ? (
        <MarkdownContent content={turn.answer} className="text-[14.5px] [&_p]:my-1.5 [&_ul]:my-1.5" />
      ) : streaming ? (
        <p className="flex items-center gap-1.5 text-[13px] text-[var(--cs-muted)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pink-500" aria-hidden />
          ვფიქრობ…
        </p>
      ) : null}
    </div>
  );
}

/** The answers so far: the newest last. Its box (`data-ask-scroll`) follows the newest answer, and nothing else scrolls. */
export function AskThread({ ask, empty }: { ask: ConspectusAskState; empty?: string }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = end.current?.closest<HTMLElement>("[data-ask-scroll]");
    if (box) box.scrollTop = box.scrollHeight;
  }, [ask.turns.length, ask.pending?.answer]);
  if (!ask.turns.length && !ask.pending && !ask.error) {
    return empty ? <p className="text-[13.5px] leading-relaxed text-[var(--cs-muted)]">{empty}</p> : null;
  }
  return (
    <div className="space-y-4" aria-live="polite">
      {ask.turns.map((turn, index) => (
        <Turn key={index} turn={turn} />
      ))}
      {ask.pending ? <Turn turn={ask.pending} streaming /> : null}
      {ask.error ? (
        <p role="alert" className="text-[13.5px] text-red-600 dark:text-red-400">
          {ask.error}
        </p>
      ) : null}
      <div ref={end} />
    </div>
  );
}
