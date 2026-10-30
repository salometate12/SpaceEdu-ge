import { slideTheme } from "@/lib/presentation-theme";
import type { PresentationForm, PresentationTemplate, QAAnswers } from "@/lib/presentation-types";
import { LANGUAGES } from "./Step1Info";
import { normalizeAudience } from "./Step3PhotosQA";

/**
 * „შენი პრეზენტაცია“ beside steps 1–3: a 16:9 sketch in the chosen
 * design's colours and fonts, then what's been chosen so far.
 */
export function PresentationSummary({
  form,
  template,
  qa,
  step,
}: {
  form: PresentationForm;
  template: PresentationTemplate;
  qa: QAAnswers;
  step: number;
}) {
  const theme = slideTheme(template.id);
  const language = LANGUAGES.find((item) => item.value === form.language)?.label ?? form.language;
  const rows: [string, string][] = [
    ["თემა", form.topic.trim()],
    ["საგანი", form.subject.trim()],
    ["სლაიდები", String(form.slideCount)],
    ["დონე", form.level],
    ["ენა", language],
  ];
  // Each choice joins the list on the step where it's made, and follows it live.
  if (step >= 2) rows.push(["დიზაინი", template.name]);
  if (step >= 3) rows.push(["მიზანი", qa.goal], ["ტონი", qa.tone]);
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[16px] font-bold text-[var(--wz-title)]">შენი პრეზენტაცია</h2>
      <div className="relative aspect-video overflow-hidden rounded-[12px] border border-black/5" style={{ background: theme.bg }} aria-hidden>
        <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: theme.accent }} />
        <div className="flex h-full flex-col justify-center gap-2 px-6">
          <span className="truncate text-[17px] font-bold max-sm:text-[12px]" style={{ color: theme.title, fontFamily: theme.fontTitle }}>
            {form.topic.trim() || template.name}
          </span>
          <span className="h-2 w-3/4 rounded-full opacity-35" style={{ background: theme.body }} />
          <span className="h-2 w-1/2 rounded-full opacity-35" style={{ background: theme.body }} />
        </div>
      </div>
      <dl className="overflow-hidden rounded-[16px] bg-[var(--wz-card)]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex min-h-10 items-center justify-between gap-3 border-t border-[var(--wz-divider)] px-4 py-2 first:border-t-0">
            <dt className="shrink-0 text-[13.5px] text-[var(--wz-faint)]">{label}</dt>
            <dd className={`min-w-0 truncate text-right text-[13.5px] ${value ? "font-semibold text-[var(--wz-title)]" : "text-[var(--wz-future)]"}`}>
              {value ? normalizeAudience(value) : "არ არის მითითებული"}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-[13px] text-[var(--wz-muted)]">შედეგი შეინახება „ჩემს პრეზენტაციებში“.</p>
    </div>
  );
}
