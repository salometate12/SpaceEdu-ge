"use client";

import { LayoutTemplate } from "lucide-react";
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
        <span className="subject-icon-wrap flex h-9 w-9 shrink-0 items-center justify-center text-amber-600 dark:text-amber-400">
          <LayoutTemplate className="h-4 w-4" />
        </span>
        <h2 className="headline text-xl font-semibold text-slate-900 dark:text-zinc-100">
          Step 2 — Template არჩევა
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
              className={`rounded-2xl border p-3 text-left transition ${
                selected
                  ? "border-amber-300 bg-amber-50 shadow-sm dark:border-amber-400/40 dark:bg-amber-500/10"
                  : "border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50 dark:border-white/[0.1] dark:bg-white/[0.02] dark:hover:border-amber-400/30"
              }`}
            >
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
