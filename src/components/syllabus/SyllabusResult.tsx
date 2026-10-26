"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import type { SyllabusMilestone, SyllabusMilestoneType } from "@/lib/syllabus-calendar";
import {
  daysFrom,
  groupByMonth,
  normalizeSyllabusDate,
  sortSyllabusDates,
  syllabusCounts,
  weekPlan,
  type SyllabusDate,
} from "@/lib/syllabus-dates";

export const SY_FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sy-accent)]/40";

export type SyllabusPick = "plan" | "exams" | "quizzes" | "deadlines";

export const PICKS: { id: SyllabusPick; label: string; dot: string }[] = [
  { id: "plan", label: "სემესტრის გეგმა", dot: "var(--sy-dot-plan)" },
  { id: "exams", label: "გამოცდები", dot: "var(--sy-dot-exam)" },
  { id: "quizzes", label: "ქვიზები", dot: "var(--sy-dot-quiz)" },
  { id: "deadlines", label: "დავალებები", dot: "var(--sy-dot-due)" },
];

const PICK_OF: Record<SyllabusMilestoneType, SyllabusPick> = {
  midterm: "exams",
  final: "exams",
  quiz: "quizzes",
  deadline: "deadlines",
  study: "plan",
};

const TYPE: Record<SyllabusMilestoneType, { label: string; badge: string }> = {
  midterm: { label: "შუალედური", badge: "bg-[var(--sy-exam-bg)] text-[var(--sy-exam)]" },
  final: { label: "ფინალური", badge: "bg-[var(--sy-exam-bg)] text-[var(--sy-exam)]" },
  quiz: { label: "ქვიზი", badge: "bg-[var(--sy-quiz-bg)] text-[var(--sy-quiz)]" },
  deadline: { label: "დავალება", badge: "bg-[var(--sy-due-bg)] text-[var(--sy-due)]" },
  study: { label: "სასწავლო დღე", badge: "bg-[var(--sy-plan-bg)] text-[var(--sy-plan)]" },
};

const SOON_DAYS = 3;

