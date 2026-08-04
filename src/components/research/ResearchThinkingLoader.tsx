"use client";

import { useEffect, useState } from "react";
import { BookOpen, Brain, Puzzle, Telescope, Wand2 } from "lucide-react";

const STAGES = [
  { icon: BookOpen, text: "ვკითხულობ მასალას..." },
  { icon: Telescope, text: "ვეძებ საკვანძო დეტალებს..." },
  { icon: Brain, text: "ვაანალიზებ კავშირებს..." },
  { icon: Puzzle, text: "ვალაგებ სურათს ერთად..." },
  { icon: Wand2, text: "ვასრულებ პასუხს..." },
];

const STAGE_DURATION_MS = 1700;

interface ResearchThinkingLoaderProps {
  /** Optional extra line shown above the fun stages (e.g. "PDF-ის დამუშავება..."). */
  hint?: string;
}

/**
 * A playful "AI is thinking" moment for the (sometimes slow) document/photo/
 * audio analysis wait — a rotating icon + cycling captions + a step dots
 * row, instead of a plain static skeleton.
 */
export function ResearchThinkingLoader({ hint }: ResearchThinkingLoaderProps) {
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
      aria-label="AI ამუშავებს მასალას"
      className="flex min-h-[360px] flex-col items-center justify-center gap-5 text-center"
    >
      {hint && (
        <p className="text-xs font-medium text-violet-600 dark:text-purple-300/90">{hint}</p>
      )}

      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-violet-400/15 dark:bg-purple-500/15" />
        <span className="absolute inset-0 rounded-full border border-violet-200 dark:border-purple-500/20" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 shadow-[0_0_24px_rgba(139,92,246,0.35)]">
          <StageIcon key={stageIndex} className="research-thinking-icon h-6 w-6 text-white" strokeWidth={1.75} />
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
