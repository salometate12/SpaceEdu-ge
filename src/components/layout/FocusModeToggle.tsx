"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Focus, Minimize2 } from "lucide-react";
import { useFocusMode } from "@/contexts/FocusModeContext";

/**
 * Header control that collapses the workspace chrome (side rail, dock,
 * footer, header nav) into a distraction-free reading view.
 */
export function FocusModeToggle({ compact = false }: { compact?: boolean }) {
  const { focusMode, toggleFocusMode } = useFocusMode();

  return (
    <button
      type="button"
      onClick={toggleFocusMode}
      aria-pressed={focusMode}
      title={focusMode ? "ფოკუს რეჟიმიდან გამოსვლა (Esc)" : "ფოკუს რეჟიმი — ზედმეტის დამალვა"}
      className={`inline-flex items-center gap-1.5 rounded-full border transition-all active:scale-95 ${
        compact ? "h-9 w-9 justify-center" : "h-9 px-3"
      } ${
        focusMode
          ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-600 dark:border-cyan-400/40 dark:text-cyan-300"
          : "border-slate-200 bg-white/60 text-slate-500 hover:border-cyan-300 hover:text-cyan-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400 dark:hover:border-cyan-400/30 dark:hover:text-cyan-300"
      }`}
    >
      {focusMode ? (
        <Minimize2 className="h-4 w-4 stroke-[1.75]" />
      ) : (
        <Focus className="h-4 w-4 stroke-[1.75]" />
      )}
      {!compact && (
        <span className="text-xs font-semibold">
          {focusMode ? "გამოსვლა" : "ფოკუსი"}
        </span>
      )}
    </button>
  );
}

/**
 * The only chrome that survives focus mode — a small floating pill so the
 * student always has a way back without hunting for the keyboard.
 */
export function FocusModeExitPill() {
  const { focusMode, setFocusMode } = useFocusMode();

  return (
    <AnimatePresence>
      {focusMode && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => setFocusMode(false)}
          className="fixed bottom-5 right-5 z-[70] inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-[#0D0D15]/90 px-4 py-2.5 text-xs font-bold text-cyan-200 shadow-[0_0_24px_rgba(6,182,212,0.25)] backdrop-blur-xl transition hover:border-cyan-300/60 hover:text-cyan-100"
        >
          <Minimize2 className="h-3.5 w-3.5 stroke-[2]" />
          ფოკუს რეჟიმიდან გამოსვლა
          <span className="rounded border border-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-white/50">
            Esc
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
