"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, Compass, Loader2, Square } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { streamAiText } from "@/lib/assistant-stream-client";
import { buildChatHistory } from "@/lib/ai/ai-teacher-conversation";
import { chatContext } from "@/lib/task-helper-actions";
import { addTaskMessages, type TaskHelper } from "@/lib/task-helper-store";
import { logActivity } from "@/lib/activity-log";

const CHAT_ERROR = "პასუხი ვერ მივიღეთ. სცადე თავიდან.";

/**
 * The plan's chat: the mentor's follow-up question with quick replies, the
 * conversation, and a box pinned to the bottom of the screen (above the
 * phone's dock). Each question goes with the assignment, the plan and the
 * chosen idea; the conversation is saved with the assignment.
 */
export function TaskChat({ task }: { task: TaskHelper }) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<{ question: string; answer: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => () => abort.current?.abort(), []);
  // Follow a question being answered; opening a saved chat stays at the top of the page.
  useEffect(() => {
    if (pending) end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [pending]);

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text || pending) return;
    setDraft("");
    setError(null);
    setPending({ question: text, answer: "" });
    const controller = new AbortController();
    abort.current = controller;
    try {
      const answer = await streamAiText(
        "/api/task-helper/chat",
        JSON.stringify({
          message: text,
          history: buildChatHistory(task.messages.map(({ role, content }) => ({ role, content }))),
          context: chatContext(task),
        }),
        {
          signal: controller.signal,
          fallbackError: CHAT_ERROR,
          onChunk: (partial) => setPending({ question: text, answer: partial }),
        },
      );
      addTaskMessages(task.id, [
        { role: "user", content: text },
        { role: "assistant", content: answer.trim() },
      ]);
      logActivity({ type: "ai_message", tool: "other", subject: task.subjectName ?? null, meta: { tool: "task-helper" } });
    } catch (caught) {
      if (controller.signal.aborted) {
        setDraft(text);
      } else {
        setError(caught instanceof Error && caught.message ? caught.message : CHAT_ERROR);
        setDraft(text);
      }
    } finally {
      setPending(null);
      abort.current = null;
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void ask(draft);
  };

  const bubble = (role: "user" | "assistant", content: string, key: string | number, live = false) => (
    <div key={key} className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      {role === "user" ? (
        <p className="max-w-[85%] whitespace-pre-wrap rounded-[18px] bg-[var(--th-strong)] px-4 py-2.5 text-[14.5px] leading-relaxed text-[var(--th-on-strong)]">{content}</p>
      ) : (
        <div className="max-w-[92%] rounded-[18px] bg-[var(--th-soft)] px-4 py-2.5 text-[14.5px] leading-relaxed text-[var(--th-title)]">
          {content ? <MarkdownContent content={content} /> : live ? <Loader2 className="h-4 w-4 animate-spin" aria-label="იწერება" /> : null}
        </div>
      )}
    </div>
  );

  return (
    <>
      <section id="th-chat" aria-label="ჩატი" className="th-card flex flex-col gap-4 p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="th-tile flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]" aria-hidden>
            <Compass className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-[15.5px] font-bold leading-snug text-[var(--th-title)]">{task.result.followUp.question}</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {task.result.followUp.options.map((option) => (
                <button key={option} type="button" disabled={Boolean(pending)} onClick={() => void ask(option)} className="th-chip th-chip--wrap th-focus disabled:opacity-50">
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {task.messages.length > 0 || pending ? (
          <div className="flex flex-col gap-2.5 border-t border-[var(--th-border)] pt-4" aria-live="polite">
            {task.messages.map((message, index) => bubble(message.role, message.content, index))}
            {pending ? (
              <>
                {bubble("user", pending.question, "pending-q")}
                {bubble("assistant", pending.answer, "pending-a", true)}
              </>
            ) : null}
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="text-[13.5px] font-medium text-rose-600 dark:text-rose-400">
            {error}
          </p>
        ) : null}
        <div ref={end} />
      </section>

      {/* Pinned to the bottom: above the phone's dock and the home indicator; clear of the desktop's AI button. */}
      <form
        onSubmit={submit}
        className="sticky bottom-[calc(env(safe-area-inset-bottom)+100px)] z-20 mt-4 flex items-center gap-2 rounded-full border border-[var(--th-border)] bg-[var(--th-card)] p-1.5 pl-5 shadow-[0_10px_30px_-12px_rgb(15_23_42/0.25)] md:bottom-5 md:mr-16"
      >
        <label htmlFor="th-ask" className="sr-only">
          ჰკითხე რამე ამ დავალებაზე
        </label>
        <input
          id="th-ask"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={2000}
          placeholder="ჰკითხე რამე ამ დავალებაზე"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--th-title)] outline-none placeholder:text-[var(--th-muted)]"
        />
        {pending ? (
          <button type="button" onClick={() => abort.current?.abort()} aria-label="შეჩერება" className="th-secondary th-focus h-11 w-11 shrink-0">
            <Square className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <button type="submit" disabled={!draft.trim()} aria-label="გაგზავნა" className="th-primary th-focus h-11 w-11 shrink-0">
            <ArrowUp className="h-5 w-5" aria-hidden />
          </button>
        )}
      </form>
    </>
  );
}
