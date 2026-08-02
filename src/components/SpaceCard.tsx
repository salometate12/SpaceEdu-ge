import Image from "next/image";
import { Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
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
}

interface SpaceCardProps {
  space: SpaceOption;
  onClick: () => void;
  animationDelayMs?: number;
}

export function SpaceCard({ space, onClick, animationDelayMs = 0 }: SpaceCardProps) {
  const isLocked = !space.available;
  const glowClass =
    space.id === "abiturient"
      ? "hover:shadow-[0_0_34px_rgba(6,182,212,0.2)]"
      : space.id === "student"
        ? "hover:shadow-[0_0_34px_rgba(16,185,129,0.2)]"
        : "hover:shadow-[0_0_26px_rgba(124,58,237,0.16)]";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isLocked}
      whileHover={
        isLocked
          ? undefined
          : {
              scale: 1.03,
              y: -5,
            }
      }
      transition={{ duration: 0.24, ease: "easeOut" }}
      className={`stagger-in group relative flex min-h-[220px] flex-col items-stretch overflow-hidden rounded-2xl border border-white/10 bg-[#12121A]/60 p-5 pb-6 pr-5 text-left backdrop-blur-xl transition-all duration-250 ${
        isLocked
          ? "cursor-not-allowed opacity-65"
          : `cursor-pointer ${glowClass}`
      }`}
      style={{
        animationDelay: `${animationDelayMs}ms`,
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
          background: `linear-gradient(180deg, ${space.borderColor}15 0%, transparent 55%)`,
        }}
      />

      {isLocked && (
        <div className="absolute left-1/2 top-3 z-[2] flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-[#a78bfa33] bg-[#130d25]/85 px-2.5 py-0.5 text-[10px] tracking-wide text-[#c4b5fd]">
          <Lock className="h-2.5 w-2.5" />
          მალე
        </div>
      )}

      {space.iconSrc ? (
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
      ) : space.icon ? (
        <div
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <span style={{ color: space.accentColor }}>{space.icon}</span>
        </div>
      ) : null}

      <div className="relative z-[1] flex flex-1 flex-col justify-between">
        <div className="max-w-[calc(100%-5rem)]">
          <p
            className="mb-1.5 text-sm font-semibold tracking-wide"
            style={{ color: space.accentColor }}
          >
            {space.title}
          </p>

          <p className="text-xs leading-relaxed tracking-wide text-[var(--text-secondary)]">
            {space.description}
          </p>
        </div>

        <span
          className="mt-5 inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold tracking-wide transition-all duration-200"
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
          {space.available ? <Sparkles className="h-3 w-3" /> : null}
          {space.badge}
        </span>
      </div>
    </motion.button>
  );
}
