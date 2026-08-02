"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Layers } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePreviewMode, type PreviewMode } from "@/contexts/PreviewModeContext";

const OPTIONS: { id: PreviewMode; label: string }[] = [
  { id: "mock", label: "დემო მონაცემები (Mock Data)" },
  { id: "live", label: "ცოცხალი ბაზა (Live Data)" },
];

const BUTTON_LABEL: Record<PreviewMode, string> = {
  mock: "Preview mode: Mock data",
  live: "Live mode: Live data",
};

export function PreviewModeDropdown() {
  const { previewMode, setPreviewMode } = usePreviewMode();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectMode = useCallback(
    (mode: PreviewMode) => {
      setPreviewMode(mode);
      setOpen(false);
    },
    [setPreviewMode],
  );

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-600 shadow-sm transition-colors duration-300 ease-in-out hover:border-slate-300 hover:bg-white dark:border-white/[0.08] dark:bg-[#0f1420]/70 dark:text-zinc-300 dark:hover:border-white/15 dark:hover:bg-[#12121A]/90"
      >
        <Layers className="h-4 w-4 shrink-0 text-violet-500 dark:text-purple-300" strokeWidth={1.5} />
        <span className="whitespace-nowrap">{BUTTON_LABEL[previewMode]}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ease-in-out dark:text-zinc-500 ${open ? "rotate-180" : ""}`}
          strokeWidth={1.75}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="listbox"
            aria-label="მონაცემების რეჟიმი"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 z-50 mt-2 min-w-[240px] overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#12121A]/95 dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
          >
            {OPTIONS.map((option) => {
              const active = previewMode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => selectMode(option.id)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition-colors duration-300 ease-in-out hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/5"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full transition-colors duration-300 ease-in-out ${
                      active
                        ? option.id === "mock"
                          ? "bg-violet-500 shadow-[0_0_8px_rgba(124,58,237,0.6)]"
                          : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                        : "bg-slate-300/80 dark:bg-white/20"
                    }`}
                  />
                  <span className={active ? "font-medium" : ""}>{option.label}</span>
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export type { PreviewMode };
