"use client";

import { Check } from "lucide-react";
import { CV_ACCENTS, CV_TEMPLATE_INFO, CV_TEMPLATES, type CvAccentId, type CvLanguage, type CvPrefs, type CvTemplateId } from "@/lib/cv-data";

/** A schematic 72×100 sheet showing each template's layout. */
export function TemplateThumb({ id, accent }: { id: CvTemplateId; accent: string }) {
  const line = (width: string, color = "#d1d5db", height = 3) => (
    <span className="block rounded-full" style={{ width, height, background: color }} />
  );
  const lines = (count: number, color?: string) => (
    <span className="flex flex-col gap-[3px]">{Array.from({ length: count }, (_, i) => <span key={i}>{line(i % 3 === 2 ? "70%" : "100%", color)}</span>)}</span>
  );
  return (
    <span aria-hidden className="relative block h-[100px] w-[72px] overflow-hidden rounded-[4px] bg-white shadow-sm ring-1 ring-black/10">
      {id === "classic" ? (
        <span className="flex h-full flex-col items-center gap-1.5 p-2">
          {line("60%", "#111827", 4)}
          {line("40%", accent, 2)}
          <span className="mt-1 w-full">{line("100%", "#9ca3af", 1)}</span>
          <span className="w-full">{lines(3)}</span>
          <span className="w-full">{line("100%", "#9ca3af", 1)}</span>
          <span className="w-full">{lines(3)}</span>
        </span>
      ) : id === "modern" ? (
        <span className="flex h-full">
          <span className="flex w-[65%] flex-col gap-1.5 p-2">
            {line("80%", "#111827", 4)}
            {line("55%", accent, 2)}
            <span className="mt-1">{line("40%", accent, 2)}</span>
            {lines(4)}
          </span>
          <span className="flex w-[35%] flex-col gap-1.5 bg-[#f3f4f6] p-1.5 pt-2">
            <span className="mx-auto block h-4 w-4 rounded-full bg-[#d1d5db]" />
            {lines(4)}
          </span>
        </span>
      ) : id === "executive" ? (
        <span className="flex h-full">
          <span className="flex w-[32%] flex-col gap-1.5 p-1.5 pt-2" style={{ background: accent }}>
            <span className="mx-auto block h-4 w-4 rounded-full bg-white/70" />
            {lines(4, "rgba(255,255,255,0.55)")}
          </span>
          <span className="flex w-[68%] flex-col gap-1.5 p-2">
            {line("85%", "#111827", 4)}
            {line("50%", accent, 2)}
            {lines(5)}
          </span>
        </span>
      ) : id === "minimal" ? (
        <span className="flex h-full flex-col gap-2 p-2.5">
          <span className="flex items-center gap-1">
            {line("6px", accent, 2)}
            {line("55%", "#111827", 3)}
          </span>
          {[0, 1, 2].map((row) => (
            <span key={row} className="flex gap-1.5">
              <span className="w-[25%]">{line("100%", "#9ca3af", 2)}</span>
              <span className="flex-1">{lines(2)}</span>
            </span>
          ))}
        </span>
      ) : (
        <span className="flex h-full flex-col gap-1.5 p-2">
          {line("65%", "#111827", 4)}
          {line("90%", "#6b7280", 2)}
          <span className="mt-1">{line("100%", "#111827", 1)}</span>
          {lines(3, "#9ca3af")}
          {line("100%", "#111827", 1)}
          {lines(3, "#9ca3af")}
        </span>
      )}
    </span>
  );
}

const segment = (on: boolean) =>
  `rounded-full px-3 py-1 text-xs font-semibold transition ${on ? "bg-pink-600 text-white dark:bg-pink-500" : "text-slate-600 hover:text-pink-700 dark:text-zinc-300"}`;

