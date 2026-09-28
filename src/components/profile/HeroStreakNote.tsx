"use client";

import { Flame } from "lucide-react";
import { useStreak } from "@/hooks/useStreak";

/** "🔥 N დღიანი სტრიკი" beside the hero's badges; nothing while it's 0. */
export function HeroStreakNote({ className = "" }: { className?: string }) {
  const { ready, current } = useStreak();
  if (!ready || current === 0) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${className}`}>
      <Flame className="h-3.5 w-3.5 text-orange-500" strokeWidth={2.25} aria-hidden />
      {current} დღიანი სტრიკი
    </span>
  );
}
