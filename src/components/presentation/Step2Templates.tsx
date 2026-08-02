"use client";

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
      <h2 className="headline mb-4 text-xl font-semibold text-zinc-100">
        Step 2 — Template არჩევა
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const selected = selectedTemplateId === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              className={`rounded-xl border p-3 text-left transition ${
                selected
                  ? "border-purple-500/60 bg-purple-500/10 shadow-[0_0_0_1px_rgba(168,85,247,0.3)]"
                  : "border-white/[0.1] bg-[#151619]/35 hover:border-purple-400/60"
              }`}
            >
              <TemplatePreview bg={template.bg} accent={template.accent} />
              <p className="mt-2 headline font-semibold text-zinc-100">{template.name}</p>
              <p className="text-xs text-zinc-400">{template.desc}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
