"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { setMobileOverlay } from "@/lib/mobile-overlay";
import type { SyllabusMilestoneType } from "@/lib/syllabus-calendar";
import { daysFrom, groupByMonth, type SyllabusDate, type SyllabusDateList } from "@/lib/syllabus-dates";
import { SP_CARD, SP_FOCUS } from "./planner-styles";

const TYPE: Record<SyllabusMilestoneType, { label: string; badge: string }> = {
  midterm: { label: "შუალედური", badge: "bg-[var(--sp-exam-bg)] text-[var(--sp-exam-text)]" },
  final: { label: "ფინალური", badge: "bg-[var(--sp-exam-bg)] text-[var(--sp-exam-text)]" },
  deadline: { label: "დედლაინი", badge: "bg-[var(--sp-due-bg)] text-[var(--sp-due-text)]" },
  quiz: { label: "ქვიზი", badge: "bg-[var(--sp-quiz-bg)] text-[var(--sp-quiz-text)]" },
  study: { label: "სასწავლო დღე", badge: "bg-[var(--sp-soft)] text-[var(--sp-muted)]" },
};

/** One date: a badge (day + month, or the week) beside the title and when. */
function DateRow({ item, today }: { item: SyllabusDate; today: string }) {
  const type = TYPE[item.type];
  const [day, month] = item.date ? item.label.split(" ") : [item.week ? `${item.week}` : "?", item.week ? "კვ." : ""];
  const days = item.date ? daysFrom(today, item.date) : null;
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[12px] leading-none ${type.badge}`} aria-hidden>
        <span className="text-[15px] font-bold tabular-nums">{day}</span>
        <span className="mt-0.5 text-[10.5px] font-semibold">{month}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold text-[var(--sp-strong)]">{item.title}</span>
        <span className="block text-[12.5px] text-[var(--sp-muted)]">
          {type.label}
          {days === null ? "" : days === 0 ? " · დღეს" : days > 0 ? ` · ${days} დღეში` : ""}
          {item.date ? null : <span className="sr-only">, {item.label}</span>}
        </span>
      </span>
    </div>
  );
}

/** The full list: by month, the undated ones, and the past folded away. */
function AllDates({ list, today, onClose }: { list: SyllabusDateList; today: string; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOverlay("syllabus-dates", true);
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      setMobileOverlay("syllabus-dates", false);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70]">
      <button type="button" aria-label="დახურვა" onClick={onClose} className="absolute inset-0 bg-black/30" />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="სილაბუსის თარიღები"
        className="sp absolute inset-x-0 bottom-0 flex max-h-[82dvh] flex-col rounded-t-[22px] bg-[var(--sp-card)] outline-none md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[400px] md:rounded-none md:rounded-l-[22px]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--sp-card-border)] px-5 py-4">
          <p className="text-[16px] font-bold text-[var(--sp-strong)]">სილაბუსის თარიღები</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="დახურვა"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--sp-line)] text-[var(--sp-strong)] ${SP_FOCUS}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-2">
          {groupByMonth(list.upcoming).map((group) => (
            <section key={group.month} className="mt-4">
              <h3 className="text-[12.5px] font-semibold text-[var(--sp-muted)]">{group.month}</h3>
              <ul className="mt-2.5 space-y-3">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <DateRow item={item} today={today} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {list.undated.length > 0 ? (
            <section className="mt-5">
              <h3 className="text-[12.5px] font-semibold text-[var(--sp-muted)]">თარიღის გარეშე</h3>
              <ul className="mt-2.5 space-y-3">
                {list.undated.map((item) => (
                  <li key={item.id}>
                    <DateRow item={item} today={today} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {list.past.length > 0 ? (
            <details className="mt-5 rounded-[14px] border border-[var(--sp-card-border)] px-4 py-3">
              <summary className={`cursor-pointer rounded text-[13.5px] font-semibold text-[var(--sp-muted)] ${SP_FOCUS}`}>
                გასული ({list.past.length})
              </summary>
              <ul className="mt-3 space-y-3 opacity-70">
                {list.past.map((item) => (
                  <li key={item.id}>
                    <DateRow item={item} today={today} />
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * „უახლოესი სილაბუსიდან“: the chosen subject's next dates (3 on wide
 * screens, 1 on phones) and the whole list in a drawer. An older syllabus
 * saved without a subject asks to be bound to one first.
 */
export function SyllabusDatesCard({
  subject,
  list,
  today,
  unboundCount,
  subjects,
  onBind,
}: {
  subject: string;
  list: SyllabusDateList | null;
  today: string;
  /** Dates of a syllabus saved before subjects: not shown until bound. */
  unboundCount: number;
  subjects: string[];
  onBind: (subject: string) => void;
}) {
  const [allOpen, setAllOpen] = useState(false);
  const closeAll = useCallback(() => setAllOpen(false), []);
  const total = list ? list.upcoming.length + list.undated.length : 0;
  const next = list?.upcoming ?? [];

  return (
    <aside aria-label="სილაბუსი" className="flex min-w-0 flex-col gap-3">
      {unboundCount > 0 ? (
        <Alert
          tone="info"
          title="ეს სილაბუსი საგანს არ აქვს მიბმული"
          action={
            <select
              aria-label="მიაბი საგანს"
              defaultValue=""
              onChange={(event) => event.target.value && onBind(event.target.value)}
              className="h-9 max-w-full rounded-full border border-current/20 bg-white px-3 text-[13px] font-semibold text-slate-900 dark:bg-white/10 dark:text-slate-100"
            >
              <option value="">მიაბი საგანს…</option>
              {subjects.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          }
        >
          {unboundCount} თარიღი გეგმაში არ ჩანს, სანამ საგანს არ მიაბამ.
        </Alert>
      ) : null}

      {!subject.trim() ? null : !list || (total === 0 && list.past.length === 0) ? (
        <Link
          href="/syllabus"
          className={`inline-flex items-center gap-1 self-start rounded-full px-1 py-1 text-[13.5px] font-semibold text-[var(--sp-accent)] hover:underline ${SP_FOCUS}`}
        >
          ატვირთე სილაბუსი, რომ თარიღები აქ გამოჩნდეს
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <section className={`${SP_CARD} p-5`}>
          <h2 className="text-[13px] font-semibold text-[var(--sp-muted)]">უახლოესი სილაბუსიდან</h2>
          {next.length === 0 ? (
            <p className="mt-3 text-[14px] text-[var(--sp-muted)]">მომავალი თარიღები სილაბუსში აღარ არის.</p>
          ) : (
            <ul className="mt-3 space-y-3.5">
              {next.slice(0, 3).map((item, index) => (
                // Phones: just the nearest one.
                <li key={item.id} className={index > 0 ? "max-md:hidden" : ""}>
                  <DateRow item={item} today={today} />
                </li>
              ))}
            </ul>
          )}
          {total + list.past.length > 0 ? (
            <button
              type="button"
              onClick={() => setAllOpen(true)}
              className={`mt-4 inline-flex items-center gap-1 rounded-full text-[13.5px] font-semibold text-[var(--sp-accent)] hover:underline ${SP_FOCUS}`}
            >
              <span className="md:hidden">კიდევ {Math.max(0, total - 1)} თარიღი</span>
              <span className="max-md:hidden">ყველა {total} თარიღი</span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </section>
      )}

      {allOpen && list ? <AllDates list={list} today={today} onClose={closeAll} /> : null}
    </aside>
  );
}
