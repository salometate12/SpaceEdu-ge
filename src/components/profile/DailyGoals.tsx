"use client";

import { useMemo, useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { generateDailyGoals } from "@/lib/goals";
import type { DailyGoal } from "@/lib/profile";
import { Button } from "@/components/ui/Button";

interface DailyGoalsProps {
  initialGoals: DailyGoal[];
}

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

  useMemo(() => {
    if (allDone) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [allDone]);

  return (
    <section className="card relative">
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg">
          🎉 🎊 ✨
        </div>
      )}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="headline text-lg font-semibold">დღის მიზნები</h3>
        <span className="mono text-xs text-[var(--text-secondary)]">
          {doneCount} / {goals.length} შესრულებული
        </span>
      </div>

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
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2"
          >
            <label className="flex min-w-0 items-center gap-2">
              <input
                type="checkbox"
                checked={goal.done}
                onChange={() => toggleGoal(goal.id)}
                className="accent-[var(--accent-purple)]"
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
              className="text-[var(--text-secondary)] hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
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