/** One date: a badge (day + month, or the week), the title, „ტიპი · წონა · N დღეში“ and ⋯ to fix or remove it. */
function DateRow({
  item,
  today,
  onChangeDate,
  onDelete,
}: {
  item: SyllabusDate;
  today: string;
  onChangeDate: (id: string, date: string) => void;
  onDelete: (id: string) => void;
}) {
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.date ?? "");
  const menuRef = useRef<HTMLDivElement>(null);
  const type = TYPE[item.type];
  const days = item.date ? daysFrom(today, item.date) : null;
  const soon = days !== null && days >= 0 && days <= SOON_DAYS;
  const [day, month] = item.date ? item.label.split(" ") : [item.week ? String(item.week) : "?", item.week ? "კვ." : ""];

  useEffect(() => {
    if (!menu) return;
    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenu(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const meta = [
    type.label,
    item.weight !== null ? `${item.weight}%` : null,
    days === null ? (item.week ? `მე-${item.week} კვირა` : "თარიღი უცნობია") : days === 0 ? "დღეს" : days > 0 ? `${days} დღეში` : null,
  ].filter(Boolean);

  return (
    <li className="group relative flex items-center gap-3 px-3.5 py-3 sm:px-4" data-syllabus-row={item.id}>
      <span className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[12px] leading-none ${type.badge}`} aria-hidden>
        <span className="text-[15px] font-bold tabular-nums">{day}</span>
        <span className="mt-0.5 text-[10.5px] font-semibold">{month}</span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-semibold text-[var(--sy-strong)]">{item.title}</p>
        {editing ? (
          <form
            className="mt-1 flex items-center gap-1.5"
            onSubmit={(event) => {
              event.preventDefault();
              if (draft) onChangeDate(item.id, draft);
              setEditing(false);
            }}
          >
            <input
              type="date"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              aria-label={`${item.title}: თარიღი`}
              autoFocus
              className="h-8 rounded-[10px] border border-[var(--sy-field-border)] bg-[var(--sy-field)] px-2 text-[16px] text-[var(--sy-strong)] outline-none focus:border-[var(--sy-strong)] sm:text-[13px]"
            />
            <button type="submit" aria-label="შენახვა" className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--sy-ok)] hover:bg-[var(--sy-soft)] ${SY_FOCUS}`}>
              <Check className="h-4 w-4" strokeWidth={2.6} />
            </button>
            <button type="button" onClick={() => setEditing(false)} aria-label="გაუქმება" className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--sy-muted)] hover:bg-[var(--sy-soft)] ${SY_FOCUS}`}>
              <X className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <p className="mt-0.5 truncate text-[12.5px] text-[var(--sy-muted)]">{meta.join(" · ")}</p>
        )}
      </div>
      {soon ? <span className="shrink-0 text-[12px] font-bold text-[var(--sy-soon)]">მალე</span> : null}
      <div ref={menuRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setMenu((open) => !open)}
          aria-label={`მოქმედებები: ${item.title}`}
          aria-haspopup="menu"
          aria-expanded={menu}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--sy-muted)] transition-opacity hover:bg-[var(--sy-soft)] hover:text-[var(--sy-strong)] [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100 ${
            menu ? "!opacity-100" : ""
          } ${SY_FOCUS}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menu ? (
          <div role="menu" className="absolute right-0 top-9 z-20 w-48 rounded-[14px] border border-[var(--sy-field-border)] bg-[var(--sy-card)] p-1.5 text-[13.5px] shadow-[0_12px_32px_-12px_rgb(0_0_0/0.35)]">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenu(false);
                setDraft(item.date ?? "");
                setEditing(true);
              }}
              className={`flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-[var(--sy-strong)] hover:bg-[var(--sy-soft)] ${SY_FOCUS}`}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              თარიღის შესწორება
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenu(false);
                onDelete(item.id);
              }}
              className={`flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 ${SY_FOCUS}`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              წაშლა
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h3 className="mb-2 px-1 text-[12.5px] font-bold text-[var(--sy-muted)]">{label}</h3>
      <ul className="divide-y divide-[var(--sy-divider)] rounded-[16px] bg-[var(--sy-list)]">{children}</ul>
    </section>
  );
}

type Filter = "all" | Exclude<SyllabusPick, "plan">;

/**
 * The analysis: four count tiles, „ვადები“ (by month, upcoming first, past
 * folded) and „კვირების გეგმა“ (week by week), with filters by kind.
 */
export function SyllabusResult({
  milestones,
  picks,
  today,
  onChangeDate,
  onDelete,
}: {
  milestones: SyllabusMilestone[];
  picks: Set<SyllabusPick>;
  today: string;
  onChangeDate: (id: string, date: string) => void;
  onDelete: (id: string) => void;
}) {
  const [tab, setTab] = useState<"dates" | "weeks">("dates");
  const [filter, setFilter] = useState<Filter>("all");
  const [pastOpen, setPastOpen] = useState(false);
  const shown = milestones.filter((item) => item.type === "study" || picks.has(PICK_OF[item.type]));
  const dated = shown.map((item) => normalizeSyllabusDate(item));
  const counts = syllabusCounts(dated);
  const filtered = filter === "all" ? dated : dated.filter((item) => PICK_OF[item.type] === filter);
  const list = sortSyllabusDates(filtered, today);
  const weeks = weekPlan(shown);
  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "ყველა" },
    ...PICKS.filter((pick) => pick.id !== "plan" && picks.has(pick.id)).map((pick) => ({ id: pick.id as Filter, label: pick.label })),
  ];

  const tiles = [
    { label: "სულ თარიღი", value: counts.total, tone: "bg-[var(--sy-soft)] text-[var(--sy-strong)]" },
    { label: "გამოცდა", value: counts.exams, tone: "bg-[var(--sy-exam-bg)] text-[var(--sy-exam)]" },
    { label: "ქვიზი", value: counts.quizzes, tone: "bg-[var(--sy-quiz-bg)] text-[var(--sy-quiz)]" },
    { label: "დავალება", value: counts.deadlines, tone: "bg-[var(--sy-due-bg)] text-[var(--sy-due)]" },
  ];

  const row = (item: SyllabusDate) => <DateRow key={`${item.id}:${item.date ?? ""}`} item={item} today={today} onChangeDate={onChangeDate} onDelete={onDelete} />;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className={`rounded-[14px] px-4 py-3 ${tile.tone}`}>
            <p className="text-[22px] font-bold tabular-nums leading-tight">{tile.value}</p>
            <p className="text-[12.5px] font-medium opacity-90">{tile.label}</p>
          </div>
        ))}
      </div>

      <div role="tablist" aria-label="ხედი" className="mt-5 flex gap-1 rounded-[14px] bg-[var(--sy-soft)] p-1 max-sm:w-full sm:inline-flex">
        {(
          [
            ["dates", "ვადები"],
            ...(picks.has("plan") ? ([["weeks", "კვირების გეგმა"]] as const) : []),
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`h-9 flex-1 whitespace-nowrap rounded-[10px] px-4 text-[13.5px] transition-colors ${SY_FOCUS} ${
              tab === id ? "bg-[var(--sy-card)] font-bold text-[var(--sy-strong)] shadow-[0_1px_3px_rgba(0,0,0,0.12)]" : "font-medium text-[var(--sy-muted)] hover:text-[var(--sy-strong)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "dates" || !picks.has("plan") ? (
        <div>
          {filters.length > 2 ? (
            <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={filter === item.id}
                  onClick={() => setFilter(item.id)}
                  className={`inline-flex h-8 shrink-0 items-center rounded-full px-3.5 text-[13px] font-semibold transition-colors ${SY_FOCUS} ${
                    filter === item.id
                      ? "bg-[var(--sy-chip-on)] text-[var(--sy-chip-on-text)]"
                      : "border border-[var(--sy-field-border)] bg-[var(--sy-field)] text-[var(--sy-strong)] hover:border-[var(--sy-muted)]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}

          {list.upcoming.length === 0 && list.undated.length === 0 ? (
            <p className="mt-5 text-[14px] text-[var(--sy-muted)]">მომავალი თარიღი აქ აღარ არის.</p>
          ) : null}
          {groupByMonth(list.upcoming).map((group) => (
            <Group key={group.month} label={group.month}>
              {group.items.map(row)}
            </Group>
          ))}
          {list.undated.length > 0 ? <Group label="თარიღის გარეშე">{list.undated.map(row)}</Group> : null}
          {list.past.length > 0 ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setPastOpen((open) => !open)}
                aria-expanded={pastOpen}
                className={`flex w-full items-center justify-between rounded-[14px] bg-[var(--sy-list)] px-4 py-3 text-left text-[13.5px] font-semibold text-[var(--sy-muted)] ${SY_FOCUS}`}
              >
                გასული · {list.past.length}
                <ChevronDown className={`h-4 w-4 transition-transform ${pastOpen ? "rotate-180" : ""}`} aria-hidden />
              </button>
              {pastOpen ? <ul className="mt-2 divide-y divide-[var(--sy-divider)] rounded-[16px] bg-[var(--sy-list)] opacity-75">{list.past.map(row)}</ul> : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-4">
          {weeks.length === 0 ? (
            <p className="text-[14px] text-[var(--sy-muted)]">სილაბუსში კვირების მიხედვით გეგმა ვერ ვიპოვე.</p>
          ) : (
            <ol className="divide-y divide-[var(--sy-divider)] rounded-[16px] bg-[var(--sy-list)]">
              {weeks.map((week) => (
                <li key={week.week} className="flex gap-3 px-4 py-3">
                  <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[12px] bg-[var(--sy-plan-bg)] leading-none text-[var(--sy-plan)]" aria-hidden>
                    <span className="text-[15px] font-bold tabular-nums">{week.week}</span>
                    <span className="mt-0.5 text-[10.5px] font-semibold">კვ.</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[var(--sy-muted)]">
                      კვირა {week.week}
                      {week.monday ? ` · ${normalizeSyllabusDate({ id: "", title: "", date: week.monday, type: "study" }).label}-დან` : ""}
                    </p>
                    <ul className="mt-1 space-y-1">
                      {week.items.map((item) => (
                        <li key={item.id} className="text-[14.5px] text-[var(--sy-strong)]">
                          <span className="font-semibold">{item.title}</span>
                          {item.topic ? <span className="text-[var(--sy-muted)]"> — {item.topic}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
