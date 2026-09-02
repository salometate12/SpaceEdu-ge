"use client";

import { ArrowLeft, Download, Sparkles } from "lucide-react";
import { exportToPdf } from "@/lib/exportPdf";
import { exportToPptx } from "@/lib/exportPptx";
import { SlideCard } from "./SlideCard";
import type {
  GeneratedSlide,
  PresentationTemplate,
} from "./PresentationWizard";

interface Step4ResultProps {
  title: string;
  slides: GeneratedSlide[];
  template: PresentationTemplate;
  onReset: () => void;
}

export function Step4Result({
  title,
  slides,
  template,
  onReset,
}: Step4ResultProps) {
  const secondaryBtn =
    "inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-violet-400/30 dark:hover:bg-violet-500/10 dark:hover:text-white";

  return (
    <section>
      <div className="dashboard-tool-card mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <span className="subject-icon-wrap flex h-9 w-9 shrink-0 items-center justify-center text-violet-600 dark:text-violet-400">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h2 className="headline text-xl font-semibold text-slate-900 dark:text-zinc-100">
              {title}
            </h2>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-zinc-400">
              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 dark:border-white/[0.1] dark:bg-white/[0.03]">
                {template.name}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 dark:border-white/[0.1] dark:bg-white/[0.03]">
                {slides.length} სლაიდი
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportToPptx(slides, template.id, title)}
            className="inline-flex items-center rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 dark:bg-violet-500 dark:hover:bg-violet-400"
          >
            <Download className="mr-1 h-4 w-4" />
            PPTX გადმოწერა
          </button>
          <button
            type="button"
            onClick={() => exportToPdf("presentation-preview", title)}
            className={secondaryBtn}
          >
            <Download className="mr-1 h-4 w-4" />
            PDF გადმოწერა
          </button>
          <button type="button" onClick={onReset} className={secondaryBtn}>
            <ArrowLeft className="mr-1 h-4 w-4" strokeWidth={2} />
            ახალი პრეზენტაცია
          </button>
        </div>
      </div>

      <div id="presentation-preview" className="grid gap-3">
        {slides.map((slide, idx) => (
          <SlideCard key={slide.id} slide={slide} index={idx} template={template} />
        ))}
      </div>
    </section>
  );
}
