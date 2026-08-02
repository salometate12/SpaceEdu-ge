"use client";

import { Download } from "lucide-react";
import { exportToPdf } from "@/lib/exportPdf";
import { exportToPptx } from "@/lib/exportPptx";
import { Button } from "@/components/ui/Button";
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
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="headline text-xl font-semibold text-zinc-100">{title}</h2>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-400">
            <span className="rounded-full border border-white/[0.1] bg-white/[0.03] px-2 py-0.5">
              {template.name}
            </span>
            <span className="rounded-full border border-white/[0.1] bg-white/[0.03] px-2 py-0.5">
              {slides.length} სლაიდი
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => exportToPptx(slides, template.id, title)}>
            <Download className="mr-1 h-4 w-4" />
            PPTX გადმოწერა
          </Button>
          <Button variant="secondary" onClick={() => exportToPdf("presentation-preview", title)}>
            <Download className="mr-1 h-4 w-4" />
            PDF გადმოწერა
          </Button>
          <Button variant="ghost" onClick={onReset}>
            ← ახალი პრეზენტაცია
          </Button>
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
