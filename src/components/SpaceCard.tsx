import { Lock, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ACCENT_CARD,
  ACCENT_PILL,
  ACCENT_TEXT,
  type NotebookAccent,
} from "@/components/landing/notebook/accents";

export interface SpaceOption {
  id: "school" | "abiturient" | "student";
  title: string;
  description: string;
  available: boolean;
  badge: string;
  route: string;
  accent: NotebookAccent;
  /** Which way the card leans when you point at it, as on the landing. */
  tilt: string;
  icon?: ReactNode;
  badgeIcon?: LucideIcon;
}

interface SpaceCardProps {
  space: SpaceOption;
  onClick: () => void;
  animationDelayMs?: number;
}

export function SpaceCard({ space, onClick, animationDelayMs = 0 }: SpaceCardProps) {
  const isLocked = !space.available;
  const BadgeIcon = space.badgeIcon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLocked}
      className={`stagger-in relative flex min-h-[230px] w-full flex-col rounded-2xl border-2 p-7 text-left transition-transform duration-300 ${
        ACCENT_CARD[space.accent]
      } ${isLocked ? "cursor-not-allowed opacity-60" : `cursor-pointer ${space.tilt}`}`}
      style={{ animationDelay: `${animationDelayMs}ms` }}
    >
      {isLocked && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 whitespace-nowrap rounded-full border-2 border-slate-400/70 bg-white/70 px-2.5 py-1 text-[10px] font-bold tracking-wide text-slate-600 dark:border-white/20 dark:bg-white/[0.08] dark:text-slate-300">
          <Lock className="h-2.5 w-2.5" />
          მალე
        </span>
      )}

      <div
        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white/70 dark:bg-white/[0.08] ${
          ACCENT_CARD[space.accent]
        } ${ACCENT_TEXT[space.accent]}`}
      >
        {space.icon}
      </div>

      <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-50">
        {space.title}
      </h3>
      <p className="mb-5 flex-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {space.description}
      </p>

      <span
        className={`inline-flex w-fit items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-xs font-bold ${ACCENT_PILL[space.accent]}`}
      >
        {space.available ? (
          <Sparkles className="h-3 w-3" />
        ) : BadgeIcon ? (
          <BadgeIcon className="h-3 w-3" />
        ) : null}
        {space.badge}
      </span>
    </button>
  );
}
