import { Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface SpaceOption {
  id: "school" | "abiturient" | "student";
  title: string;
  description: string;
  available: boolean;
  badge: string;
  route: string;
  borderColor: string;
  bgColor: string;
  accentColor: string;
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
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isLocked}
      whileHover={
        isLocked
          ? undefined
          : {
              y: -6,
            }
      }
      transition={{ duration: 0.24, ease: "easeOut" }}
      className={`stagger-in group relative flex min-h-[230px] flex-col overflow-hidden rounded-2xl border p-7 text-left backdrop-blur-xl transition-all duration-300 ${
        isLocked
          ? "cursor-not-allowed border-white/[0.06] bg-gradient-to-b from-[#17131f]/60 to-[#121214]/30 opacity-65"
          : "cursor-pointer border-white/[0.06] bg-gradient-to-b from-[#17131f]/80 to-[#121214]/40 hover:border-white/[0.14]"
      }`}
      style={{ animationDelay: `${animationDelayMs}ms` }}
    >
      {/* ambient pulsing glow blob */}
      <div
        className="animate-card-blob pointer-events-none absolute -top-8 left-6 -z-0 h-32 w-32 rounded-full blur-[60px]"
        style={{ backgroundColor: `${space.borderColor}30` }}
        aria-hidden
      />

      {isLocked && (
        <div className="absolute right-4 top-4 z-[2] flex items-center gap-1 whitespace-nowrap rounded-full border border-[#a78bfa33] bg-[#130d25]/85 px-2.5 py-1 text-[10px] font-medium tracking-wide text-[#c4b5fd]">
          <Lock className="h-2.5 w-2.5" />
          მალე
        </div>
      )}

      <div className="relative z-[1] flex flex-1 flex-col">
        <div
          className="animate-icon-glow mb-5 flex h-12 w-12 items-center justify-center"
          style={
            {
              color: space.accentColor,
              "--icon-glow-color": `${space.accentColor}88`,
            } as CSSProperties
          }
        >
          {space.icon}
        </div>

        <h3 className="mb-2 text-lg font-semibold text-white">{space.title}</h3>
        <p className="mb-5 flex-1 text-sm leading-relaxed text-gray-400">
          {space.description}
        </p>

        <span
          className="inline-flex w-fit items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200"
          style={{
            borderColor: `${space.borderColor}40`,
            backgroundColor: `${space.borderColor}12`,
            color: space.accentColor,
            border: "1px solid",
          }}
        >
          {space.available ? (
            <Sparkles className="h-3 w-3" />
          ) : BadgeIcon ? (
            <BadgeIcon className="h-3 w-3" />
          ) : null}
          {space.badge}
        </span>
      </div>
    </motion.button>
  );
}
