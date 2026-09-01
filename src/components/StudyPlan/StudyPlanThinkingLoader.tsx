"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { BookOpen, CalendarClock, Check, ListChecks, PartyPopper, Sparkles } from "lucide-react";

const STAGES = [
  { icon: CalendarClock, text: "ვითვლი დარჩენილ დღეებს...", xp: 20 },
  { icon: BookOpen, text: "ვაანალიზებ საგანსა და თემებს...", xp: 20 },
  { icon: ListChecks, text: "ვანაწილებ დავალებებს დღეების მიხედვით...", xp: 20 },
  { icon: Sparkles, text: "ვამატებ პერსონალურ რჩევებს...", xp: 20 },
  { icon: PartyPopper, text: "თითქმის მზადაა...", xp: 20 },
];

const STAGE_DURATION_MS = 1700;

/**
 * A playful, gamified "AI is building your quest" loader shown while the
 * study-plan generator waits on the AI response — a stage icon + caption,
 * an XP progress bar with a floating "+XP" pop each time a stage
 * completes, a couple of drifting sparkle stars around the badge, and a
 * quest checklist so the wait reads as visible progress instead of a
 * blank skeleton.
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
  const progressPct = Math.round(((stageIndex + 1) / STAGES.length) * 100);
  const totalXp = STAGES.slice(0, stageIndex + 1).reduce((sum, s) => sum + s.xp, 0);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="AI ქმნის შენს გეგმას"
      className="flex min-h-[420px] flex-col items-center justify-center gap-6 text-center"
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span
          className="animate-star-twinkle absolute -left-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-400"
          style={{ "--star-delay": "0.2s", "--star-duration": "2.4s" } as CSSProperties}
        />
        <span
          className="animate-star-drift absolute -right-1 top-3 h-1.5 w-1.5 rounded-full bg-cyan-400"
          style={{ "--star-delay": "0.8s", "--star-duration": "3.2s" } as CSSProperties}
        />
        <span
          className="animate-star-twinkle absolute bottom-0 right-3 h-1 w-1 rounded-full bg-violet-300"
          style={{ "--star-delay": "1.3s", "--star-duration": "2.8s" } as CSSProperties}
        />

        <span className="absolute inset-0 animate-ping rounded-full bg-violet-400/15 dark:bg-violet-500/15" />
        <span className="absolute inset-0 rounded-full border border-violet-200 dark:border-violet-500/20" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-violet-600 dark:bg-violet-500 dark:shadow-[0_0_24px_rgba(139,92,246,0.35)]">
          <StageIcon
            key={stageIndex}
            className="research-thinking-icon h-7 w-7 text-white"
            strokeWidth={1.75}
          />
        </span>

        <span
          key={`xp-${stageIndex}`}
          className="study-plan-xp-pop pointer-events-none absolute -top-2 right-0 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950 shadow-sm"
        >
          +{stage.xp} XP
        </span>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <p
          key={stageIndex}
          className="research-thinking-caption text-sm font-medium text-slate-700 dark:text-zinc-300"
        >
          {stage.text}
        </p>
        <span className="text-xs font-semibold text-violet-600 dark:text-violet-300">
          {totalXp} XP შეგროვდა
        </span>
      </div>

      <div className="w-full max-w-[280px]">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <ul className="flex w-full max-w-[280px] flex-col gap-1.5 text-left">
        {STAGES.map((item, index) => {
          const ItemIcon = item.icon;
          const done = index < stageIndex;
          const active = index === stageIndex;
          return (
            <li
              key={item.text}
              style={{ animationDelay: `${index * 60}ms` }}
              className={`study-plan-quest-row-in flex items-center gap-2 rounded-lg px-2 py-1 text-xs transition-colors ${
                active
                  ? "bg-violet-50 font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-200"
                  : done
                    ? "text-emerald-600 dark:text-emerald-300"
                    : "text-slate-400 dark:text-zinc-600"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  done
                    ? "study-plan-quest-check-pop bg-emerald-500 text-white"
                    : active
                      ? "bg-violet-600 text-white"
                      : "bg-slate-100 dark:bg-white/[0.06]"
                }`}
              >
                {done ? (
                  <Check className="h-3 w-3" strokeWidth={3} />
                ) : (
                  <ItemIcon className="h-3 w-3" strokeWidth={2.25} />
                )}
              </span>
              <span className={done ? "line-through decoration-emerald-400/60" : ""}>{item.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
