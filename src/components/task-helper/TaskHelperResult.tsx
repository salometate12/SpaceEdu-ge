"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarPlus, Check, FolderOpen, Plus, Presentation as PresentationIcon } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { Toast } from "@/components/ui/Toast";
import { daysUntil, localDay } from "@/lib/task-helper";
import { addTaskToPlan, presentationFromTask } from "@/lib/task-helper-actions";
import { chooseTaskIdea, toggleTaskStep, type TaskHelper } from "@/lib/task-helper-store";
import { TaskChat } from "./TaskChat";

const MONTHS = ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"];
const MONTHS_SHORT = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];

export function longDate(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}
const shortDate = (date: string) => {
  const [, m, d] = date.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
};

/** „ჩაბარებამდე 9 დღე“, or what to say on and after the day. */
export function daysLeftLabel(due: string, today: string): string {
  const days = daysUntil(due, today);
  if (days > 0) return `ჩაბარებამდე ${days} დღე`;
  if (days === 0) return "ჩაბარება დღესაა";
  return "ჩაბარების ვადა გავიდა";
}

type SectionId = "requirements" | "steps" | "ideas" | "tips" | "presentation";

const SECTION_LABELS: Record<SectionId, string> = {
  requirements: "რას ითხოვენ",
  steps: "ნაბიჯები",
  ideas: "იდეები",
  tips: "რჩევები",
  presentation: "პრეზენტაცია",
};

/** Which section is in view, for the navigation's highlight. */
function useScrollSpy(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  const key = ids.join(",");
  useEffect(() => {
    const elements = key
      .split(",")
      .map((id) => document.getElementById(`th-${id}`))
      .filter((element): element is HTMLElement => Boolean(element));
    if (elements.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace(/^th-/, ""));
      },
      { rootMargin: "-25% 0px -60% 0px" },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [key]);
  return active;
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="text-[19px] font-bold tracking-tight text-[var(--th-title)] sm:text-[21px]">{children}</h2>;
}

/**
 * A saved assignment's plan (canvas variant A): a sticky navigation with
 * the progress on the left (chips along the top on a phone), the sections
 * below one another, and the chat with its box pinned to the bottom.
 */
