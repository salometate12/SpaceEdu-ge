"use client";

import { useEffect, useId, useState } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  Check,
  ListChecks,
  ListTodo,
  MessageCircle,
  Pin,
  Plus,
  Sparkles,
  Target,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { generateDailyGoals } from "@/lib/goals";
import { DASHBOARD_GOALS_STORAGE_KEY, type DailyGoal } from "@/lib/profile";
import {
  DAILY_GOALS_UPDATED_EVENT,
  loadDailyGoals,
  saveDailyGoals,
} from "@/lib/daily-goals";
import { readSemesterSubjects } from "@/lib/semester-subjects";

interface DailyGoalsProps {
  title?: string;
  showDashboardToggle?: boolean;
}

const TYPE_ICON: Record<DailyGoal["type"], LucideIcon> = {
  quiz: ListChecks,
  study: Target,
  read: BookOpen,
  chat: MessageCircle,
};

const TYPE_LABEL: Record<DailyGoal["type"], string> = {
  quiz: "ქვიზი",
  study: "სწავლა",
  read: "კითხვა",
  chat: "ჩატი",
};

/** The order the category picker offers them in. */
const TYPES: DailyGoal["type"][] = ["study", "read", "quiz", "chat"];

const MAX_GOAL_LENGTH = 120;
/** The character counter appears once this few characters are left. */
const COUNTER_FROM = 20;

/** One tap turns a suggestion into a goal — for an empty day. */
const SUGGESTIONS: { text: string; type: DailyGoal["type"] }[] = [
  { text: "15 წთ ქვიზი", type: "quiz" },
  { text: "1 ლექციის კონსპექტი", type: "read" },
  { text: "AI-სთან 1 კითხვა", type: "chat" },
];

/**
 * The day's goals as a checklist, in one card. Used on the student
 * dashboard and on both profile overviews — the card, its header and the
 * progress bar are all here, so the pages only place it.
 */
