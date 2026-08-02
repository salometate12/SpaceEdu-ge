"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import {
  BookOpen,
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
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#13131A]/60 p-6 backdrop-blur-xl transition-colors hover:border-white/[0.15]">
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg">
          🎉
        </div>
      )}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="headline text-lg font-semibold text-white">დღის მიზნები</h3>
        <span className="mono text-xs text-zinc-500">
          {doneCount} / {goals.length} შესრულებული
        </span>
      </div>

      {goals.length > 0 && (
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(doneCount / goals.length) * 100}%`,
              background: "linear-gradient(90deg, #A78BFA, #22D3EE)",
            }}
          />
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={generateAiGoals}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/10 transition-all hover:from-violet-500 hover:to-cyan-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4 stroke-[1.75]" />
          {loading ? "გენერირდება..." : "AI მიზნების გენერაცია"}
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-rose-500/25 bg-rose-500/[0.06] px-3 py-2 text-sm text-rose-200">
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
              className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-colors hover:border-white/[0.12]"
            >
              <label className="flex min-w-0 items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={goal.done}
                  onChange={() => toggleGoal(goal.id)}
                  className="h-4 w-4 shrink-0 accent-cyan-500"
                />
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 ${
                    goal.done ? "text-zinc-600" : "text-cyan-300"
                  }`}
                />
                <span
                  className={`text-sm ${goal.done ? "text-zinc-600 line-through" : "text-zinc-200"}`}
                >
                  {goal.text}
                </span>
              </label>
              <button
                type="button"
                onClick={() => deleteGoal(goal.id)}
                className="shrink-0 text-zinc-500 hover:text-white"
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
          onKeyDown={(e) => {
            if (e.key === "Enter") addGoal();
          }}
          placeholder="ახალი მიზანი..."
          className="h-10 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-cyan-500/50"
        />
        <button
          type="button"
          onClick={addGoal}
          className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/10 transition-all hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 stroke-[1.75]" />
          დამატება
        </button>
      </div>
    </section>
  );
}
