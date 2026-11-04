"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, Clock, FileText, ListOrdered, Loader2, MessageCircle, RotateCcw, Send, Sparkles, Trophy, X } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { MarkdownContent } from "@/components/MarkdownContent";
import { RichText } from "@/components/math/RichText";
import { fetchAiTextStream } from "@/lib/ai/fetch-ai";
import { logActivity } from "@/lib/activity-log";
import { setDockHidden } from "@/lib/mobile-overlay";
import { readSavedSemesterSubjects } from "@/lib/semester-subjects";
import { fetchExcerpts, joinExcerpts } from "@/lib/subject-actions";
import { getSubjectFileBlob } from "@/lib/subject-files-client";
import { getFile, getTopic, setTopicStatus } from "@/lib/subject-store";
import { handOff } from "@/lib/tool-handoff";
import { onRemoteUserData } from "@/lib/user-data";
import { requestCheck, requestPart, requestPlan, STUDY_ERROR } from "@/lib/study/client";
import { CHECK_QUESTIONS, type SourceRef, type StudyCheck, type StudyPart } from "@/lib/study/schemas";
import {
  getSession,
  isFinished,
  missedTopics,
  MODE_LABELS,
  progressOf,
  remainingMinutes,
  saveSession,
  scoreOf,
  sourceLabel,
  STUDY_CHAT_LIMIT,
  STUDY_SESSIONS_KEY,
  type StudySession as Session,
} from "@/lib/study/sessions";
import "../subjects.css";
import "./study.css";

/** The chat's reference: the part, then the files' text, at most this. */
const CHAT_CONTEXT_CHARS = 8000;
/** The AI teacher endpoint takes the last ten turns. */
const CHAT_HISTORY_TURNS = 10;

const setAt = <T,>(list: T[], index: number, value: T): T[] => {
  const next = [...list];
  next[index] = value;
  return next;
};

/** The bold terms of a part, for the chat's suggestions. */
const boldTerms = (markdown: string) => [...new Set([...markdown.matchAll(/\*\*([^*]{2,40})\*\*/g)].map((match) => match[1].trim()))];

function partText(title: string, part: StudyPart): string {
  return [`## ${title}`, part.explanation, part.example ? `მაგალითი: ${part.example}` : ""].filter(Boolean).join("\n\n");
}

/** Three options; after an answer, the right one green with ✓, a wrong pick pink, and the feedback. */
function Question({
  check,
  answer,
  onAnswer,
  label = "შეამოწმე თავი",
}: {
  check: StudyCheck;
  answer: number | null;
  onAnswer: (index: number) => void;
  label?: string;
}) {
  const answered = answer !== null;
  return (
    <div>
      <p className="text-[13px] font-bold text-[var(--sj-muted)]">{label}</p>
      <p className="mt-1.5 text-[16.5px] font-semibold leading-snug text-[var(--sj-title)]">
        <RichText text={check.question} />
      </p>
      <div className="mt-3 flex flex-col gap-2" role="radiogroup" aria-label={check.question}>
        {check.options.map((option, index) => {
          const state = !answered ? undefined : index === check.correctIndex ? "right" : index === answer ? "wrong" : undefined;
          return (
            <button
              key={index}
              type="button"
              role="radio"
              aria-checked={answer === index}
              disabled={answered}
              data-state={state}
              onClick={() => onAnswer(index)}
              className="st-option sj-focus flex items-center gap-3 rounded-[16px] px-4 py-2.5 text-left text-[15px] text-[var(--sj-title)] disabled:cursor-default"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--sj-soft)] text-[13px] font-bold text-[var(--sj-muted)]" aria-hidden>
                {state === "right" ? <Check className="h-4 w-4 text-[#16a34a] dark:text-[#4ade80]" strokeWidth={3} /> : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <RichText text={option} />
              </span>
            </button>
          );
        })}
      </div>
      {answered ? (
        <p role="status" className={`mt-3 text-[14.5px] leading-relaxed ${answer === check.correctIndex ? "text-[#15803d] dark:text-[#86efac]" : "text-[#be185d] dark:text-[#f9a8d4]"}`}>
          <b>{answer === check.correctIndex ? "სწორია. " : "არა. "}</b>
          <RichText text={check.feedback} />
        </p>
      ) : null}
    </div>
  );
}

