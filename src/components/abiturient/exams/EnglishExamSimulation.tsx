"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  LoaderCircle,
  Sparkles,
  Trophy,
} from "lucide-react";
import type { EnglishExamVariant, EnglishTask } from "@/data/englishExamsData";
import { useEnglishWritingGrading } from "./useEnglishWritingGrading";
import { EnglishTaskBody } from "@/components/abiturient/english/EnglishTaskBody";
import { EnglishWritingReport } from "@/components/abiturient/english/EnglishWritingReport";

function formatClock(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/** score of a task from the picks (deterministic letter compare). */
function taskScore(task: EnglishTask, picks: Record<string, string>): number {
  return task.items.reduce((n, it) => n + (picks[it.id] === it.correctLabel ? 1 : 0), 0);
}

export function EnglishExamSimulation({
  variant,
  onExit,
}: {
  variant: EnglishExamVariant;
  onExit: () => void;
}) {
  // stage: 0..(tasks-1) = task index, then "essay", then "done".
  const [stage, setStage] = useState<number | "essay" | "done">(0);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [essayDraft, setEssayDraft] = useState("");
  const [remaining, setRemaining] = useState(variant.durationSeconds);
  const essayGrading = useEnglishWritingGrading("abit-exam-english-essay");

  useEffect(() => {
    if (stage === "done") return;
    const id = window.setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => window.clearInterval(id);
  }, [stage]);

  const mcqScore = useMemo(
    () => variant.tasks.reduce((n, t) => n + taskScore(t, picks), 0),
    [variant.tasks, picks],
  );
  const essayWords = essayDraft.trim() ? essayDraft.trim().split(/\s+/).filter(Boolean).length : 0;

  const finishExam = useCallback(() => {
    if (essayDraft.trim() && !essayGrading.result && !essayGrading.busy) {
      void essayGrading.grade(essayDraft, {
        prompt: variant.essay.prompt,
        minWords: variant.essay.minWords,
        maxWords: variant.essay.maxWords,
      });
    }
    setStage("done");
  }, [essayDraft, essayGrading, variant.essay]);

  const restart = () => {
    setPicks({});
    setEssayDraft("");
    essayGrading.reset();
    setRemaining(variant.durationSeconds);
    setStage(0);
  };

  const onPick = (itemId: string, label: string) =>
    setPicks((p) => ({ ...p, [itemId]: label }));

  const header = (
    <div className="mb-5 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onExit}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> არქივზე დაბრუნება
      </button>
      <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-amber-300/60 bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
        <Clock className="h-3.5 w-3.5" /> {formatClock(remaining)}
      </span>
    </div>
  );

  const title = (
    <>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        ინგლისური ენა — {variant.label} · {variant.year}
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
        {variant.tasks.length + 1} დავალება · სულ {variant.totalPoints} ქულა
      </p>
    </>
  );

  /* ------------------------------ task stage ----------------------------- */
  if (typeof stage === "number") {
    const task = variant.tasks[stage];
    const isLastTask = stage === variant.tasks.length - 1;
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {header}
        {title}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#121214]">
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-amber-300/60 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
            Task {task.number} · {task.title} · {task.points} ქულა
          </span>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-500 dark:text-zinc-400">
            {task.instruction}
          </p>
        </div>

        <div className="mt-4">
          <EnglishTaskBody task={task} picks={picks} onPick={onPick} />
        </div>

        <button
          type="button"
          onClick={() => setStage(isLastTask ? "essay" : stage + 1)}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-5 py-3 text-sm font-bold text-white hover:bg-amber-600 sm:w-auto"
        >
          {isLastTask ? "წერით დავალებაზე გადასვლა" : `Task ${task.number + 1}-ზე გადასვლა`}
          <ArrowRight className="h-4 w-4" />
        </button>
      </main>
    );
  }

  /* -------------------------------- essay -------------------------------- */
  if (stage === "essay") {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {header}
        {title}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#121214]">
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-amber-300/60 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
            Task 7 · Writing · {variant.essay.points} ქულა
          </span>
          <p className="mt-3 text-[15px] font-medium leading-relaxed text-slate-900 dark:text-slate-100">
            {variant.essay.prompt}
          </p>
          <p className="mt-1 text-[12px] text-slate-500 dark:text-zinc-400">
            Write between {variant.essay.minWords}–{variant.essay.maxWords} words.
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#121214]">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Your essay
            </span>
            <span
              className={`text-[11px] font-bold ${
                essayWords >= variant.essay.minWords
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-500 dark:text-zinc-400"
              }`}
            >
              {essayWords} words
            </span>
          </div>
          <textarea
            value={essayDraft}
            onChange={(e) => setEssayDraft(e.target.value)}
            placeholder="Write your essay here…"
            className="min-h-[320px] w-full resize-y rounded-xl border-2 border-slate-300/80 bg-white p-4 text-sm text-slate-900 outline-none focus:border-amber-500/70 dark:border-white/[0.14] dark:bg-[#0c0b12] dark:text-slate-100"
          />
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-slate-500 dark:text-zinc-400">
          პასუხი/ქულა არსად ჩანს დასრულებამდე — ერთი ღილაკი აფასებს ყველა დავალებას ერთად.
        </p>
        <button
          type="button"
          onClick={finishExam}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-5 py-3 text-sm font-bold text-white hover:bg-amber-600 sm:w-auto"
        >
          <Sparkles className="h-4 w-4" />
          გამოცდის დასრულება და შეფასება
          <ArrowRight className="h-4 w-4" />
        </button>
      </main>
    );
  }

  /* -------------------------------- done --------------------------------- */
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      {header}
      <EnglishResults
        variant={variant}
        picks={picks}
        essayDraft={essayDraft}
        essayResult={essayGrading.result}
        essayBusy={essayGrading.busy}
        essayUsedFallback={essayGrading.usedFallback}
        mcqScore={mcqScore}
        remaining={remaining}
        onRestart={restart}
        onExit={onExit}
      />
    </main>
  );
}

