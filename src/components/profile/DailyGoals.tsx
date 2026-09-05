"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import {
  AlertTriangle,
  BookOpen,
  Check,
  LayoutDashboard,
  ListChecks,
  MessageCircle,
  PartyPopper,
  Plus,
  Sparkles,
  Target,
  Trash2,
  type LucideIcon,
} from "lucide-react";
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

const TYPE_STYLE: Record<DailyGoal["type"], { bg: string; text: string; pill: string }> = {
  quiz: { bg: "#efe9fe", text: "#5b21b6", pill: "#c4b5fd" },
  study: { bg: "#dbeafe", text: "#1e3a8a", pill: "#93c5fd" },
  read: { bg: "#fef3c7", text: "#92400e", pill: "#fcd34d" },
  chat: { bg: "#d1fae5", text: "#065f46", pill: "#6ee7b7" },
};

export function DailyGoals({
  title = "თქვენი გეგმა",
  showDashboardToggle = false,
}: DailyGoalsProps) {
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [newGoal, setNewGoal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [onDashboard, setOnDashboard] = useState(false);

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

  const toggleGoal = (goalId: string) => {
    commit(
      goals.map((goal) => (goal.id === goalId ? { ...goal, done: !goal.done } : goal)),
    );
  };

  const addGoal = () => {
    const text = newGoal.trim();
    if (!text) return;
    commit([...goals, { id: crypto.randomUUID(), text, done: false, type: "study" }]);
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
    const celebrate = () => {
      setShowConfetti(true);
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
    };
    celebrate();
    const timer = setTimeout(() => setShowConfetti(false), 2500);
    return () => clearTimeout(timer);
  }, [allDone]);

  return (
    <section className="relative">
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <PartyPopper className="h-10 w-10 text-violet-500" strokeWidth={2} />
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="headline text-lg font-bold text-[var(--text-primary)]">{title}</h3>
        <div className="flex items-center gap-2">
          {showDashboardToggle && goals.length > 0 && (
            <button
              type="button"
              onClick={toggleDashboard}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                onDashboard
                  ? "border-transparent bg-[var(--accent-primary)] text-white"
                  : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
              }`}
            >
              {onDashboard ? (
                <>
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  დეშბორდზეა
                </>
              ) : (
                <>
                  <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={2.25} />
                  გადაიტანე დეშბორდზე
                </>
              )}
            </button>
          )}
          {goals.length > 0 && (
            <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
              {doneCount} / {goals.length} შესრულებული
            </span>
          )}
        </div>
      </div>

      {goals.length > 0 && (
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(doneCount / goals.length) * 100}%`,
              background: "var(--accent-primary)",
            }}
          />
        </div>
      )}

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl border border-rose-300/60 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          {error}
          <button className="ml-2 underline" onClick={generateAiGoals}>
            კვლავ სცადე
          </button>
        </div>
      )}

      {hydrated && goals.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-6 text-center">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            ჯერ მიზნები არ დაგისახავს
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[var(--text-muted)]">
            დაამატე პირველი მიზანი ქვემოთ, ან დააგენერირე AI-ით შენს სემესტრის საგნებზე დაყრდნობით.
          </p>
          <button
            type="button"
            onClick={generateAiGoals}
            disabled={loading}
            className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4 stroke-[1.75]" />
            {loading ? "გენერირდება..." : "AI მიზნების გენერაცია"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {goals.map((goal) => {
            const Icon = TYPE_ICON[goal.type];
            const style = TYPE_STYLE[goal.type];
            return (
              <div
                key={goal.id}
                className="relative overflow-hidden rounded-[24px] p-4 transition-all"
                style={{
                  background: goal.done ? "var(--bg-card)" : style.bg,
                  border: goal.done ? "1px solid var(--border)" : "1px solid transparent",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                    style={{
                      background: goal.done ? "var(--bg-secondary)" : style.pill,
                      color: goal.done ? "var(--text-muted)" : style.text,
                    }}
                  >
                    <Icon className="h-3 w-3" strokeWidth={2.25} />
                    {TYPE_LABEL[goal.type]}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleGoal(goal.id)}
                    aria-label={goal.done ? "მონიშვნის გაუქმება" : "დასრულებულად მონიშვნა"}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all"
                    style={{
                      background: goal.done ? "#1c1917" : "rgb(255 255 255 / 0.7)",
                      color: goal.done ? "#ffffff" : style.text,
                    }}
                  >
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>

                <p
                  className={`mt-3 text-sm font-bold leading-snug ${
                    goal.done ? "text-[var(--text-muted)] line-through" : ""
                  }`}
                  style={goal.done ? undefined : { color: style.text }}
                >
                  {goal.text}
                </p>

                <button
                  type="button"
                  onClick={() => deleteGoal(goal.id)}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-rose-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  წაშლა
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={newGoal}
          onChange={(e) => setNewGoal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addGoal();
          }}
          placeholder="ახალი მიზანი..."
          className="h-11 flex-1 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-violet-400"
        />
        <button
          type="button"
          onClick={addGoal}
          className="inline-flex h-11 items-center justify-center gap-1 rounded-full bg-[var(--accent-green)] px-4 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 stroke-[1.75]" />
          დამატება
        </button>
      </div>
    </section>
  );
}
