"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { ACCENT_SOLID } from "@/components/landing/notebook/accents";

interface StickerButtonProps {
  children: ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  /** Shows a spinner in place of the sparkles. */
  loading?: boolean;
  /** Stretch to the container's width (the label stays centred). */
  fullWidth?: boolean;
  className?: string;
}

/**
 * The "paper sticker" primary button — the one on the reading-comprehension
 * page's "ტესტის დაწყება": a solid pill with a darker rim and a hard,
 * unblurred offset shadow (`.paper-sticker`), so it reads as stuck onto the
 * page and presses down when clicked; a soft glow pulses behind it while it
 * can be pressed.
 */
export function StickerButton({
  children,
  type = "button",
  onClick,
  disabled = false,
  loading = false,
  fullWidth = false,
  className = "",
}: StickerButtonProps) {
  const reduceMotion = useReducedMotion();
  const live = !disabled && !loading;

  return (
    <div className={`relative ${fullWidth ? "flex w-full" : "inline-flex"} ${className}`}>
      {live && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full bg-sky-500/30 blur-md"
          animate={reduceMotion ? undefined : { opacity: [0.35, 0.7, 0.35], scale: [1, 1.06, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={`paper-sticker relative z-[1] inline-flex items-center justify-center gap-2 rounded-full border-2 px-6 py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/30 disabled:cursor-not-allowed disabled:opacity-50 ${
          fullWidth ? "w-full" : ""
        } ${live ? "" : "pointer-events-none"} ${ACCENT_SOLID.blue}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="h-4 w-4 stroke-[1.75]" aria-hidden />
        )}
        {children}
        <ArrowRight className="h-4 w-4 stroke-[1.75]" aria-hidden />
      </button>
    </div>
  );
}