export function CvTemplatePicker({
  prefs,
  accent,
  atsFocus,
  hasPhoto,
  onChange,
}: {
  prefs: CvPrefs;
  accent: string;
  /** The ATS pill is on: ATS is the recommended template. */
  atsFocus: boolean;
  hasPhoto: boolean;
  onChange: (next: Partial<CvPrefs> & { chosen?: boolean }) => void;
}) {
  const label = "text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500";
  return (
    <div className="min-w-0 space-y-5">
      <div>
        <p className={`mb-2 ${label}`}>ტემპლეიტი</p>
        <div
          role="radiogroup"
          aria-label="ტემპლეიტი"
          className="-mx-4 flex items-start gap-3 overflow-x-auto px-4 pb-2 pt-1 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {CV_TEMPLATES.map((id) => {
            const active = prefs.template === id;
            const info = CV_TEMPLATE_INFO[id];
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ template: id, chosen: true })}
                className={`relative flex w-[112px] shrink-0 flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition lg:w-auto ${
                  active
                    ? "border-pink-400 bg-pink-50/60 dark:border-pink-400/60 dark:bg-pink-500/10"
                    : "border-[var(--border)] bg-[var(--bg-card)] hover:border-pink-200 dark:hover:border-pink-400/30"
                }`}
              >
                {active ? (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-pink-600 text-white dark:bg-pink-500">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : null}
                <span className="relative">
                  <TemplateThumb id={id} accent={accent} />
                  {id === "ats" && atsFocus ? (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm">
                      რეკომენდებული
                    </span>
                  ) : null}
                </span>
                <span className="text-xs font-semibold leading-tight text-slate-800 dark:text-zinc-100">{info.name}</span>
                <span className="line-clamp-2 text-[10px] leading-tight text-slate-500 dark:text-zinc-400">{info.audience}</span>

              </button>
            );
          })}
        </div>
        {CV_TEMPLATE_INFO[prefs.template].note ? (
          <p className="mt-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[11px] leading-snug text-slate-600 dark:text-zinc-400">
            {CV_TEMPLATE_INFO[prefs.template].note}
          </p>
        ) : null}
      </div>

      <div>
        <p className={`mb-2 ${label}`}>ფერი</p>
        <div role="radiogroup" aria-label="აქცენტის ფერი" className="flex flex-wrap gap-2">
          {CV_ACCENTS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={prefs.accent === option.id}
              aria-label={option.label}
              title={option.label}
              disabled={prefs.template === "ats"}
              onClick={() => onChange({ accent: option.id as CvAccentId })}
              className={`flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 transition disabled:cursor-not-allowed disabled:opacity-40 dark:ring-offset-[#121214] ${
                prefs.accent === option.id ? "ring-2 ring-pink-500" : "ring-1 ring-black/10"
              }`}
              style={{ background: option.color }}
            >
              {prefs.accent === option.id ? <Check className="h-4 w-4 text-white" strokeWidth={3} /> : null}
            </button>
          ))}
        </div>
        {prefs.template === "ats" ? (
          <p className="mt-1.5 text-[11px] text-slate-500 dark:text-zinc-400">ATS ტემპლეიტი მხოლოდ შავ-თეთრია.</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className={`flex items-center gap-2 text-sm text-slate-700 dark:text-zinc-200 ${!hasPhoto || prefs.template === "ats" ? "opacity-50" : ""}`}>
          <input
            type="checkbox"
            checked={prefs.showPhoto && prefs.template !== "ats"}
            disabled={!hasPhoto || prefs.template === "ats"}
            onChange={(event) => onChange({ showPhoto: event.target.checked })}
            className="h-4 w-4 accent-pink-600"
          />
          ფოტოს ჩვენება
        </label>
        <LanguageSwitch value={prefs.language} onChange={(language) => onChange({ language })} />
      </div>
    </div>
  );
}

export function LanguageSwitch({ value, onChange }: { value: CvLanguage; onChange: (value: CvLanguage) => void }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-zinc-200">
      <span>CV-ის ენა:</span>
      <div role="radiogroup" aria-label="CV-ის ენა" className="flex rounded-full border border-[var(--border)] bg-[var(--bg-card)] p-0.5">
        {(["ka", "en"] as const).map((language) => (
          <button key={language} type="button" role="radio" aria-checked={value === language} onClick={() => onChange(language)} className={segment(value === language)}>
            {language === "ka" ? "ქართული" : "English"}
          </button>
        ))}
      </div>
    </div>
  );
}
