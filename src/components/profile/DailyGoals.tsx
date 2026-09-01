"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import {
  BookOpen,
  Check,
  ListChecks,
  MessageCircle,
  Plus,
  Sparkles,
  Target,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { generateDailyGoals } from "@/lib/goals";
import type { DailyGoal } from "@/lib/profile";

interface DailyGoalsProps {
  initialGoals: DailyGoal[];
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

export function DailyGoals({ initialGoals }: DailyGoalsProps) {
  const [goals, setGoals] = useState(initialGoals);
  const [newGoal, setNewGoal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const doneCount = goals.filter((goal) => goal.done).length;
  const allDone = goals.length > 0 && doneCount === goals.length;

  const toggleGoal = (goalId: string) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId ? { ...goal, done: !goal.done } : goal,
      ),
    );
  };

  const addGoal = () => {
    const text = newGoal.trim();
    if (!text) return;
    setGoals((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, done: false, type: "study" },
    ]);
    setNewGoal("");
  };

  const deleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
  };

  const generateAiGoals = async () => {
    setLoading(true);
    setError(null);
    try {
      const aiGoals = await generateDailyGoals({
        studyPlan: "ბიოლოგია + ქიმიის გამეორება",
        weakSubjects: "ქიმია, ისტორია",
      });
      setGoals(aiGoals);
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
    const timer = setTimeout(() => setShowConfetti(false), 2500);
    return () => clearTimeout(timer);
  }, [allDone]);

  return (
    <section className="relative">
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-lg">
          🎉
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h3 className="headline text-lg font-bold text-[var(--text-primary)]">თქვენი გეგმა</h3>
        <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
          {doneCount} / {goals.length} შესრულებული
        </span>
      </div>

      {goals.length > 0 && (
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(doneCount / goals.length) * 100}%`,
              background: "linear-gradient(90deg, #8b5cf6, #22d3ee)",
            }}
          />
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={generateAiGoals}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-violet-500 hover:to-cyan-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4 stroke-[1.75]" />
          {loading ? "გენერირდება..." : "AI მიზნების გენერაცია"}
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-2xl border border-rose-300/60 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          ⚠️ {error}
          <button className="ml-2 underline" onClick={generateAiGoals}>
            კვლავ სცადე
          </button>
        </div>
      )}

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

      <div className="mt-4 flex gap-2">
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
          className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-4 text-sm font-semibold text-white shadow-md transition-all hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 stroke-[1.75]" />
          დამატება
        </button>
      </div>
    </section>
  );
}
