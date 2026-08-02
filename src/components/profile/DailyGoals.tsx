"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import {
  BookOpen,
  ListChecks,
  MessageCircle,
  Sparkles,
  Target,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { generateDailyGoals } from "@/lib/goals";
import type { DailyGoal } from "@/lib/profile";
import { Button } from "@/components/ui/Button";

interface DailyGoalsProps {
  initialGoals: DailyGoal[];
}

const TYPE_ICON: Record<DailyGoal["type"], LucideIcon> = {
  quiz: ListChecks,
  study: Target,
  read: BookOpen,
  chat: MessageCircle,
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
      colors: ["#7c3aed", "#06b6d4", "#10b981", "#f59e0b"],
      disableForReducedMotion: true,
    });
    const timer = setTimeout(() => setShowConfetti(false), 2500);
    return () => clearTimeout(timer);
  }, [allDone]);

  return (
    <section className="card relative overflow-hidden">
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg">
          🎉
        </div>
      )}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="headline text-lg font-semibold">დღის მიზნები</h3>
        <span className="mono text-xs text-[var(--text-secondary)]">
          {doneCount} / {goals.length} შესრულებული
        </span>
      </div>

      {goals.length > 0 && (
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(doneCount / goals.length) * 100}%`,
              background: "linear-gradient(90deg, var(--accent-purple), var(--accent-cyan))",
            }}
          />
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        <Button onClick={generateAiGoals} disabled={loading}>
          <Sparkles className="mr-1.5 h-4 w-4" />
          {loading ? "გენერირდება..." : "AI მიზნების გენერაცია"}
        </Button>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          ⚠️ {error}
          <button className="ml-2 underline" onClick={generateAiGoals}>
            კვლავ სცადე
          </button>
        </div>
      )}

      <div className="space-y-2">
        {goals.map((goal) => {
          const Icon = TYPE_ICON[goal.type];
          return (
            <div
              key={goal.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 transition-colors hover:border-[var(--border-hover)]"
            >
              <label className="flex min-w-0 items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={goal.done}
                  onChange={() => toggleGoal(goal.id)}
                  className="h-4 w-4 shrink-0 accent-[var(--accent-purple)]"
                />
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 ${
                    goal.done ? "text-[var(--text-muted)]" : "text-[var(--accent-cyan)]"
                  }`}
                />
                <span
                  className={`text-sm ${goal.done ? "line-through text-[var(--text-muted)]" : ""}`}
                >
                  {goal.text}
                </span>
              </label>
              <button
                type="button"
                onClick={() => deleteGoal(goal.id)}
                className="shrink-0 text-[var(--text-secondary)] hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={newGoal}
          onChange={(e) => setNewGoal(e.target.value)}
          placeholder="ახალი მიზანი..."
          className="h-10 flex-1 rounded-xl border border-[var(--border-hover)] bg-[var(--bg-secondary)] px-3 text-sm outline-none focus:border-[var(--accent-purple)]"
        />
        <Button onClick={addGoal}>დამატება</Button>
      </div>
    </section>
  );
}
