"use client";

import { useEffect, useState } from "react";
import { BookOpen, CalendarClock, ListChecks, PartyPopper, Sparkles } from "lucide-react";

const STAGES = [
  { icon: CalendarClock, text: "ვითვლი დარჩენილ დღეებს..." },
  { icon: BookOpen, text: "ვაანალიზებ საგანსა და თემებს..." },
  { icon: ListChecks, text: "ვანაწილებ დავალებებს დღეების მიხედვით..." },
  { icon: Sparkles, text: "ვამატებ პერსონალურ რჩევებს..." },
  { icon: PartyPopper, text: "თითქმის მზადაა..." },
];

const STAGE_DURATION_MS = 1700;

/**
 * The same playful "AI is thinking" pattern as the research platform's
 * loader (reuses its CSS keyframes), reworked with study-plan-flavored
 * stages so the wait for a generated calendar isn't just a blank skeleton.
 */
export function StudyPlanThinkingLoader() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % STAGES.length);
    }, STAGE_DURATION_MS);
    return () => clearInterval(timer);
  }, []);

  const stage = STAGES[stageIndex];
  const StageIcon = stage.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="AI ქმნის შენს გეგმას"
      className="flex min-h-[420px] flex-col items-center justify-center gap-5 text-center"
    >
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-violet-400/15 dark:bg-purple-500/15" />
        <span className="absolute inset-0 rounded-full border border-violet-200 dark:border-purple-500/20" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 shadow-[0_0_24px_rgba(139,92,246,0.35)]">
          <StageIcon
            key={stageIndex}
            className="research-thinking-icon h-6 w-6 text-white"
            strokeWidth={1.75}
          />
        </span>
      </div>

      <p
        key={stageIndex}
        className="research-thinking-caption text-sm font-medium text-slate-700 dark:text-zinc-300"
      >
        {stage.text}
      </p>

      <div className="flex items-center gap-1.5" aria-hidden>
        {STAGES.map((item, index) => (
          <span
            key={item.text}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              index === stageIndex
                ? "w-5 bg-violet-500 dark:bg-purple-400"
                : "w-1.5 bg-slate-200 dark:bg-white/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
