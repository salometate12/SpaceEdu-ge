"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  CalendarSearch,
  FileSearch,
  ListChecks,
  ScanText,
} from "lucide-react";

const STAGES = [
  { icon: ScanText, text: "ვკითხულობ PDF-ს...", xp: 15 },
  { icon: FileSearch, text: "ვეძებ მნიშვნელოვან თარიღებს...", xp: 20 },
  { icon: CalendarSearch, text: "ვთვლი კვირებს სემესტრის დაწყებიდან...", xp: 25 },
  { icon: ListChecks, text: "ვალაგებ კალენდარში...", xp: 15 },
];

const STAGE_DURATION_MS = 1600;

/**
 * A gamified "AI is reading your syllabus" loader, matching the study-plan
 * and presentation quest loaders' XP/stage pattern but rose-themed to match
 * the syllabus page's existing branding (no emoji, no gradients).
 */
export function SyllabusThinkingLoader() {
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
      aria-label="AI აანალიზებს შენს სილაბუსს"
      className="flex flex-col items-center justify-center gap-6 py-8 text-center"
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span
          className="animate-star-twinkle absolute -left-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-400"
          style={{ "--star-delay": "0.2s", "--star-duration": "2.4s" } as CSSProperties}
        />
        <span
          className="animate-star-drift absolute -right-1 top-3 h-1.5 w-1.5 rounded-full bg-rose-300"
          style={{ "--star-delay": "0.8s", "--star-duration": "3.2s" } as CSSProperties}
        />
        <span
          className="animate-star-twinkle absolute bottom-0 right-3 h-1 w-1 rounded-full bg-rose-300"
          style={{ "--star-delay": "1.3s", "--star-duration": "2.8s" } as CSSProperties}
        />

        <span className="absolute inset-0 animate-ping rounded-full bg-rose-400/15 dark:bg-rose-500/15" />
        <span className="absolute inset-0 rounded-full border border-rose-200 dark:border-rose-500/20" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 dark:bg-rose-500 dark:shadow-[0_0_24px_rgba(244,63,94,0.35)]">
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
        <span className="text-xs font-semibold text-rose-600 dark:text-rose-300">
          {totalXp} XP შეგროვდა
        </span>
      </div>

      <div className="w-full max-w-[280px]">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-rose-500 transition-all duration-500 ease-out dark:bg-rose-400"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5" aria-hidden>
        {STAGES.map((item, index) => (
          <span
            key={item.text}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              index === stageIndex
                ? "w-5 bg-rose-500 dark:bg-rose-400"
                : index < stageIndex
                  ? "w-1.5 bg-rose-300 dark:bg-rose-500/40"
                  : "w-1.5 bg-slate-200 dark:bg-white/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
