"use client";

import { useEffect, useRef, useState } from "react";
import { conspectusViewUi } from "@/lib/conspectus-view-ui";
import type { MarkdownHeading } from "@/lib/markdown-headings";

interface TocPopoverProps {
  headings: MarkdownHeading[];
  onSelect: (id: string) => void;
}

export function TocPopover({ headings, onSelect }: TocPopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (headings.length === 0) return null;

  return (
    <div ref={rootRef} className="absolute right-3 top-3 z-20 lg:right-8 lg:top-8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white/95 px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-md backdrop-blur-md transition-all hover:border-zinc-300 hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-200"
      >
        📍 {conspectusViewUi.tocTitle}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 max-h-[min(60vh,20rem)] w-[min(100vw-3rem,16rem)] overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 shadow-xl backdrop-blur-xl dark:border-zinc-700 dark:bg-zinc-900/95"
        >
          <p className="border-b border-zinc-100 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
            {conspectusViewUi.tocTitle}
          </p>
          <ul className="scrollbar-thin max-h-[min(56vh,18rem)] overflow-y-auto p-2">
            {headings.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onSelect(h.id);
                    setOpen(false);
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs leading-snug text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 ${
                    h.level === 3 ? "pl-5" : ""
                  }`}
                >
                  {h.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