export function DailyGoals({
  title = "დღის მიზნები",
  showDashboardToggle = false,
}: DailyGoalsProps) {
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [newGoal, setNewGoal] = useState("");
  const [newType, setNewType] = useState<DailyGoal["type"]>("study");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [onDashboard, setOnDashboard] = useState(false);
  const reduceMotion = useReducedMotion();
  const inputId = useId();

  useEffect(() => {
    const sync = () => setGoals(loadDailyGoals());
    const init = () => {
      sync();
      setHydrated(true);
      if (showDashboardToggle) {
        setOnDashboard(window.localStorage.getItem(DASHBOARD_GOALS_STORAGE_KEY) === "1");
      }
    };
    init();
    window.addEventListener(DAILY_GOALS_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DAILY_GOALS_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [showDashboardToggle]);

  const commit = (next: DailyGoal[]) => {
    setGoals(next);
    saveDailyGoals(next);
  };

  const toggleDashboard = () => {
    const next = !onDashboard;
    setOnDashboard(next);
    window.localStorage.setItem(DASHBOARD_GOALS_STORAGE_KEY, next ? "1" : "0");
  };

  const doneCount = goals.filter((goal) => goal.done).length;
  const allDone = goals.length > 0 && doneCount === goals.length;
  // Done goals sink to the bottom; each group keeps the order it was added in.
  const ordered = [...goals.filter((goal) => !goal.done), ...goals.filter((goal) => goal.done)];

  const toggleGoal = (goalId: string) => {
    commit(
      goals.map((goal) => (goal.id === goalId ? { ...goal, done: !goal.done } : goal)),
    );
  };

  const addGoalWith = (raw: string, type: DailyGoal["type"]) => {
    const text = raw.trim().slice(0, MAX_GOAL_LENGTH);
    if (!text) return;
    commit([...goals, { id: crypto.randomUUID(), text, done: false, type }]);
  };

  const addGoal = () => {
    if (!newGoal.trim()) return;
    addGoalWith(newGoal, newType);
    setNewGoal("");
  };

  const deleteGoal = (goalId: string) => {
    commit(goals.filter((goal) => goal.id !== goalId));
  };

  const generateAiGoals = async () => {
    setLoading(true);
    setError(null);
    try {
      const subjectNames = readSemesterSubjects()
        .subjects.map((s) => s.name)
        .slice(0, 4);
      const aiGoals = await generateDailyGoals({
        studyPlan:
          subjectNames.length > 0
            ? `სემესტრის საგნები: ${subjectNames.join(", ")}`
            : "ზოგადი მომზადება",
        weakSubjects: subjectNames.join(", "),
      });
      commit(aiGoals);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "AI ამჟამად მიუწვდომელია. სცადე კიდევ ერთხელ.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!allDone) return;
    confetti({
      particleCount: 60,
      spread: 65,
      startVelocity: 30,
      gravity: 1,
      scalar: 0.85,
      origin: { x: 0.5, y: 0.4 },
      colors: ["#A78BFA", "#22D3EE", "#10B981", "#F59E0B"],
      disableForReducedMotion: true,
    });
  }, [allDone]);

  const remaining = MAX_GOAL_LENGTH - newGoal.length;
  const hasText = newGoal.trim().length > 0;
  const progressPct = goals.length > 0 ? (doneCount / goals.length) * 100 : 0;

  return (
    <DashboardCard
      icon={ListTodo}
      title={title}
      meta={goals.length > 0 ? `${doneCount}/${goals.length}` : undefined}
      action={
        showDashboardToggle && goals.length > 0 ? (
          <button
            type="button"
            onClick={toggleDashboard}
            aria-pressed={onDashboard}
            aria-label="დეშბორდზე ჩვენება"
            title={onDashboard ? "ჩანს დეშბორდზე — დააჭირე მოსახსნელად" : "დეშბორდზე ჩვენება"}
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50 ${
              onDashboard
                ? "border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Pin className={`h-4 w-4 ${onDashboard ? "fill-current" : ""}`} strokeWidth={1.75} aria-hidden />
          </button>
        ) : undefined
      }
    >
      {goals.length > 0 && (
        <div
          className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--bg-secondary)]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={goals.length}
          aria-valuenow={doneCount}
          aria-label="შესრულებული მიზნები"
        >
          <div
            className="h-full rounded-full bg-[var(--accent-primary)] transition-[width] duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      <form
        className="group/field mt-4 flex h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] pl-3 pr-1.5 transition-[border-color,box-shadow] focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20"
        onSubmit={(e) => {
          e.preventDefault();
          addGoal();
        }}
      >
        <Plus className="h-4 w-4 shrink-0 text-[var(--text-muted)]" strokeWidth={2} aria-hidden />
        <label htmlFor={inputId} className="sr-only">
          ახალი მიზანი
        </label>
        <input
          id={inputId}
          value={newGoal}
          maxLength={MAX_GOAL_LENGTH}
          onChange={(e) => setNewGoal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setNewGoal("");
          }}
          placeholder="დაამატე მიზანი… მაგ. 20 წუთი ქვიზი ისტორიაში"
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
        />
        {remaining <= COUNTER_FROM && (
          <span
            className={`shrink-0 text-xs tabular-nums ${remaining <= 5 ? "text-rose-600 dark:text-rose-300" : "text-[var(--text-muted)]"}`}
            aria-live="polite"
          >
            {remaining}
          </span>
        )}
        <div
          role="radiogroup"
          aria-label="კატეგორია"
          className={`shrink-0 items-center gap-0.5 ${hasText ? "flex" : "hidden sm:flex"}`}
        >
          {TYPES.map((type) => {
            const Icon = TYPE_ICON[type];
            const selected = newType === type;
            return (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={TYPE_LABEL[type]}
                title={TYPE_LABEL[type]}
                onClick={() => setNewType(type)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50 ${
                  selected
                    ? "bg-[var(--bg-card)] text-[var(--accent-primary)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              </button>
            );
          })}
        </div>
        {hasText && (
          <button
            type="submit"
            aria-label="დამატება"
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[var(--accent-primary)] px-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 sm:px-3"
          >
            <Plus className="h-3.5 w-3.5 sm:hidden" strokeWidth={2.5} aria-hidden />
            <span className="hidden sm:inline">დამატება</span>
          </button>
        )}
      </form>

      {error && (
        <div
          className="mt-3 flex flex-wrap items-center gap-2 text-sm text-rose-700 dark:text-rose-300"
          role="alert"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          {error}
          <button className="font-medium underline" onClick={generateAiGoals}>
            კვლავ სცადე
          </button>
        </div>
      )}

      {hydrated && goals.length === 0 ? (
        <div className="mt-4">
          <p className="text-sm text-[var(--text-secondary)]">დღეს ჯერ მიზანი არ გაქვს</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {SUGGESTIONS.map(({ text, type }) => {
              const Icon = TYPE_ICON[type];
              return (
                <button
                  key={text}
                  type="button"
                  onClick={() => addGoalWith(text, type)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--border)] px-3 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-primary)]/50 hover:text-[var(--accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50"
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  {text}
                </button>
              );
            })}
            <button
              type="button"
              onClick={generateAiGoals}
              disabled={loading}
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              {loading ? "გენერირდება..." : "AI-ით შედგენა"}
            </button>
          </div>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-[var(--border)]">
          <AnimatePresence initial={false}>
            {ordered.map((goal) => {
              const Icon = TYPE_ICON[goal.type];
              return (
                <motion.li
                  key={goal.id}
                  layout={reduceMotion ? false : "position"}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="group flex min-h-12 items-center gap-3 py-2"
                >
                  <button
                    type="button"
                    onClick={() => toggleGoal(goal.id)}
                    role="checkbox"
                    aria-checked={goal.done}
                    aria-label={goal.text}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] ${
                      goal.done
                        ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                        : "border-[var(--border-hover)] text-transparent hover:border-[var(--accent-primary)]"
                    }`}
                  >
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                  </button>
                  <span
                    className={`min-w-0 flex-1 text-sm leading-normal line-clamp-2 ${
                      goal.done
                        ? "text-[var(--text-muted)] line-through"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {goal.text}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
                    <Icon className="h-3 w-3" strokeWidth={2} aria-hidden />
                    <span className="max-[400px]:sr-only">{TYPE_LABEL[goal.type]}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteGoal(goal.id)}
                    aria-label={`წაშალე: ${goal.text}`}
                    title="წაშლა"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-rose-500/10 hover:text-rose-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {allDone && (
        <p className="mt-2 text-sm font-medium text-[var(--text-secondary)]">ყველა მიზანი შესრულდა 🎉</p>
      )}
    </DashboardCard>
  );
}
