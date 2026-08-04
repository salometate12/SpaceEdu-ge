"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Brain, FileSearch, Lightbulb, ListChecks, PartyPopper } from "lucide-react";

interface QuizStage {
  icon: typeof Brain;
  text: (count: number) => string;
  badge: string;
  glow: string;
  dot: string;
  sparkle: string;
}

const STAGES: QuizStage[] = [
  {
    icon: FileSearch,
    text: () => "ვკითხულობ ატვირთულ მასალას...",
    badge: "bg-gradient-to-br from-violet-500 to-indigo-500",
    glow: "shadow-[0_0_28px_rgba(139,92,246,0.4)]",
    dot: "bg-violet-500 dark:bg-purple-400",
    sparkle: "bg-violet-400",
  },
  {
    icon: Lightbulb,
    text: () => "ვპოულობ საკვანძო ცნებებს...",
    badge: "bg-gradient-to-br from-amber-500 to-orange-500",
    glow: "shadow-[0_0_28px_rgba(245,158,11,0.4)]",
    dot: "bg-amber-500 dark:bg-amber-400",
    sparkle: "bg-amber-400",
  },
  {
    icon: Brain,
    text: (count) => `ვქმნი ${count} კონცეპტუალურ კითხვას...`,
    badge: "bg-gradient-to-br from-cyan-500 to-sky-500",
    glow: "shadow-[0_0_28px_rgba(34,211,238,0.4)]",
    dot: "bg-cyan-500 dark:bg-cyan-400",
    sparkle: "bg-cyan-400",
  },
  {
    icon: ListChecks,
    text: () => "ვალაგებ პასუხის ვარიანტებს...",
    badge: "bg-gradient-to-br from-emerald-500 to-teal-500",
    glow: "shadow-[0_0_28px_rgba(16,185,129,0.4)]",
    dot: "bg-emerald-500 dark:bg-emerald-400",
    sparkle: "bg-emerald-400",
  },
  {
    icon: PartyPopper,
    text: () => "თითქმის მზადაა შენი ქვიზი!",
    badge: "bg-gradient-to-br from-rose-500 to-pink-500",
    glow: "shadow-[0_0_28px_rgba(244,63,94,0.4)]",
    dot: "bg-rose-500 dark:bg-rose-400",
    sparkle: "bg-rose-400",
  },
];

const STAGE_DURATION_MS = 1600;

const SPARKLES = [
  { top: "6%", left: "12%", size: "h-2 w-2", duration: "3.2s", delay: "0s" },
  { top: "14%", right: "10%", size: "h-1.5 w-1.5", duration: "2.6s", delay: "0.4s" },
  { bottom: "10%", left: "16%", size: "h-1.5 w-1.5", duration: "3.6s", delay: "0.8s" },
  { bottom: "16%", right: "14%", size: "h-2 w-2", duration: "2.8s", delay: "0.2s" },
];

interface QuizThinkingLoaderProps {
  questionCount: number;
  hint?: string;
}

/**
 * Playful, colorful "AI is building your quiz" state — a rotating badge
 * that changes hue per stage, twinkling sparkles, and a caption that
 * mentions the actual requested question count, instead of a flat skeleton.
 */
export function QuizThinkingLoader({ questionCount, hint }: QuizThinkingLoaderProps) {
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
      aria-label="AI ქმნის შენს ქვიზს"
      className="flex min-h-[360px] flex-col items-center justify-center gap-5 text-center"
    >
      {hint && (
        <p className="text-xs font-medium text-violet-600 dark:text-purple-300/90">{hint}</p>
      )}

      <div className="relative flex h-24 w-24 items-center justify-center">
        {SPARKLES.map((sparkle, index) => (
          <span
            key={index}
            aria-hidden
            className={`animate-star-twinkle absolute rounded-full ${sparkle.size} ${
              STAGES[(stageIndex + index) % STAGES.length].sparkle
            }`}
            style={
              {
                top: sparkle.top,
                left: sparkle.left,
                right: sparkle.right,
                bottom: sparkle.bottom,
                "--star-duration": sparkle.duration,
                "--star-delay": sparkle.delay,
              } as CSSProperties
            }
          />
        ))}

        <span className="absolute inset-0 animate-ping rounded-full bg-violet-400/10 dark:bg-purple-500/10" />
        <span className="absolute inset-2 rounded-full border border-slate-200 dark:border-white/[0.08]" />
        <span
          className={`relative flex h-16 w-16 items-center justify-center rounded-full transition-all duration-500 ${stage.badge} ${stage.glow}`}
        >
          <StageIcon
            key={stageIndex}
            className="research-thinking-icon h-7 w-7 text-white"
            strokeWidth={1.75}
          />
        </span>
      </div>

      <p
        key={stageIndex}
        className="research-thinking-caption text-sm font-medium text-slate-700 dark:text-zinc-300"
      >
        {stage.text(questionCount)}
      </p>

      <div className="flex items-center gap-1.5" aria-hidden>
        {STAGES.map((item, index) => (
          <span
            key={index}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              index === stageIndex ? `w-5 ${item.dot}` : "w-1.5 bg-slate-200 dark:bg-white/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
