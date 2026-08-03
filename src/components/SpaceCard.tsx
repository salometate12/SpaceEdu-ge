import Image from "next/image";
import { Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { DECOR_3D_ICON_PX, decor3dIconClassName } from "@/lib/decor-3d-icon";

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
  iconSrc?: string;
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
  const glowClass =
    space.id === "abiturient"
      ? "hover:shadow-[0_0_38px_rgba(6,182,212,0.22)]"
      : space.id === "student"
        ? "hover:shadow-[0_0_38px_rgba(16,185,129,0.22)]"
        : "hover:shadow-[0_0_30px_rgba(124,58,237,0.18)]";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isLocked}
      whileHover={
        isLocked
          ? undefined
          : {
              scale: 1.025,
              y: -6,
            }
      }
      transition={{ duration: 0.24, ease: "easeOut" }}
      className={`stagger-in group relative flex min-h-[250px] flex-col items-stretch overflow-hidden rounded-3xl border p-6 pb-6 text-left backdrop-blur-xl transition-all duration-250 ${
        isLocked
          ? "cursor-not-allowed border-white/10 bg-[#12121A]/60 opacity-65"
          : `cursor-pointer border-white/10 bg-[#12121A]/60 ${glowClass}`
      }`}
      style={{
        animationDelay: `${animationDelayMs}ms`,
        borderColor: isLocked ? undefined : `${space.borderColor}25`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-3 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${space.borderColor}AA 40%, ${space.borderColor}DD 50%, ${space.borderColor}AA 60%, transparent 100%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${space.borderColor}18 0%, transparent 60%)`,
        }}
      />

      {isLocked && (
        <div className="absolute right-4 top-4 z-[2] flex items-center gap-1 whitespace-nowrap rounded-full border border-[#a78bfa33] bg-[#130d25]/85 px-2.5 py-1 text-[10px] font-medium tracking-wide text-[#c4b5fd]">
          <Lock className="h-2.5 w-2.5" />
          მალე
        </div>
      )}

      {space.iconSrc && (
        <div className="pointer-events-none absolute -bottom-3 -right-2 z-0">
          <Image
            src={space.iconSrc}
            alt=""
            width={DECOR_3D_ICON_PX}
            height={DECOR_3D_ICON_PX}
            aria-hidden
            className={`${decor3dIconClassName} opacity-95 mix-blend-screen`}
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f99] to-transparent" />
        </div>
      )}

      <div className="relative z-[1] flex flex-1 flex-col justify-between">
        <div className="max-w-[calc(100%-4.5rem)]">
          <div
            className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border"
            style={{
              borderColor: `${space.borderColor}45`,
              backgroundColor: `${space.borderColor}14`,
              color: space.accentColor,
            }}
          >
            {space.icon}
          </div>

          <p
            className="headline mb-1.5 text-base font-bold tracking-wide"
            style={{ color: space.accentColor }}
          >
            {space.title}
          </p>

          <p className="text-xs leading-relaxed tracking-wide text-[var(--text-secondary)]">
            {space.description}
          </p>
        </div>

        <span
          className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-wide transition-all duration-200"
          style={
            space.available
              ? {
                  background: "rgba(10,10,15,0.8)",
                  color: space.accentColor,
                  border: `1px solid ${space.borderColor}99`,
                }
              : {
                  background: "rgba(19,13,37,0.8)",
                  color: "#c4b5fd",
                  border: "1px solid rgba(167,139,250,0.35)",
                }
          }
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
