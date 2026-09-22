"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  LoaderCircle,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import {
  isGeographyMcqSubItem,
  type GeographyExamVariant,
  type GeographyMcqQuestion,
  type GeographyOpenSubItem,
  type GeographyOptionLabel,
} from "@/data/geographyExamsData";
import type { GeographyOpenGraderReport } from "@/lib/ai/geography-open-task-grader-schema";
import { recordToolUsage } from "@/lib/activity";
import { GeographyQuestionFigures } from "@/components/abiturient/geography/GeographyQuestionFigures";
import { gradeGeographyOpenSubItem } from "./useGeographyOpenGrading";

interface SubItemResult {
  report: GeographyOpenGraderReport;
  usedFallback: boolean;
}

function formatClock(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

type Stage = "mcq" | "open" | "done";

/* ------------------------------ option picker ---------------------------- */
function OptionPicker({
  options,
  picked,
  onPick,
}: {
  options: { label: GeographyOptionLabel; text: string }[];
  picked?: GeographyOptionLabel;
  onPick: (label: GeographyOptionLabel) => void;
}) {
  return (
    <div className="mt-3 space-y-2">
      {options.map((opt) => {
        const isPicked = picked === opt.label;
        return (
          <button
            key={opt.label}
            type="button"
            onClick={() => onPick(opt.label)}
            className={`flex w-full items-start gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm leading-relaxed transition ${
              isPicked
                ? "border-emerald-400 bg-emerald-50 dark:border-emerald-500/50 dark:bg-emerald-500/10"
                : "border-slate-200 hover:border-emerald-300 dark:border-white/10 dark:hover:border-emerald-400/40"
            }`}
          >
            <span className="shrink-0 font-bold text-slate-500 dark:text-slate-400">{opt.label})</span>
            {opt.text && <span className="min-w-0 flex-1 text-slate-800 dark:text-slate-200">{opt.text}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------ one MCQ ---------------------------------- */
function McqCard({
  q,
  picked,
  onPick,
}: {
  q: GeographyMcqQuestion;
  picked?: GeographyOptionLabel;
  onPick: (label: GeographyOptionLabel) => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#121214]">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          {q.number}
        </span>
        <p className="text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100">{q.prompt}</p>
      </div>
      <GeographyQuestionFigures figures={q.figures} />
      <OptionPicker options={q.options} picked={picked} onPick={onPick} />
    </article>
  );
}

/* --------------------------- one open sub-item --------------------------- */
function OpenSubItemInput({
  subItem,
  draft,
  onDraftChange,
  pickedLabel,
  onPickLabel,
}: {
  subItem: GeographyOpenSubItem;
  draft: string;
  onDraftChange: (value: string) => void;
  pickedLabel?: GeographyOptionLabel;
  onPickLabel: (label: GeographyOptionLabel) => void;
}) {
  const isMcq = isGeographyMcqSubItem(subItem);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#121214]">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          {subItem.id} · {subItem.maxPoints} ქულა
        </span>
        <p className="text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100">{subItem.prompt}</p>
      </div>
      <GeographyQuestionFigures figures={subItem.figures} />
      {isMcq ? (
        <OptionPicker options={subItem.options!} picked={pickedLabel} onPick={onPickLabel} />
      ) : (
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder={subItem.requiresCalculation ? "ჩაწერე გამოთვლის პროცესი და პასუხი..." : "ჩაწერე პასუხი..."}
          className="mt-3 min-h-[110px] w-full resize-y rounded-xl border-2 border-slate-300/80 bg-white p-3 text-sm text-slate-900 outline-none focus:border-emerald-500/70 dark:border-white/[0.14] dark:bg-[#0c0b12] dark:text-slate-100"
        />
      )}
    </div>
  );
}

/* ------------------------------ the exam --------------------------------- */
export function GeographyExamSimulation({
  variant,
  onExit,
}: {
  variant: GeographyExamVariant;
  onExit: () => void;
}) {
  const [stage, setStage] = useState<Stage>("mcq");
  const [picks, setPicks] = useState<Record<number, GeographyOptionLabel>>({});
  const [subPicks, setSubPicks] = useState<Record<string, GeographyOptionLabel>>({});
  const [openDrafts, setOpenDrafts] = useState<Record<string, string>>({});
  const [openResults, setOpenResults] = useState<Record<string, SubItemResult>>({});
  const [gradingOpen, setGradingOpen] = useState(false);
  const [remaining, setRemaining] = useState(variant.durationSeconds);

  useEffect(() => {
    if (stage === "done") return;
    const id = window.setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => window.clearInterval(id);
  }, [stage]);

  // Open sub-items split by kind: MCQ (client-side) and open (AI-graded).
  const openSubItems = useMemo(
    () => variant.open.flatMap((task) => task.subItems.map((subItem) => ({ subItem, task }))),
    [variant.open],
  );
  const aiSubItems = useMemo(
    () => openSubItems.filter(({ subItem }) => !isGeographyMcqSubItem(subItem)),
    [openSubItems],
  );

  const mcqScore = useMemo(
    () => variant.mcq.reduce((n, q) => n + (picks[q.number] === q.correctLabel ? 1 : 0), 0),
    [variant.mcq, picks],
  );
  const mcqMax = variant.mcq.length;

  const openMax = useMemo(
    () => openSubItems.reduce((n, { subItem }) => n + subItem.maxPoints, 0),
    [openSubItems],
  );
  const subMcqScore = useMemo(
    () =>
      openSubItems.reduce(
        (n, { subItem }) =>
          isGeographyMcqSubItem(subItem) && subPicks[subItem.id] === subItem.correctLabel
            ? n + subItem.maxPoints
            : n,
        0,
      ),
    [openSubItems, subPicks],
  );
  const openAiScore = useMemo(
    () => Object.values(openResults).reduce((n, r) => n + r.report.score, 0),
    [openResults],
  );
  const openScore = subMcqScore + openAiScore;
  const answeredMcq = Object.keys(picks).length;

  const finishExam = useCallback(async () => {
    setStage("done");
    const toGrade = aiSubItems.filter(
      ({ subItem }) => openDrafts[subItem.id]?.trim() && !openResults[subItem.id],
    );
    if (toGrade.length === 0) return;
    setGradingOpen(true);
    recordToolUsage("abit-geography-open", "გეოგრაფიის ღია დავალების შემფასებელი");
    try {
      const outcomes = await Promise.all(
        toGrade.map(async ({ subItem, task }) => ({
          id: subItem.id,
          ...(await gradeGeographyOpenSubItem(subItem, task, openDrafts[subItem.id])),
        })),
      );
      setOpenResults((prev) => {
        const next = { ...prev };
        for (const o of outcomes) next[o.id] = { report: o.report, usedFallback: o.usedFallback };
        return next;
      });
    } finally {
      setGradingOpen(false);
    }
  }, [aiSubItems, openDrafts, openResults]);

  const restart = () => {
    setPicks({});
    setSubPicks({});
    setOpenDrafts({});
    setOpenResults({});
    setGradingOpen(false);
    setRemaining(variant.durationSeconds);
    setStage("mcq");
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> არქივზე დაბრუნება
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-emerald-300/60 bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200">
          <Clock className="h-3.5 w-3.5" /> {formatClock(remaining)}
        </span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        გეოგრაფია — {variant.label} · {variant.year}
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
        {mcqMax} ტესტური კითხვა · {variant.open.length} ღია დავალება · სულ {variant.totalPoints} ქულა
      </p>

      {stage === "mcq" && (
        <>
          <div className="mt-6 space-y-4">
            {variant.mcq.map((q) => (
              <McqCard
                key={q.id}
                q={q}
                picked={picks[q.number]}
                onPick={(label) => setPicks((p) => ({ ...p, [q.number]: label }))}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStage("open")}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 sm:w-auto"
          >
            ღია დავალებებზე გადასვლა
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-2 text-xs text-slate-400">
            მონიშნულია {answeredMcq}/{mcqMax}
          </p>
        </>
      )}

      {stage === "open" && (
        <>
          <div className="mt-6 space-y-6">
            {variant.open.map((task) => (
              <section key={task.id} className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#121214]">
                  <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-emerald-300/60 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200">
                    დავალება {task.number} · {task.points} ქულა
                  </span>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-600 dark:text-zinc-300">
                    {task.instruction}
                  </p>
                  <GeographyQuestionFigures figures={task.figures} />
                </div>
                {task.subItems.map((subItem) => (
                  <OpenSubItemInput
                    key={subItem.id}
                    subItem={subItem}
                    draft={openDrafts[subItem.id] ?? ""}
                    onDraftChange={(value) => setOpenDrafts((s) => ({ ...s, [subItem.id]: value }))}
                    pickedLabel={subPicks[subItem.id]}
                    onPickLabel={(label) => setSubPicks((s) => ({ ...s, [subItem.id]: label }))}
                  />
                ))}
              </section>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void finishExam()}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 sm:w-auto"
          >
            <Sparkles className="h-4 w-4" />
            გამოცდის დასრულება და შეფასება
            <ArrowRight className="h-4 w-4" />
          </button>
        </>
      )}

      {stage === "done" && (
        <GeographyResults
          variant={variant}
          picks={picks}
          subPicks={subPicks}
          openDrafts={openDrafts}
          openResults={openResults}
          gradingOpen={gradingOpen}
          mcqScore={mcqScore}
          mcqMax={mcqMax}
          openScore={openScore}
          openMax={openMax}
          onRestart={restart}
          onExit={onExit}
        />
      )}
    </main>
  );
}

/* ------------------------------ results ---------------------------------- */
function GeographyResults({
  variant,
  picks,
  subPicks,
  openDrafts,
  openResults,
  gradingOpen,
  mcqScore,
  mcqMax,
  openScore,
  openMax,
  onRestart,
  onExit,
}: {
  variant: GeographyExamVariant;
  picks: Record<number, GeographyOptionLabel>;
  subPicks: Record<string, GeographyOptionLabel>;
  openDrafts: Record<string, string>;
  openResults: Record<string, SubItemResult>;
  gradingOpen: boolean;
  mcqScore: number;
  mcqMax: number;
  openScore: number;
  openMax: number;
  onRestart: () => void;
  onExit: () => void;
}) {
  const [showMcqReview, setShowMcqReview] = useState(false);
  const grandScore = mcqScore + openScore;
  const answeredMcq = variant.mcq.filter((q) => picks[q.number]).length;

  const rowClass =
    "flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-white/10 dark:bg-[#121214]";

  return (
    <div className="mt-8">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
          <Trophy className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">გამოცდა დასრულდა</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          {variant.label} · {variant.year}
        </p>
        <p className="mt-6 text-5xl font-black text-emerald-600 dark:text-emerald-400">
          {grandScore}
          <span className="text-2xl text-slate-400">/{variant.totalPoints}</span>
        </p>
        <p className="mt-1 text-sm font-bold text-slate-500 dark:text-zinc-400">
          {Math.round((grandScore / variant.totalPoints) * 100)}%
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-lg">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          შენი ქულა შეფასების სქემით
        </p>
        <div className="space-y-2">
          <div className={rowClass}>
            <span className="text-slate-600 dark:text-zinc-300">ტესტური კითხვები (1–27)</span>
            <span className="font-bold tabular-nums text-slate-900 dark:text-white">
              {mcqScore} / {mcqMax}
            </span>
          </div>
          <div className={rowClass}>
            <span className="text-slate-600 dark:text-zinc-300">ღია დავალებები (28–37)</span>
            {gradingOpen ? (
              <span className="inline-flex items-center gap-1.5 font-bold text-slate-400">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                ფასდება…
              </span>
            ) : (
              <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                {openScore} / {openMax}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-emerald-300/70 bg-emerald-50 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <span className="text-sm font-bold text-slate-900 dark:text-white">ჯამური ქულა</span>
            <span className="text-lg font-black tabular-nums text-emerald-700 dark:text-emerald-300">
              {grandScore} / {variant.totalPoints}
            </span>
          </div>
        </div>
        {gradingOpen && (
          <p className="mt-3 inline-flex items-center gap-2 text-[12px] leading-relaxed text-slate-500 dark:text-zinc-400">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            მიმდინარეობს ღია დავალებების შეფასება — ჯამი განახლდება, როგორც კი დასრულდება.
          </p>
        )}
      </div>

      <div className="mx-auto mt-8 max-w-lg">
        <ReportToggle
          label="ტესტური კითხვები — შენი პასუხები და სწორი"
          hint={`${mcqScore}/${mcqMax}`}
          open={showMcqReview}
          onToggle={() => setShowMcqReview((v) => !v)}
        />
        <AnimatePresence initial={false}>
          {showMcqReview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="pt-3">
                <p className="mb-3 text-[12px] leading-relaxed text-slate-500 dark:text-zinc-400">
                  {answeredMcq}/{mcqMax} ნაპასუხები · სწორად {mcqScore}. ქვემოთ ყველა კითხვის სწორი
                  პასუხია მონიშნული, ახსნით.
                </p>
                <McqReview questions={variant.mcq} picks={picks} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {variant.open.map((task) => (
        <div key={task.id} className="mx-auto mt-8 max-w-lg">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            დავალება {task.number}
          </p>
          <div className="space-y-3">
            {task.subItems.map((subItem) =>
              isGeographyMcqSubItem(subItem) ? (
                <McqSubItemRow key={subItem.id} subItem={subItem} picked={subPicks[subItem.id]} />
              ) : (
                <OpenSubItemRow
                  key={subItem.id}
                  subItem={subItem}
                  answer={openDrafts[subItem.id] ?? ""}
                  result={openResults[subItem.id]?.report ?? null}
                  attempted={Boolean(openDrafts[subItem.id]?.trim())}
                  gradingOpen={gradingOpen}
                />
              ),
            )}
          </div>
        </div>
      ))}

      <div className="mt-8 flex justify-center gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
        >
          თავიდან
        </button>
        <button
          type="button"
          onClick={onExit}
          className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 dark:border-white/10 dark:text-zinc-200"
        >
          არქივში დაბრუნება
        </button>
      </div>
    </div>
  );
}

/* --------------------------- report toggle ------------------------------- */
function ReportToggle({
  label,
  hint,
  open,
  onToggle,
}: {
  label: string;
  hint?: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-left text-sm font-bold text-slate-900 transition hover:border-emerald-300 dark:border-white/10 dark:bg-[#121214] dark:text-white dark:hover:border-emerald-400/40"
    >
      <span className="min-w-0">{label}</span>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-slate-400">
        {hint && <span className="tabular-nums">{hint}</span>}
        {open ? "დამალვა" : "ნახვა"}
        <ChevronDown className={`h-4 w-4 stroke-[2.5] transition-transform ${open ? "rotate-180" : ""}`} />
      </span>
    </button>
  );
}

/* ---------------------- test-question review (results) ------------------- */
function McqReview({
  questions,
  picks,
}: {
  questions: GeographyMcqQuestion[];
  picks: Record<number, GeographyOptionLabel>;
}) {
  return (
    <div className="space-y-3">
      {questions.map((q) => {
        const pick = picks[q.number];
        const answered = pick != null;
        const correct = pick === q.correctLabel;
        const status = !answered ? "უპასუხოდ" : correct ? "სწორი" : "არასწორი";
        const statusClass = !answered
          ? "bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400"
          : correct
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
            : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300";
        return (
          <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#121214]">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                კითხვა {q.number}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusClass}`}>{status}</span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100">{q.prompt}</p>
            <GeographyQuestionFigures figures={q.figures} />
            <div className="mt-2 space-y-1.5">
              {q.options.map((opt) => {
                const isAnswer = opt.label === q.correctLabel;
                const isWrongPick = answered && opt.label === pick && !correct;
                const optClass = isAnswer
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-200"
                  : isWrongPick
                    ? "border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/10 dark:text-rose-200"
                    : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300";
                return (
                  <div
                    key={opt.label}
                    className={`flex items-start gap-2 rounded-xl border-2 px-3 py-2 text-[13.5px] leading-relaxed ${optClass}`}
                  >
                    <span className="shrink-0 font-bold">{opt.label})</span>
                    <span className="min-w-0 flex-1">{opt.text || "(იხ. სურათი)"}</span>
                    {isAnswer && <Check className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
                    {isWrongPick && <X className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-rose-500" />}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                რატომ არის ეს სწორი
              </p>
              <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">{q.explanation}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------- one MCQ open sub-item's result --------------------- */
function McqSubItemRow({
  subItem,
  picked,
}: {
  subItem: GeographyOpenSubItem;
  picked?: GeographyOptionLabel;
}) {
  const answered = picked != null;
  const correct = picked === subItem.correctLabel;
  const score = correct ? subItem.maxPoints : 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#121214]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-slate-900 dark:text-white">{subItem.id}</span>
        <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
          {score} / {subItem.maxPoints}
        </span>
      </div>
      <p className="text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100">{subItem.prompt}</p>
      <div className="mt-2 space-y-1.5">
        {subItem.options!.map((opt) => {
          const isAnswer = opt.label === subItem.correctLabel;
          const isWrongPick = answered && opt.label === picked && !correct;
          const optClass = isAnswer
            ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-200"
            : isWrongPick
              ? "border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/10 dark:text-rose-200"
              : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300";
          return (
            <div
              key={opt.label}
              className={`flex items-start gap-2 rounded-xl border-2 px-3 py-2 text-[13.5px] leading-relaxed ${optClass}`}
            >
              <span className="shrink-0 font-bold">{opt.label})</span>
              <span className="min-w-0 flex-1">{opt.text}</span>
              {isAnswer && <Check className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
              {isWrongPick && <X className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-rose-500" />}
            </div>
          );
        })}
      </div>
      {subItem.mcqExplanation && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">{subItem.mcqExplanation}</p>
        </div>
      )}
    </div>
  );
}

/* -------------------- one open sub-item's result row --------------------- */
function OpenSubItemRow({
  subItem,
  answer,
  result,
  attempted,
  gradingOpen,
}: {
  subItem: GeographyOpenSubItem;
  answer: string;
  result: GeographyOpenGraderReport | null;
  attempted: boolean;
  gradingOpen: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pending = !result && attempted && gradingOpen;
  const criteria = subItem.criteria ?? [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#121214]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-slate-900 dark:text-white">{subItem.id}</span>
        {pending ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-400">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ფასდება…
          </span>
        ) : result ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-2 text-sm font-bold tabular-nums text-slate-900 dark:text-white"
          >
            {result.score} / {subItem.maxPoints}
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
              {open ? "დამალვა" : "ნახვა"}
              <ChevronDown className={`h-4 w-4 stroke-[2.5] transition-transform ${open ? "rotate-180" : ""}`} />
            </span>
          </button>
        ) : (
          <span className="text-sm font-bold tabular-nums text-slate-400">— / {subItem.maxPoints}</span>
        )}
      </div>

      {!pending && !result && <p className="mt-2 text-[13px] text-slate-400">ცარიელი — შეუფასებელი.</p>}

      {result && open && (
        <div className="mt-3 space-y-3">
          <p className="text-[13px] font-semibold leading-relaxed text-slate-700 dark:text-zinc-200">{subItem.prompt}</p>

          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              რა დაწერე
            </p>
            <p className="whitespace-pre-line rounded-xl border border-slate-200 bg-slate-50 p-3 text-[13px] leading-relaxed text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300">
              {answer || "—"}
            </p>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              რა შეამოწმა AI-მ
            </p>
            <ul className="space-y-1.5">
              {result.criteria.map((c) => {
                const rubric = criteria.find((rc) => rc.id === c.id);
                return (
                  <li key={c.id} className="flex items-start gap-2 text-[13px]">
                    {c.met ? (
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    ) : (
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                    )}
                    <span className="text-slate-700 dark:text-zinc-300">
                      {rubric?.description ?? c.id}
                      {c.comment ? ` — ${c.comment}` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {(result.correctAnswer || subItem.modelAnswer) && (
            <p className="text-[13px] text-emerald-700 dark:text-emerald-300">
              სწორი პასუხი: {result.correctAnswer || subItem.modelAnswer}
            </p>
          )}
          {result.explanation && (
            <p className="text-[13px] leading-relaxed text-slate-600 dark:text-zinc-300">
              რატომ არის სწორი: {result.explanation}
            </p>
          )}
          {result.whatWasMissing && (
            <p className="text-[13px] text-rose-700 dark:text-rose-300">რა გამოგრჩა: {result.whatWasMissing}</p>
          )}
          {result.summary && (
            <p className="text-[12px] italic leading-relaxed text-slate-400 dark:text-zinc-500">{result.summary}</p>
          )}
        </div>
      )}
    </div>
  );
}
