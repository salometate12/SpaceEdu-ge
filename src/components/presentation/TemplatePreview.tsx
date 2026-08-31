interface TemplatePreviewProps {
  bg: string;
  accent: string;
}

export function TemplatePreview({ bg, accent }: TemplatePreviewProps) {
  return (
    <div
      className="relative h-24 w-full overflow-hidden rounded-lg border border-slate-200 dark:border-white/10"
      style={{ backgroundColor: bg }}
    >
      <div
        className="absolute left-3 top-3 h-2.5 w-3/5 rounded"
        style={{ backgroundColor: accent, opacity: 0.9 }}
      />
      <div
        className="absolute left-3 top-8 h-2 w-4/5 rounded"
        style={{ backgroundColor: accent, opacity: 0.45 }}
      />
      <div
        className="absolute left-3 top-12 h-2 w-3/5 rounded"
        style={{ backgroundColor: accent, opacity: 0.45 }}
      />
      <div
        className="absolute bottom-3 right-3 h-8 w-10 rounded-md"
        style={{ backgroundColor: accent, opacity: 0.75 }}
      />
    </div>
  );
}
