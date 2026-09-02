"use client";

import { Check, LayoutTemplate } from "lucide-react";
import { TemplatePreview } from "./TemplatePreview";
import type { PresentationTemplate } from "./PresentationWizard";

interface Step2TemplatesProps {
  templates: PresentationTemplate[];
  selectedTemplateId: string;
  onSelect: (id: string) => void;
}

export function Step2Templates({
  templates,
  selectedTemplateId,
  onSelect,
}: Step2TemplatesProps) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="subject-icon-wrap flex h-9 w-9 shrink-0 items-center justify-center text-violet-600 dark:text-violet-400">
          <LayoutTemplate className="h-4 w-4" />
        </span>
        <h2 className="headline text-xl font-semibold text-slate-900 dark:text-zinc-100">
          Template არჩევა
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const selected = selectedTemplateId === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              className={`relative rounded-2xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                selected
                  ? "border-violet-400 bg-violet-50 shadow-sm dark:border-violet-400/50 dark:bg-violet-500/10"
                  : "border-slate-200 bg-white hover:border-violet-200 dark:border-white/[0.1] dark:bg-white/[0.02] dark:hover:border-violet-400/30"
              }`}
            >
              {selected && (
                <span className="absolute right-2.5 top-2.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white shadow-sm dark:bg-violet-500">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
              <TemplatePreview bg={template.bg} accent={template.accent} />
              <p className="mt-2 headline font-semibold text-slate-900 dark:text-zinc-100">
                {template.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">{template.desc}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