export function TaskHelperResult({ task }: { task: TaskHelper }) {
  const router = useRouter();
  const [today] = useState(() => localDay());
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  const { result } = task;

  const sections = useMemo(
    () =>
      (["requirements", "steps", "ideas", "tips", "presentation"] as SectionId[]).filter((id) =>
        id === "requirements" ? result.requirements.length > 0 : id === "presentation" ? Boolean(result.presentation?.slides.length) : Boolean(result[id]?.length),
      ),
    [result],
  );
  const active = useScrollSpy(sections);

  const steps = result.steps ?? [];
  const done = task.doneSteps.filter((index) => index < steps.length).length;
  const current = steps.findIndex((_, index) => !task.doneSteps.includes(index));
  const daysLabel = task.dueDate ? daysLeftLabel(task.dueDate, today) : null;
  const subtitle = [task.subjectName, task.dueDate ? `ჩაბარება ${longDate(task.dueDate)}` : null].filter(Boolean).join(" · ");
  const datedSteps = steps.some((step) => step.date);

  const jump = (id: string) => document.getElementById(`th-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const progress = steps.length > 0 ? (
    <div className="flex flex-col gap-2">
      <p className="text-[13.5px] font-semibold text-[var(--th-title)]">
        შესრულებული {done} / {steps.length}
      </p>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--th-track)]" role="progressbar" aria-label="შესრულებული ნაბიჯები" aria-valuenow={done} aria-valuemin={0} aria-valuemax={steps.length}>
        <div className="h-full rounded-full bg-[var(--th-sky-solid)] transition-[width] duration-500" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      {daysLabel ? <p className="text-[13px] text-[var(--th-muted)]">{daysLabel}</p> : null}
    </div>
  ) : null;

  return (
    <div className="th under-site-header min-h-dvh max-md:-mt-[var(--safe-top)] max-md:-mb-36 max-md:pb-36">
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-10 pt-[calc(var(--safe-top)+16px)] sm:px-6 md:pt-10">
        <header className="flex items-start gap-3 sm:gap-4">
          <BackButton fallbackHref="/task-helper" />
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-bold leading-tight tracking-tight text-[var(--th-title)] sm:text-[30px]">{task.title}</h1>
            {subtitle ? <p className="mt-1 text-[14.5px] text-[var(--th-muted)] max-md:hidden sm:text-[15.5px]">{subtitle}</p> : null}
            {/* Phone: the days left and the steps done, instead of the side panel. */}
            <p className="mt-1 text-[14px] text-[var(--th-muted)] md:hidden">
              {[daysLabel, steps.length ? `${done}/${steps.length}` : null, !daysLabel ? task.subjectName : null].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link href="/library?type=tasks" className="th-secondary th-focus h-11 px-4 text-[14px] max-sm:w-11 max-sm:px-0">
              <FolderOpen className="h-4 w-4" aria-hidden />
              <span className="max-sm:sr-only">ჩემი მასალები</span>
            </Link>
            <Link href="/task-helper" className="th-primary th-focus h-11 px-4 text-[14px] max-sm:w-11 max-sm:px-0">
              <Plus className="h-4 w-4" aria-hidden />
              <span className="max-sm:sr-only">ახალი დავალება</span>
            </Link>
          </div>
        </header>

        {/* Phone: the sections as chips, kept at the top. */}
        <nav aria-label="სექციები" className="th-scroll sticky top-0 z-20 -mx-4 mt-4 flex gap-2 overflow-x-auto bg-[var(--page-bg)] px-4 py-2.5 md:hidden">
          {sections.map((id) => (
            <button key={id} type="button" aria-current={active === id ? "true" : undefined} onClick={() => jump(id)} className="th-chip th-focus">
              {SECTION_LABELS[id]}
            </button>
          ))}
        </nav>

        <div className="mt-4 grid grid-cols-1 gap-6 md:mt-6 md:grid-cols-[250px_1fr]">
          <aside className="max-md:hidden">
            <div className="th-card sticky top-[calc(var(--site-header-h)+24px)] flex flex-col gap-5 p-4">
              <nav aria-label="სექციები" className="flex flex-col gap-1">
                {sections.map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-current={active === id ? "true" : undefined}
                    onClick={() => jump(id)}
                    className={`th-focus flex h-10 items-center rounded-[12px] px-3 text-left text-[14.5px] font-semibold transition-colors ${
                      active === id ? "bg-[var(--th-sky-bg)] text-[var(--th-sky)]" : "text-[var(--th-text)] hover:bg-[var(--th-hover)]"
                    }`}
                  >
                    {SECTION_LABELS[id]}
                  </button>
                ))}
              </nav>
              {progress ? <div className="border-t border-[var(--th-border)] pt-4">{progress}</div> : null}
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-5">
            <section id="th-requirements" className="th-card scroll-mt-[calc(var(--site-header-h)+72px)] p-4 sm:p-6">
              <SectionTitle>რას ითხოვენ</SectionTitle>
              <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {result.requirements.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[14.5px] leading-snug text-[var(--th-title)]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--th-sky)]" strokeWidth={2.6} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              {result.grading ? (
                <p className="mt-5 rounded-[16px] bg-[var(--th-grade-bg)] px-4 py-3 text-[14px] leading-relaxed text-[var(--th-title)]">
                  <b className="text-[var(--th-grade)]">შეფასება: </b>
                  {result.grading}
                </p>
              ) : null}
            </section>

            {steps.length > 0 ? (
              <section id="th-steps" className="th-card scroll-mt-[calc(var(--site-header-h)+72px)] p-4 sm:p-6">
                <SectionTitle>ნაბიჯები</SectionTitle>
                <ol className="mt-4 flex flex-col gap-2">
                  {steps.map((step, index) => {
                    const checked = task.doneSteps.includes(index);
                    return (
                      <li key={`${index}-${step.title}`}>
                        <label className="flex cursor-pointer items-start gap-3 rounded-[16px] border border-[var(--th-border)] p-3.5 hover:bg-[var(--th-hover)]">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTaskStep(task.id, index)}
                            className="th-focus mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#0284c7]"
                          />
                          <span className="min-w-0 flex-1">
                            <span className={`block text-[15px] font-bold leading-snug ${checked ? "text-[var(--th-muted)] line-through" : "text-[var(--th-title)]"}`}>
                              {index + 1}. {step.title}
                            </span>
                            <span className={`mt-1 block text-[14px] leading-relaxed ${checked ? "text-[var(--th-muted)] line-through" : "text-[var(--th-text)]"}`}>{step.detail}</span>
                          </span>
                          {step.date ? (
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-[12.5px] font-semibold ${
                                index === current ? "bg-[var(--th-sky-bg)] text-[var(--th-sky)]" : "bg-[var(--th-soft)] text-[var(--th-muted)]"
                              }`}
                            >
                              {shortDate(step.date)}
                            </span>
                          ) : null}
                        </label>
                      </li>
                    );
                  })}
                </ol>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={!datedSteps && !task.dueDate}
                    onClick={() => {
                      const { added } = addTaskToPlan(task);
                      setToast(added > 0 ? "დაემატა კალენდარში და სასწავლო გეგმაში" : "დასამატებელი თარიღი არ არის");
                    }}
                    className="th-secondary th-focus h-11 px-5 text-[14.5px]"
                  >
                    <CalendarPlus className="h-4 w-4" aria-hidden />
                    სასწავლო გეგმაში დამატება
                  </button>
                  {!datedSteps && !task.dueDate ? <span className="text-[13px] text-[var(--th-muted)]">ჩაბარების თარიღი არ არის მითითებული</span> : null}
                </div>
              </section>
            ) : null}

            {result.ideas?.length ? (
              <section id="th-ideas" className="scroll-mt-[calc(var(--site-header-h)+72px)]">
                <div className="px-1">
                  <SectionTitle>იდეები</SectionTitle>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-3">
                  {result.ideas.map((idea, index) => {
                    const chosen = task.chosenIdea === index;
                    return (
                      <article
                        key={`${index}-${idea.title}`}
                        className={`flex flex-col gap-3 rounded-[24px] bg-[var(--th-card)] p-4 sm:p-5 ${chosen ? "border-2 border-[var(--th-strong)]" : "border border-[var(--th-border)]"}`}
                      >
                        <h3 className="text-[16px] font-bold leading-snug text-[var(--th-title)]">{idea.title}</h3>
                        <p className="text-[14px] leading-relaxed text-[var(--th-text)]">{idea.description}</p>
                        {idea.tags.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {idea.tags.map((tag) => (
                              <span key={tag} className="rounded-full bg-[var(--th-sky-bg)] px-2.5 py-1 text-[12.5px] font-semibold text-[var(--th-sky)]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <button
                          type="button"
                          aria-pressed={chosen}
                          onClick={() => chooseTaskIdea(task.id, chosen ? null : index)}
                          className={`th-focus mt-auto inline-flex h-10 w-fit items-center gap-1.5 rounded-full text-[14px] font-bold ${chosen ? "text-[var(--th-title)]" : "text-[#e11d74] hover:underline"}`}
                        >
                          {chosen ? (
                            <>
                              <Check className="h-4 w-4" strokeWidth={2.6} aria-hidden />
                              არჩეულია
                            </>
                          ) : (
                            <>
                              ამას ავირჩევ
                              <ArrowRight className="h-4 w-4" aria-hidden />
                            </>
                          )}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {result.tips?.length ? (
              <section id="th-tips" className="th-card scroll-mt-[calc(var(--site-header-h)+72px)] p-4 sm:p-6">
                <SectionTitle>რჩევები</SectionTitle>
                <ul className="mt-4 flex flex-col gap-3">
                  {result.tips.map((tip) => (
                    <li key={tip.label} className="text-[14.5px] leading-relaxed text-[var(--th-text)]">
                      <b className="text-[var(--th-title)]">{tip.label}.</b> {tip.text}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {result.presentation?.slides.length ? (
              <section id="th-presentation" className="th-card scroll-mt-[calc(var(--site-header-h)+72px)] p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <SectionTitle>პრეზენტაციის სტრუქტურა</SectionTitle>
                  <button type="button" onClick={() => router.push(presentationFromTask(task))} className="th-primary th-focus h-11 px-5 text-[14.5px]">
                    <PresentationIcon className="h-4 w-4" aria-hidden />
                    პრეზენტაციის შექმნა
                  </button>
                </div>
                <ol className="mt-4 grid gap-3 sm:grid-cols-2">
                  {result.presentation.slides.map((slide, index) => (
                    <li key={`${index}-${slide.title}`} className="rounded-[18px] border border-[var(--th-border)] p-4">
                      <p className="text-[12.5px] font-bold text-[var(--th-sky)]">
                        სლაიდი {index + 1} · {slide.minutes} წთ
                      </p>
                      <p className="mt-1 text-[15px] font-bold leading-snug text-[var(--th-title)]">{slide.title}</p>
                      <blockquote className="mt-2 border-l-2 border-[var(--th-sky-line)] pl-3 text-[14px] italic leading-relaxed text-[var(--th-text)]">{slide.say}</blockquote>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            <TaskChat task={task} />
          </div>
        </div>
      </div>
      {toast ? <Toast message={toast} onClose={closeToast} duration={3500} /> : null}
    </div>
  );
}