/** A bottom sheet on a phone (the plan, the chat). */
function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="დახურვა" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="sj-card absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col !rounded-b-none p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <div className="flex items-center gap-2 pb-2">
          <p className="min-w-0 flex-1 text-[17px] font-bold text-[var(--sj-title)]">{title}</p>
          <button type="button" onClick={onClose} aria-label="დახურვა" className="sj-focus flex h-9 w-9 items-center justify-center rounded-full text-[var(--sj-muted)] hover:bg-[var(--sj-hover)]">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/**
 * One study session (/subjects/<id>/study/<sessionId>): the plan made from
 * the files, then part by part (each made when needed, one ahead), each
 * with its source, an example and one question; „უფრო მარტივად“ makes the
 * part again; „ჰკითხე ამ მასალას“ beside it. Saved on the account at every
 * step, so it goes on from here on another device. At the end: the result,
 * what to go over again, a quiz on the mistakes and cards from the hard
 * parts.
 */
export function StudySession({ subjectId, sessionId }: { subjectId: string; sessionId: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [missing, setMissing] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [topicTitle, setTopicTitle] = useState<string | null>(null);
  const [view, setView] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [sheet, setSheet] = useState<"plan" | "chat" | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const inFlight = useRef(new Set<string>());

  // The session, and its subject and topic.
  useEffect(() => {
    const load = () => {
      const found = getSession(sessionId);
      setMissing(!found);
      if (found && (!sessionRef.current || found.updatedAt > sessionRef.current.updatedAt) && inFlight.current.size === 0) {
        sessionRef.current = found;
        setSession(found);
        setTopicTitle(found.topicId ? (getTopic(found.topicId)?.title ?? null) : null);
      }
      setSubjectName(readSavedSemesterSubjects().find((subject) => subject.id === subjectId)?.name ?? "");
    };
    void Promise.resolve().then(load);
    // Studied on another device meanwhile: that copy, unless something is being made here.
    return onRemoteUserData((key) => key === STUDY_SESSIONS_KEY, load);
  }, [sessionId, subjectId]);

  // The phone's dock gives way to the lesson's own buttons.
  useEffect(() => {
    setDockHidden("study-session", true);
    return () => setDockHidden("study-session", false);
  }, []);

  const commit = useCallback((change: (current: Session) => Session) => {
    const current = sessionRef.current;
    if (!current) return;
    const next = saveSession(change(current));
    sessionRef.current = next;
    setSession(next);
  }, []);

  /** Runs one request at a time per key; the result is committed, an error shown. */
  const run = useCallback(async (key: string, work: () => Promise<(current: Session) => Session>) => {
    if (inFlight.current.has(key)) return;
    inFlight.current.add(key);
    setBusy((current) => ({ ...current, [key]: true }));
    try {
      const change = await work();
      setError(null);
      commit(change);
    } catch (problem) {
      setError(problem instanceof Error && problem.message ? problem.message : STUDY_ERROR);
    } finally {
      inFlight.current.delete(key);
      setBusy((current) => ({ ...current, [key]: false }));
    }
  }, [commit]);

  const topicHint = topicTitle ?? undefined;
  const plan = session?.plan ?? null;
  const index = Math.min(view ?? session?.currentIndex ?? 0, Math.max(0, (plan?.length ?? 1) - 1));

  // The plan (or, for „შემამოწმე“, the questions first).
  const needsCheck = session && !plan && session.mode === "check" && !session.checkQuestions;
  const checkDone = session?.checkQuestions && session.checkAnswers?.length === session.checkQuestions.length && session.checkAnswers.every((answer) => answer !== null);
  const needsPlan = session && !plan && (session.mode !== "check" || checkDone);
  const sessionKey = session?.id;
  useEffect(() => {
    const current = sessionRef.current;
    if (!current || error) return;
    if (needsCheck) {
      void run("check", async () => {
        const result = await requestCheck(current.files, topicHint);
        return (latest) => ({ ...latest, checkQuestions: result.questions, checkAnswers: result.questions.map(() => null), kinds: { ...latest.kinds, ...result.kinds } });
      });
    } else if (needsPlan) {
      const focus = current.checkQuestions ? missedTopics(current.checkQuestions, current.checkAnswers ?? []) : undefined;
      // „შემამოწმე“ with every answer right: nothing to explain.
      if (focus && focus.length === 0) {
        void Promise.resolve().then(() => commit((latest) => ({ ...latest, plan: [], finishedAt: Date.now() })));
        return;
      }
      void run("plan", async () => {
        const result = await requestPlan(current.files, current.mode, topicHint, focus);
        return (latest) => ({ ...latest, plan: result.parts, parts: result.parts.map(() => null), answers: result.parts.map(() => null), currentIndex: 0, kinds: { ...latest.kinds, ...result.kinds } });
      });
    }
  }, [sessionKey, needsCheck, needsPlan, error, topicHint, run, commit]);

  // This part and the next one, made when needed.
  const partsReady = session?.parts.map(Boolean).join(",") ?? "";
  useEffect(() => {
    const current = sessionRef.current;
    if (!current?.plan || error || isFinished(current)) return;
    const currentPlan = current.plan;
    for (const at of [index, index + 1]) {
      if (at >= currentPlan.length || current.parts[at]) continue;
      void run(`part-${at}`, async () => {
        const result = await requestPart(current.files, current.mode, currentPlan, at);
        return (latest) => ({ ...latest, parts: setAt(latest.parts, at, result.part), kinds: { ...latest.kinds, ...result.kinds } });
      });
    }
  }, [index, partsReady, error, run]);

  const simpler = () => {
    const current = sessionRef.current;
    if (!current?.plan) return;
    const currentPlan = current.plan;
    void run(`simpler-${index}`, async () => {
      const result = await requestPart(current.files, current.mode, currentPlan, index, true);
      return (latest) => ({ ...latest, parts: setAt(latest.parts, index, result.part), answers: setAt(latest.answers, index, null) });
    });
  };

  const answer = (option: number) => {
    if (!session?.parts[index] || session.answers[index] !== null) return;
    commit((latest) => ({ ...latest, answers: setAt(latest.answers, index, option) }));
  };

  const finish = useCallback(() => {
    const current = sessionRef.current;
    if (!current) return;
    const score = scoreOf(current);
    const minutes = Math.max(1, Math.round((Date.now() - current.startedAt) / 60_000));
    commit((latest) => ({ ...latest, finishedAt: Date.now() }));
    if (current.topicId && score.total > 0 && score.correct / score.total >= 0.7) setTopicStatus(current.topicId, "done");
    logActivity({ type: "ai_session", tool: "study_session", subject: subjectName || null, value: score.total ? Math.round((score.correct / score.total) * 100) : null, meta: { mode: current.mode, parts: score.total, minutes } });
  }, [commit, subjectName]);

  const next = useCallback(() => {
    const current = sessionRef.current;
    if (!current?.plan || current.answers[index] === null || current.answers[index] === undefined) return;
    if (index >= current.plan.length - 1) {
      finish();
      return;
    }
    setView(index + 1);
    commit((latest) => ({ ...latest, currentIndex: Math.max(latest.currentIndex, index + 1) }));
  }, [index, commit, finish]);

  // „შემამოწმე“'s questions, one at a time.
  const checkIndex = session?.checkAnswers ? session.checkAnswers.findIndex((item) => item === null) : -1;
  const [checkView, setCheckView] = useState(0);
  const answerCheck = (option: number) => {
    commit((latest) => ({ ...latest, checkAnswers: setAt(latest.checkAnswers ?? [], checkView, option) }));
  };

  // Keyboard: 1/2/3 choose, Enter goes on.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const current = sessionRef.current;
      if (!current || isFinished(current)) return;
      if (["1", "2", "3"].includes(event.key)) {
        const option = Number(event.key) - 1;
        if (!current.plan && current.checkQuestions && current.checkAnswers?.[checkView] === null) answerCheck(option);
        else if (current.parts[index] && current.answers[index] === null && option < (current.parts[index]?.check.options.length ?? 0)) answer(option);
      } else if (event.key === "Enter") {
        if (current.plan) next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const back = `/subjects/${encodeURIComponent(subjectId)}${session?.topicId ? `?topic=${encodeURIComponent(session.topicId)}` : ""}`;

  if (!session) {
    return (
      <div className="sj under-site-header min-h-dvh max-md:-mt-[var(--safe-top)]">
        <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-[calc(var(--safe-top)+16px)] sm:px-6 md:pt-10">
          <BackButton fallbackHref={back} />
          {missing ? (
            <section className="sj-card mt-6 flex flex-col items-center gap-3 px-6 py-12 text-center">
              <p className="text-[17px] font-bold text-[var(--sj-title)]">სესია ვერ მოიძებნა</p>
              <Link href={back} className="sj-primary sj-focus h-11 px-5 text-[14.5px]">
                საგანზე დაბრუნება
              </Link>
            </section>
          ) : (
            <div className="sj-card mt-6 h-80 animate-pulse motion-reduce:animate-none" aria-busy="true" aria-label="სესია იტვირთება" />
          )}
        </div>
      </div>
    );
  }

  const { done, total } = progressOf(session);
  const minutesLeft = remainingMinutes(session);
  const part = session.parts[index] ?? null;
  const planPart = plan?.[index];
  const source = planPart ? sourceLabel(planPart.refs[0], session) : null;
  const title = `${subjectName || "საგანი"} · ${MODE_LABELS[session.mode]}`;

  const openSource = async (ref: SourceRef | undefined) => {
    if (!ref) return;
    const record = getFile(ref.fileId);
    if (!record) return;
    const opened = window.open("", "_blank");
    const blob = await getSubjectFileBlob(record);
    if (!blob) {
      opened?.close();
      setError("ფაილი ვერ გაიხსნა. სცადე მასალებიდან.");
      return;
    }
    const url = `${URL.createObjectURL(blob)}${/\.pdf$/i.test(record.name) ? `#page=${ref.unit}` : ""}`;
    if (opened) opened.location.href = url;
    else window.location.assign(url);
  };

  const errorBox = error ? (
    <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 rounded-[16px] border border-[#fbcfe8] bg-[#fdf2f8] px-4 py-3 text-[14px] text-[#9d174d] dark:border-pink-400/30 dark:bg-pink-500/10 dark:text-[#f9a8d4]">
      <span className="min-w-0 flex-1">{error}</span>
      <button type="button" onClick={() => setError(null)} className="sj-secondary sj-focus h-9 px-3.5 text-[13.5px]">
        <RotateCcw className="h-4 w-4" aria-hidden />
        თავიდან ცდა
      </button>
    </div>
  ) : null;

  /* --- Finished ----------------------------------------------------------- */
  if (isFinished(session)) return <Finished session={session} subjectName={subjectName} topicTitle={topicTitle} back={back} />;

  /* --- „შემამოწმე“: the questions first ---------------------------------------- */
  if (!plan && session.mode === "check") {
    const questions = session.checkQuestions;
    const current = questions?.[checkView];
    const answered = session.checkAnswers?.[checkView] ?? null;
    return (
      <div className="sj under-site-header min-h-dvh max-md:-mt-[var(--safe-top)] max-md:-mb-36 max-md:pb-36">
        <div className="mx-auto w-full max-w-[760px] px-4 pb-16 pt-[calc(var(--safe-top)+16px)] sm:px-6 md:pt-10">
          <header className="flex items-center gap-3">
            <BackButton fallbackHref={back} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-[var(--sj-muted)]">{title}</p>
              <p className="text-[18px] font-bold text-[var(--sj-title)]">ჯერ შევამოწმოთ, რა იცი</p>
            </div>
          </header>
          {errorBox}
          {!questions || !current ? (
            <section className="sj-card mt-5 flex items-center gap-3 p-6 text-[15px] text-[var(--sj-text)]" aria-busy="true">
              <Loader2 className="h-5 w-5 animate-spin text-[#e11d74]" aria-hidden />
              {busy.plan ? "ვამზადებთ ახსნას იმაზე, რაც ვერ იცი…" : `ვამზადებთ ${CHECK_QUESTIONS} კითხვას მასალიდან…`}
            </section>
          ) : (
            <section className="sj-card mt-5 p-5 sm:p-7">
              <p className="text-[13px] font-semibold text-[var(--sj-muted)]">
                კითხვა {checkView + 1} / {questions.length}
              </p>
              <div className="mt-3">
                <Question check={current} answer={answered} onAnswer={answerCheck} label={current.topic} />
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  disabled={answered === null}
                  onClick={() => setCheckView((value) => Math.min(questions.length - 1, value + 1))}
                  className={`sj-primary sj-focus h-11 px-5 text-[14.5px] ${checkView >= questions.length - 1 ? "!hidden" : ""}`}
                >
                  შემდეგი
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
                {checkView >= questions.length - 1 && checkIndex === -1 ? (
                  <p className="flex items-center gap-2 text-[14px] font-semibold text-[var(--sj-muted)]">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ვამზადებთ ახსნას იმაზე, რაც ვერ იცი…
                  </p>
                ) : null}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  /* --- The lesson --------------------------------------------------------- */
  const terms = part ? boldTerms(part.explanation) : [];
  const suggestions = part && planPart
    ? [terms[0] ? `რა არის ${terms[0]}?` : `ამიხსენი მარტივად: ${planPart.title}`, "მომიყევი სხვა მაგალითი", terms[1] ? `რით განსხვავდება ${terms[0]} და ${terms[1]}?` : "რატომ არის ეს მნიშვნელოვანი?"]
    : [];
  const answeredHere = session.answers[index] !== null && session.answers[index] !== undefined;
  const loadingPart = !part && (busy[`part-${index}`] || !error);

  const planList = (
    <ol className="flex flex-col gap-1">
      {(plan ?? []).map((item, at) => {
        const finished = session.answers[at] !== null && session.answers[at] !== undefined;
        const current = at === index;
        const reachable = finished || at <= session.currentIndex;
        return (
          <li key={at}>
            <button
              type="button"
              disabled={!reachable}
              onClick={() => {
                setView(at);
                setSheet(null);
              }}
              aria-current={current ? "step" : undefined}
              className={`sj-focus flex w-full items-start gap-2.5 rounded-[12px] px-2.5 py-2 text-left text-[14px] disabled:cursor-default ${current ? "bg-[var(--sj-soft)] font-semibold text-[var(--sj-title)]" : "text-[var(--sj-text)] hover:bg-[var(--sj-hover)]"}`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${finished ? "bg-[#dcfce7] text-[#15803d] dark:bg-emerald-400/15 dark:text-emerald-300" : current ? "st-dot-current" : "bg-[var(--sj-soft)] text-[var(--sj-muted)]"}`}
                aria-hidden
              >
                {finished ? <Check className="h-3 w-3" strokeWidth={3} /> : current ? "●" : at + 1}
              </span>
              <span className="min-w-0 flex-1 leading-snug">{item.title}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );

  const chat = <StudyChat session={session} index={index} suggestions={suggestions} commit={commit} />;

  return (
    <div className="sj under-site-header min-h-dvh max-md:-mt-[var(--safe-top)] max-lg:pb-28">
      <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-[calc(var(--safe-top)+16px)] sm:px-6 md:pt-8">
        <header className="flex flex-wrap items-center gap-3 sm:gap-4">
          <BackButton fallbackHref={back} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-[var(--sj-muted)]">{title}</p>
            <p className="text-[18px] font-bold text-[var(--sj-title)] sm:text-[20px]">
              <span className="max-lg:hidden">სწავლის სესია</span>
              <span className="lg:hidden">{total ? `ნაწილი ${index + 1} / ${total} · ${minutesLeft} წთ` : "სწავლის სესია"}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <button type="button" onClick={() => setSheet("plan")} aria-label="მასალის გეგმა" className="sj-secondary sj-focus h-10 w-10">
              <ListOrdered className="h-[18px] w-[18px]" aria-hidden />
            </button>
            <button type="button" onClick={() => setSheet("chat")} aria-label="ჰკითხე ამ მასალას" className="sj-secondary sj-focus h-10 w-10">
              <MessageCircle className="h-[18px] w-[18px]" aria-hidden />
            </button>
          </div>
          {total ? (
            <div className="w-full max-w-[320px] max-lg:hidden">
              <div className="flex justify-between text-[13px] font-semibold">
                <span className="text-[var(--sj-title)]">
                  {done} / {total} გავლილი
                </span>
                <span className="text-[var(--sj-muted)]">დარჩა დაახლოებით {minutesLeft} წთ</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--sj-track)]" role="progressbar" aria-label="გავლილი ნაწილები" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total}>
                <div className="h-full rounded-full bg-[#e11d74] transition-[width] duration-500" style={{ width: `${(done / total) * 100}%` }} />
              </div>
            </div>
          ) : null}
        </header>
        {total ? (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--sj-track)] lg:hidden" aria-hidden>
            <div className="h-full rounded-full bg-[#e11d74] transition-[width] duration-500" style={{ width: `${(done / total) * 100}%` }} />
          </div>
        ) : null}
        {errorBox}

        <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-[270px_minmax(0,1fr)_300px]">
          <aside className="sj-card p-4 max-lg:hidden" aria-label="მასალის გეგმა">
            <p className="px-1 pb-2 text-[14px] font-bold text-[var(--sj-title)]">მასალის გეგმა</p>
            {plan ? planList : <div className="h-40 animate-pulse rounded-[12px] bg-[var(--sj-soft)] motion-reduce:animate-none" />}
          </aside>

          <article className="sj-card min-w-0 p-5 sm:p-7" aria-busy={!part}>
            {!plan || !planPart ? (
              <p className="flex items-center gap-3 text-[15px] text-[var(--sj-text)]">
                <Loader2 className="h-5 w-5 animate-spin text-[#e11d74]" aria-hidden />
                ვკითხულობთ მასალას და ვყოფთ ნაწილებად…
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="min-w-0 flex-1 text-[13px] font-semibold text-[var(--sj-muted)]">
                    ნაწილი {index + 1} / {plan.length}
                  </p>
                  {source ? (
                    <button type="button" onClick={() => void openSource(planPart.refs[0])} className="st-source sj-focus inline-flex h-8 max-w-full items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold" title="ფაილის გახსნა">
                      <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{source}</span>
                    </button>
                  ) : null}
                </div>
                <h2 className="mt-3 text-[22px] font-bold leading-tight text-[var(--sj-title)] sm:text-[26px]">{planPart.title}</h2>
                {part ? (
                  <>
                    <div className="st-lesson mt-3">
                      <MarkdownContent content={part.explanation} />
                    </div>
                    {part.example ? (
                      <div className="st-example mt-4 rounded-[16px] px-4 py-3 text-[15.5px] leading-relaxed">
                        <b className="st-example-label">მაგალითი: </b>
                        <RichText text={part.example} />
                      </div>
                    ) : null}
                    <div className="mt-6 border-t border-dashed border-[var(--sj-field-border)] pt-5">
                      <Question check={part.check} answer={session.answers[index] ?? null} onAnswer={answer} />
                    </div>
                    <div className="mt-6 flex flex-wrap items-center justify-end gap-2 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 max-lg:flex-nowrap max-lg:border-t max-lg:border-[var(--sj-border)] max-lg:bg-[var(--sj-card)] max-lg:px-4 max-lg:pb-[calc(env(safe-area-inset-bottom)+12px)] max-lg:pt-3">
                      <button type="button" onClick={simpler} disabled={Boolean(busy[`simpler-${index}`])} className="sj-secondary sj-focus h-11 px-4 text-[14px] max-lg:flex-1">
                        {busy[`simpler-${index}`] ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
                        <span className="max-sm:hidden">უფრო მარტივად ამიხსენი</span>
                        <span className="sm:hidden">უფრო მარტივად</span>
                      </button>
                      <button type="button" onClick={next} disabled={!answeredHere} className="sj-primary sj-focus h-11 px-5 text-[14px] max-lg:flex-1">
                        {index >= plan.length - 1 ? "დასრულება" : <><span className="max-sm:hidden">გავიგე, შემდეგი</span><span className="sm:hidden">შემდეგი</span></>}
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </>
                ) : loadingPart ? (
                  <div className="mt-4 flex flex-col gap-3" aria-label="ნაწილი მზადდება">
                    {[90, 100, 75, 60].map((width, at) => (
                      <span key={at} className="h-4 animate-pulse rounded-full bg-[var(--sj-soft)] motion-reduce:animate-none" style={{ width: `${width}%` }} />
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </article>

          <aside className="sj-card flex min-h-[420px] flex-col p-4 max-lg:hidden" aria-label="ჰკითხე ამ მასალას">
            <p className="px-1 pb-2 text-[14px] font-bold text-[var(--sj-title)]">ჰკითხე ამ მასალას</p>
            {chat}
          </aside>
        </div>
      </div>

      {sheet === "plan" ? (
        <Sheet title="მასალის გეგმა" onClose={() => setSheet(null)}>
          {plan ? planList : null}
        </Sheet>
      ) : null}
      {sheet === "chat" ? (
        <Sheet title="ჰკითხე ამ მასალას" onClose={() => setSheet(null)}>
          <div className="flex min-h-[50dvh] flex-col">{chat}</div>
        </Sheet>
      ) : null}
      {/* While a part is made: the next one is already on its way. */}
      <span className="sr-only" aria-live="polite">
        {part ? "" : "ნაწილი მზადდება"}
      </span>
    </div>
  );
}

/** „ჰკითხე ამ მასალას“: three suggestions from the part, the chat (kept with the session), the AI teacher's endpoint. */
function StudyChat({
  session,
  index,
  suggestions,
  commit,
}: {
  session: Session;
  index: number;
  suggestions: string[];
  commit: (change: (current: Session) => Session) => void;
}) {
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const excerpts = useRef<string | null>(null);
  const messages = session.chat ?? [];
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length, streaming]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || streaming !== null) return;
    setDraft("");
    setChatError(null);
    const part = session.parts[index];
    const title = session.plan?.[index]?.title ?? "";
    if (excerpts.current === null) {
      const files = session.files.flatMap((file) => {
        const record = getFile(file.id);
        return record ? [record] : [];
      });
      excerpts.current = joinExcerpts(await fetchExcerpts(files, CHAT_CONTEXT_CHARS));
    }
    const material = [part ? partText(title, part) : "", excerpts.current].filter(Boolean).join("\n\n--- მასალა ---\n").slice(0, CHAT_CONTEXT_CHARS + 2000);
    const history = messages.slice(-CHAT_HISTORY_TURNS).map((item) => ({ role: item.role, content: item.text.slice(0, 3900) }));
    commit((latest) => ({ ...latest, chat: [...(latest.chat ?? []), { role: "user" as const, text: message }].slice(-STUDY_CHAT_LIMIT) }));
    setStreaming("");
    try {
      const answer = await fetchAiTextStream({ pageType: "ai-teacher", payload: { material, message, space: "student", history } }, (partial) => setStreaming(partial));
      commit((latest) => ({ ...latest, chat: [...(latest.chat ?? []), { role: "assistant" as const, text: answer.trim() }].slice(-STUDY_CHAT_LIMIT) }));
    } catch (problem) {
      setChatError(problem instanceof Error && problem.message ? problem.message : STUDY_ERROR);
    } finally {
      setStreaming(null);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-2 lg:max-h-[52vh]">
        {messages.length === 0 && streaming === null ? (
          <div className="flex flex-col gap-2">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => void send(suggestion)} className="sj-focus rounded-[14px] border border-[var(--sj-field-border)] px-3 py-2 text-left text-[13.5px] text-[var(--sj-title)] hover:bg-[var(--sj-hover)]">
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
        {messages.map((item, at) =>
          item.role === "user" ? (
            <p key={at} className="ml-6 self-end rounded-[16px] bg-[#18181b] px-3.5 py-2 text-[14px] text-white dark:bg-[#fafaf9] dark:text-[#15151b]">
              {item.text}
            </p>
          ) : (
            <div key={at} className="text-[14px]">
              <MarkdownContent content={item.text} />
            </div>
          ),
        )}
        {streaming !== null ? (
          <div className="text-[14px]">{streaming ? <MarkdownContent content={streaming} /> : <Loader2 className="h-4 w-4 animate-spin text-[var(--sj-muted)]" aria-hidden />}</div>
        ) : null}
        {chatError ? (
          <p role="alert" className="text-[13px] text-[#be185d] dark:text-[#f9a8d4]">
            {chatError}
          </p>
        ) : null}
      </div>
      <form
        className="mt-2 flex items-center gap-2 rounded-full border border-[var(--sj-field-border)] bg-[var(--sj-card)] py-1 pl-4 pr-1"
        onSubmit={(event) => {
          event.preventDefault();
          void send(draft);
        }}
      >
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="დასვი კითხვა…" aria-label="კითხვა ამ მასალაზე" className="min-w-0 flex-1 bg-transparent py-1.5 text-[14px] text-[var(--sj-title)] outline-none placeholder:text-[var(--sj-muted)]" />
        <button type="submit" disabled={!draft.trim() || streaming !== null} aria-label="გაგზავნა" className="sj-primary sj-focus h-9 w-9 shrink-0">
          <Send className="h-4 w-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}

/** The end: the result, the parts to go over again, a quiz on the mistakes, cards from the hard parts. */
function Finished({ session, subjectName, topicTitle, back }: { session: Session; subjectName: string; topicTitle: string | null; back: string }) {
  const router = useRouter();
  const score = scoreOf(session);
  const checkScore = session.checkQuestions
    ? { correct: session.checkQuestions.filter((question, at) => session.checkAnswers?.[at] === question.correctIndex).length, total: session.checkQuestions.length }
    : null;
  const shown = score.total > 0 ? score : (checkScore ?? score);
  // Shown only once finished, so finishedAt is set.
  const minutes = Math.max(1, Math.round(((session.finishedAt ?? session.updatedAt) - session.startedAt) / 60_000));
  const plan = session.plan ?? [];
  const [markDone, setMarkDone] = useState(() => shown.total > 0 && shown.correct / shown.total >= 0.7);
  const link = session.topicId ? { subjectId: session.subjectId, topicId: session.topicId } : undefined;

  const toggleDone = () => {
    const nextValue = !markDone;
    setMarkDone(nextValue);
    if (session.topicId) setTopicStatus(session.topicId, nextValue ? "done" : "in_progress");
  };

  const wrongText = score.wrong
    .map((at) => {
      const part = session.parts[at];
      return part ? `${partText(plan[at]?.title ?? "", part)}\n\nკითხვა: ${part.check.question}\nსწორი პასუხი: ${part.check.options[part.check.correctIndex]}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
  const hard = score.wrong.length ? score.wrong : session.parts.map((_, at) => at);
  const hardText = hard
    .map((at) => {
      const part = session.parts[at];
      return part ? partText(plan[at]?.title ?? "", part) : "";
    })
    .filter(Boolean)
    .join("\n\n");
  const name = topicTitle ?? subjectName ?? "სესია";

  const quizMistakes = () => {
    handOff("quiz", { title: `${name}: შეცდომები`, text: wrongText, ...(link ? { link } : {}) });
    router.push("/quiz?tab=new");
  };
  const cardsHard = () => {
    handOff("cards", { title: `${name}: რთული ნაწილები`, text: hardText, ...(link ? { link } : {}) });
    router.push("/generate?tab=new&mode=cards");
  };

  return (
    <div className="sj under-site-header min-h-dvh max-md:-mt-[var(--safe-top)] max-md:-mb-36 max-md:pb-36">
      <div className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-[calc(var(--safe-top)+16px)] sm:px-6 md:pt-10">
        <header className="flex items-center gap-3">
          <BackButton fallbackHref={back} />
          <p className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[var(--sj-muted)]">
            {subjectName || "საგანი"} · {MODE_LABELS[session.mode]}
          </p>
        </header>
        <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="sj-card p-5 sm:p-7">
            <span className="st-trophy flex h-14 w-14 items-center justify-center rounded-[18px]" aria-hidden>
              <Trophy className="h-7 w-7" />
            </span>
            <h1 className="mt-4 text-[26px] font-bold leading-tight text-[var(--sj-title)]">მასალა გაიარე!</h1>
            <p className="mt-2 text-[17px] text-[var(--sj-title)]">
              <span className="st-mark font-bold">
                {shown.correct} / {shown.total} კითხვა სწორად
              </span>
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {[
                { label: "ნაწილი", value: String(plan.length) },
                { label: "გასამეორებელი", value: String(score.wrong.length) },
                { label: "დრო", value: `${minutes} წთ` },
              ].map((tile) => (
                <div key={tile.label} className="rounded-[16px] bg-[var(--sj-soft)] px-3 py-3">
                  <p className="text-[20px] font-bold text-[var(--sj-title)]">{tile.value}</p>
                  <p className="text-[12.5px] font-semibold text-[var(--sj-muted)]">{tile.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={quizMistakes} disabled={!wrongText} className="sj-primary sj-focus h-11 px-5 text-[14.5px] max-sm:w-full">
                ქვიზი შეცდომებზე
              </button>
              <button type="button" onClick={cardsHard} disabled={!hardText} className="sj-secondary sj-focus h-11 px-5 text-[14.5px] max-sm:w-full">
                ფლეშბარათები რთული ნაწილებიდან
              </button>
            </div>
            {!wrongText && score.total > 0 ? <p className="mt-2 text-[13px] text-[var(--sj-muted)]">შეცდომა არ გქონია, ქვიზი არ სჭირდება.</p> : null}
            {session.topicId && topicTitle ? (
              <button type="button" role="checkbox" aria-checked={markDone} onClick={toggleDone} className="sj-focus mt-5 flex items-center gap-3 rounded-[12px] text-left text-[14.5px] text-[var(--sj-title)]">
                <span className="st-check flex shrink-0 items-center justify-center" aria-hidden>
                  {markDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                </span>
                მონიშნე თემა „{topicTitle}“ ნასწავლად
              </button>
            ) : null}
            <p className="mt-5 flex items-center gap-2 text-[13.5px] text-[var(--sj-muted)]">
              <Clock className="h-4 w-4" aria-hidden />
              სესია შენახულია
              <Link href="/library?type=sessions" className="font-semibold text-[#e11d74] hover:underline dark:text-[#f472b6]">
                „ჩემს მასალებში“
              </Link>
            </p>
          </section>

          <section className="sj-card p-5" aria-labelledby="st-review">
            <h2 id="st-review" className="text-[17px] font-bold text-[var(--sj-title)]">
              გასამეორებელი
            </h2>
            {score.wrong.length === 0 ? (
              <p className="mt-2 text-[14px] text-[var(--sj-muted)]">ყველა კითხვას სწორად უპასუხე.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {score.wrong.map((at) => {
                  const part = session.parts[at];
                  const ref = plan[at]?.refs[0];
                  return part ? (
                    <li key={at} className="rounded-[16px] bg-[var(--sj-open)] p-3.5">
                      <p className="text-[14.5px] font-bold text-[var(--sj-title)]">{plan[at]?.title}</p>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--sj-text)]">
                        <RichText text={part.check.feedback} />
                      </p>
                      {ref ? <p className="st-source mt-2 inline-block rounded-[10px] px-2.5 py-1 text-[12px] font-semibold leading-snug">{sourceLabel(ref, session)}</p> : null}
                    </li>
                  ) : null;
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
