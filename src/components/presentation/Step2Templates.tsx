"use client";

import { Check, Palette } from "lucide-react";
import { StepSection, TONES } from "@/components/ui/wizard/StepSection";
import { slideTheme } from "@/lib/presentation-theme";
import { NewBadge, TemplatePreview } from "./TemplatePreview";
import type { PresentationTemplate } from "./PresentationWizard";

interface Step2TemplatesProps {
  templates: PresentationTemplate[];
  selectedTemplateId: string;
  onSelect: (id: string) => void;
}

/** The design's three colours: background, title and accent. */
export function templateColors(id: string): string[] {
  const theme = slideTheme(id);
  return [theme.bg, theme.title, theme.accent];
}

export function Step2Templates({ templates, selectedTemplateId, onSelect }: Step2TemplatesProps) {
  return (
    <StepSection icon={Palette} tone={TONES.pink} title="დიზაინი" subtitle="აირჩიე სტილი, ფერებს მერეც შეცვლი">
      <div role="radiogroup" aria-label="დიზაინი" className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {templates.map((template) => {
          const selected = selectedTemplateId === template.id;
          return (
            <button
              key={template.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(template.id)}
              className={`wz-focus relative flex min-w-0 flex-col gap-2.5 rounded-[20px] p-2.5 text-left transition-colors ${
                selected ? "border-2 border-[var(--wz-strong)] p-[9px]" : "border border-[var(--wz-border)] hover:border-[var(--wz-future)]"
              }`}
            >
              {selected ? (
                <span className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--wz-strong)] text-[var(--wz-on-strong)]" aria-hidden>
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              ) : null}
              <span className="relative block overflow-hidden rounded-[12px]">
                <TemplatePreview template={template} />
                {template.isNew ? (
                  <span className="absolute bottom-1.5 left-1.5">
                    <NewBadge />
                  </span>
                ) : null}
              </span>
              <span className="flex items-center gap-2 px-1 pb-0.5">
                <span className="min-w-0 flex-1 truncate text-[14.5px] font-bold text-[var(--wz-title)]">{template.name}</span>
                <span className="flex shrink-0 gap-1 max-sm:hidden" aria-hidden>
                  {templateColors(template.id).map((color, index) => (
                    <span key={index} className="h-3.5 w-3.5 rounded-full border border-black/10 dark:border-white/15" style={{ background: color }} />
                  ))}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </StepSection>
  );
}