/* ------------------------------ results ---------------------------------- */
function EnglishResults({
  variant,
  picks,
  essayDraft,
  essayResult,
  essayBusy,
  essayUsedFallback,
  mcqScore,
  remaining,
  onRestart,
  onExit,
}: {
  variant: EnglishExamVariant;
  picks: Record<string, string>;
  essayDraft: string;
  essayResult: ReturnType<typeof useEnglishWritingGrading>["result"];
  essayBusy: boolean;
  essayUsedFallback: boolean;
  mcqScore: number;
  remaining: number;
  onRestart: () => void;
  onExit: () => void;
}) {
  const [openTask, setOpenTask] = useState<string | null>(null);
  const [showEssay, setShowEssay] = useState(false);

  const essayScore = essayResult?.totalScore ?? 0;
  const essayAttempted = Boolean(essayDraft.trim());
  const grand = mcqScore + essayScore;

  const rowClass =
    "flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-white/10 dark:bg-[#121214]";

  return (
    <div className="mt-2">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
          <Trophy className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">გამოცდა დასრულდა</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          {variant.label} · {variant.year}
        </p>
        <p className="mt-6 text-5xl font-black text-amber-600 dark:text-amber-400">
          {grand}
          <span className="text-2xl text-slate-400">/{variant.totalPoints}</span>
        </p>
        <p className="mt-1 text-sm font-bold text-slate-500 dark:text-zinc-400">
          {Math.round((grand / variant.totalPoints) * 100)}% · დარჩენილი დრო {formatClock(remaining)}
        </p>
      </div>

      {/* ------------------------- score sheet ------------------------- */}
      <div className="mx-auto mt-8 max-w-lg">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          შენი ქულა შეფასების სქემით
        </p>
        <div className="space-y-2">
          {variant.tasks.map((t) => (
            <div key={t.id} className={rowClass}>
              <span className="text-slate-600 dark:text-zinc-300">
                Task {t.number} · {t.title}
              </span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                {taskScore(t, picks)} / {t.items.length}
              </span>
            </div>
          ))}
          <div className={rowClass}>
            <span className="text-slate-600 dark:text-zinc-300">Task 7 · Writing</span>
            {essayBusy ? (
              <span className="inline-flex items-center gap-1.5 font-bold text-slate-400">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> ფასდება…
              </span>
            ) : (
              <span
                className={`font-bold tabular-nums ${essayAttempted ? "text-slate-900 dark:text-white" : "text-slate-400"}`}
              >
                {essayAttempted ? `${essayScore} / ${variant.essay.points}` : `— / ${variant.essay.points}`}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-amber-300/70 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
            <span className="text-sm font-bold text-slate-900 dark:text-white">ჯამური ქულა</span>
            <span className="text-lg font-black tabular-nums text-amber-700 dark:text-amber-300">
              {grand} / {variant.totalPoints}
            </span>
          </div>
        </div>
        {essayBusy && (
          <p className="mt-3 inline-flex items-center gap-2 text-[12px] text-slate-500 dark:text-zinc-400">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            მიმდინარეობს წერითი დავალების შეფასება — ჯამი განახლდება.
          </p>
        )}
      </div>

      {/* ---------------------- per-task review ------------------------ */}
      <div className="mx-auto mt-8 max-w-lg space-y-3">
        {variant.tasks.map((t) => {
          const open = openTask === t.id;
          return (
            <div key={t.id}>
              <button
                type="button"
                onClick={() => setOpenTask(open ? null : t.id)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-left text-sm font-bold text-slate-900 transition hover:border-amber-300 dark:border-white/10 dark:bg-[#121214] dark:text-white dark:hover:border-amber-400/40"
              >
                <span>Task {t.number} — {t.title}</span>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                  <span className="tabular-nums">{taskScore(t, picks)}/{t.items.length}</span>
                  {open ? "დამალვა" : "ნახვა"}
                  <ChevronDown className={`h-4 w-4 stroke-[2.5] transition-transform ${open ? "rotate-180" : ""}`} />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3">
                      <EnglishTaskBody task={t} picks={picks} onPick={() => {}} reveal />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {essayResult && (
          <div>
            <button
              type="button"
              onClick={() => setShowEssay((v) => !v)}
              aria-expanded={showEssay}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-left text-sm font-bold text-slate-900 transition hover:border-amber-300 dark:border-white/10 dark:bg-[#121214] dark:text-white dark:hover:border-amber-400/40"
            >
              <span>Task 7 — Writing feedback</span>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                <span className="tabular-nums">{essayScore}/{variant.essay.points}</span>
                {showEssay ? "დამალვა" : "ნახვა"}
                <ChevronDown className={`h-4 w-4 stroke-[2.5] transition-transform ${showEssay ? "rotate-180" : ""}`} />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {showEssay && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="pt-3">
                    <EnglishWritingReport result={essayResult} usedFallback={essayUsedFallback} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600"
        >
          <CheckCircle2 className="h-4 w-4" /> თავიდან
        </button>
        <button
          type="button"
          onClick={onExit}
          className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 dark:border-white/10 dark:text-zinc-200"
        >
          არქივზე დაბრუნება
        </button>
      </div>
    </div>
  );
}
