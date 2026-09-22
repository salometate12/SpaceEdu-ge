"use client";

import { useEffect, useState } from "react";
import { Maximize2, X } from "lucide-react";
import type { GeographyFigure } from "@/data/geographyExamsData";

/** One figure with a full-screen zoom lightbox — geography maps and diagrams
 *  carry fine legend text, so they render large and open on click. */
function FigureView({ figure }: { figure: GeographyFigure }) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [zoomed]);

  return (
    <>
      <button
        type="button"
        onClick={() => setZoomed(true)}
        className="group relative block w-full overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0c0b12]"
        aria-label="სურათის გადიდება"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={figure.src} alt={figure.alt} className="max-h-[70vh] w-full object-contain" />
        <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-2.5 py-1 text-[11px] font-bold text-white opacity-90 backdrop-blur-sm">
          <Maximize2 className="h-3 w-3 stroke-[2.5]" />
          გადიდება
        </span>
        {figure.caption && (
          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-slate-900/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
            {figure.caption}
          </span>
        )}
      </button>

      {zoomed && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm"
          onClick={() => setZoomed(false)}
          role="dialog"
          aria-modal="true"
          aria-label={figure.alt}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="დახურვა"
          >
            <X className="h-5 w-5 stroke-[2.5]" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={figure.src}
            alt={figure.alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[95vh] max-w-[95vw] cursor-default rounded-lg object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}

export function GeographyQuestionFigures({ figures }: { figures?: GeographyFigure[] }) {
  if (!figures || figures.length === 0) return null;
  return (
    <div className="mt-2 space-y-2">
      {figures.map((f) => (
        <FigureView key={f.src} figure={f} />
      ))}
    </div>
  );
}
