"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Check, Flame, MoreHorizontal, Pin, Plus, Sparkles } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import { generateDailyGoals } from "@/lib/goals";
import {
  GOAL_CATEGORIES,
  GOAL_CATEGORY_COLOR,
  GOAL_CATEGORY_LABEL,
  GOAL_MINUTES,
  VISIBLE_GOALS,
  carryOver,
  goalMotivation,
  goalSuggestions,
  goalsForDay,
  unfinishedYesterday,
  type GoalMotivation,
  type GoalSuggestion,
} from "@/lib/goals-card";
import { DASHBOARD_GOALS_STORAGE_KEY, type DailyGoal, type GoalCategory } from "@/lib/profile";
import {
  DAILY_GOALS_UPDATED_EVENT,
  loadDailyGoals,
  readSuggestionSources,
  saveDailyGoals,
} from "@/lib/daily-goals";
import { getCurrentStreak, hasActivityToday, recordDailyActivity, STREAK_UPDATED_EVENT } from "@/lib/daily-streak";
import { readSemesterSubjects } from "@/lib/semester-subjects";
import { localToday } from "@/lib/study-plan-board";
import { userStore } from "@/lib/user-data";
import { DASHBOARD_GOALS_TOGGLE_EVENT } from "@/lib/user-data-keys";
import "./goals-card.css";

interface DailyGoalsProps {
  title?: string;
  /** The profile pages' 📌: show the card on the dashboard too. */
  showDashboardToggle?: boolean;
}

const MAX_GOAL_LENGTH = 120;
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--goals-focus)]/45";

/**
 * The day's goals in one card: a progress ring with what finishing means for
 * the streak, the list (done ones sink), an inline field with named
 * categories, and one-tap suggestions from the plan, the syllabus and the
 * flashcards. Used on the student dashboard and on both profile overviews.
 */
export function DailyGoals({ title = "დღის მიზნები", showDashboardToggle = false }: DailyGoalsProps) {
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [today, setToday] = useState("");
  const [streak, setStreak] = useState({ days: 0, activeToday: false });
  const [suggestions, setSuggestions] = useState<GoalSuggestion[]>([]);
  const [composer, setComposer] = useState<null | "open" | "closed">(null);
  const [focusComposer, setFocusComposer] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [onDashboard, setOnDashboard] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState<{ goal: DailyGoal; index: number } | null>(null);

  const sync = useCallback(() => {
    const day = localToday();
    const all = loadDailyGoals();
    setToday(day);
    setGoals(all);
    setStreak({ days: getCurrentStreak(), activeToday: hasActivityToday() });
    setSuggestions(goalSuggestions(readSuggestionSources(day), all, day));
  }, []);

  useEffect(() => {
    const init = () => {
      sync();
      if (showDashboardToggle) setOnDashboard(window.localStorage.getItem(DASHBOARD_GOALS_STORAGE_KEY) === "1");
    };
    init();
    // The toggle changed on another device.
    const syncToggle = () => {
      if (showDashboardToggle) setOnDashboard(window.localStorage.getItem(DASHBOARD_GOALS_STORAGE_KEY) === "1");
    };
    window.addEventListener(DAILY_GOALS_UPDATED_EVENT, sync);
    window.addEventListener(STREAK_UPDATED_EVENT, sync);
    window.addEventListener(DASHBOARD_GOALS_TOGGLE_EVENT, syncToggle);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DAILY_GOALS_UPDATED_EVENT, sync);
      window.removeEventListener(STREAK_UPDATED_EVENT, sync);
      window.removeEventListener(DASHBOARD_GOALS_TOGGLE_EVENT, syncToggle);
      window.removeEventListener("storage", sync);
    };
  }, [showDashboardToggle, sync]);

  const commit = (next: DailyGoal[]) => {
    setGoals(next);
    saveDailyGoals(next);
  };

  const todays = today ? goalsForDay(goals, today) : [];
  const doneCount = todays.filter((goal) => goal.done).length;
  const leftOver = today ? unfinishedYesterday(goals, today) : [];
  const motivation = goalMotivation({ total: todays.length, done: doneCount, streak: streak.days, activeToday: streak.activeToday });
  const composerOpen = composer === "open" || (composer === null && today !== "" && todays.length === 0);
  const visible = expanded ? todays : todays.slice(0, VISIBLE_GOALS);
  const hidden = todays.length - visible.length;

  const toggleGoal = (id: string) => {
    const next = goals.map((goal) => (goal.id === id ? { ...goal, done: !goal.done } : goal));
    commit(next);
    const day = goalsForDay(next, today);
    const finishedNow = day.length > 0 && day.every((goal) => goal.done) && !todays.every((goal) => goal.done);
    if (finishedNow) {
      // Every goal done: the day counts for the streak (once a day; unticking
      // later doesn't take it back).
      recordDailyActivity();
      confetti({
        particleCount: 60,
        spread: 65,
        startVelocity: 30,
        scalar: 0.85,
        origin: { x: 0.5, y: 0.4 },
        colors: ["#ec4899", "#38bdf8", "#facc15", "#4ade80"],
        disableForReducedMotion: true,
      });
    }
  };

  const addGoal = (text: string, type: GoalCategory, minutes?: number, source?: string) => {
    const clean = text.trim().slice(0, MAX_GOAL_LENGTH);
    if (!clean || !today) return;
    const goal: DailyGoal = { id: crypto.randomUUID(), text: clean, done: false, type, date: today };
    if (minutes) goal.minutes = minutes;
    if (source) goal.source = source;
    commit([...goals, goal]);
    if (source) setSuggestions((list) => list.filter((item) => item.key !== source));
  };

  const editGoal = (id: string, text: string) => {
    const clean = text.trim().slice(0, MAX_GOAL_LENGTH);
    if (!clean) return;
    commit(goals.map((goal) => (goal.id === id ? { ...goal, text: clean } : goal)));
  };

  const deleteGoal = (id: string) => {
    const index = goals.findIndex((goal) => goal.id === id);
    if (index < 0) return;
    setRemoved({ goal: goals[index], index });
    commit(goals.filter((goal) => goal.id !== id));
  };

  const undoDelete = () => {
    if (!removed) return;
    const next = [...goals];
    next.splice(Math.min(removed.index, next.length), 0, removed.goal);
    commit(next);
    setRemoved(null);
  };

  const toggleDashboard = () => {
    const next = !onDashboard;
    setOnDashboard(next);
    userStore.set(DASHBOARD_GOALS_STORAGE_KEY, next ? "1" : "0");
  };

  const openComposer = () => {
    setComposer(composerOpen ? "closed" : "open");
    setFocusComposer(!composerOpen);
  };

  const generateAiGoals = async () => {
    setAiLoading(true);
    setError(null);
    try {
      const subjectNames = readSemesterSubjects()
        .subjects.map((s) => s.name)
        .slice(0, 4);
      const aiGoals = await generateDailyGoals({
        studyPlan: subjectNames.length > 0 ? `სემესტრის საგნები: ${subjectNames.join(", ")}` : "ზოგადი მომზადება",
        weakSubjects: subjectNames.join(", "),
      });
      commit([...goals, ...aiGoals]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI ამჟამად მიუწვდომელია. სცადე კიდევ ერთხელ.");
    } finally {
      setAiLoading(false);
    }
  };

  const pin = showDashboardToggle ? (
    <button
      type="button"
      onClick={toggleDashboard}
      aria-pressed={onDashboard}
      aria-label="დეშბორდზე ჩვენება"
      title={onDashboard ? "ჩანს დეშბორდზე — დააჭირე მოსახსნელად" : "დეშბორდზე ჩვენება"}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${FOCUS} ${
        onDashboard
          ? "border-[var(--goals-focus)]/40 bg-[var(--goals-focus)]/10 text-[var(--goals-focus)]"
          : "border-[var(--goals-field-border)] text-[var(--goals-muted)] hover:border-[var(--goals-hover)] hover:text-[var(--goals-text)]"
      }`}
    >
      <Pin className={`h-4 w-4 ${onDashboard ? "fill-current" : ""}`} strokeWidth={1.75} aria-hidden />
    </button>
  ) : null;

  return (
    <section className="goals-card rounded-[24px] border border-[var(--goals-border)] p-4 md:px-[26px] md:py-6" aria-label={title}>
      {/* Phones: a compact strip — small ring, title and the line, „+“. */}
      <div className="flex items-center gap-3 md:hidden">
        <GoalsRing done={doneCount} total={todays.length} size={64} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-bold leading-tight">{title}</h2>
          <p className="mt-0.5 text-[12.5px] leading-snug">
            <MotivationLine motivation={motivation} />
          </p>
        </div>
        {pin}
        <button
          type="button"
          onClick={openComposer}
          aria-label="ახალი მიზანი"
          aria-expanded={composerOpen}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--goals-field-border)] text-[var(--goals-text)] transition-colors hover:border-[var(--goals-hover)] ${FOCUS}`}
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden />
        </button>
      </div>

      <div className="md:flex md:gap-7">
        <div className="hidden w-[220px] shrink-0 flex-col items-center justify-center gap-4 border-r border-[var(--goals-divider)] pr-6 md:flex">
          <GoalsRing done={doneCount} total={todays.length} size={150} />
          <p className="text-center text-[13.5px] leading-snug">
            <MotivationLine motivation={motivation} />
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <div className="hidden items-center justify-between gap-3 md:flex">
            <h2 className="text-[19px] font-bold">{title}</h2>
            <div className="flex items-center gap-2">
              {pin}
              <button
                type="button"
                onClick={openComposer}
                aria-expanded={composerOpen}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--goals-field-border)] px-3.5 text-[13.5px] font-semibold text-[var(--goals-text)] transition-colors hover:border-[var(--goals-hover)] ${FOCUS}`}
              >
                <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden />
                ახალი
              </button>
            </div>
          </div>

          {leftOver.length > 0 ? (
            <button
              type="button"
              onClick={() => commit(carryOver(goals, today))}
              className={`mt-3 rounded-sm text-left text-[12.5px] text-[var(--goals-muted)] ${FOCUS}`}
            >
              გუშინდელი {leftOver.length} შეუსრულებელი →{" "}
              <span className="font-semibold text-[var(--goals-link)] underline-offset-4 hover:underline">გადმოტანა</span>
            </button>
          ) : null}

          {composerOpen ? (
            <GoalComposer
              autoFocus={focusComposer}
              onAdd={(text, type, minutes) => addGoal(text, type, minutes)}
              onClose={() => {
                setComposer("closed");
                setFocusComposer(false);
              }}
            />
          ) : null}

          {todays.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2">
              {visible.map((goal) => (
                <GoalRow key={goal.id} goal={goal} onToggle={toggleGoal} onEdit={editGoal} onDelete={deleteGoal} />
              ))}
            </ul>
          ) : null}
          {todays.length > VISIBLE_GOALS ? (
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              aria-expanded={expanded}
              className={`mt-2 rounded-sm text-[13px] font-semibold text-[var(--goals-muted)] hover:text-[var(--goals-text)] ${FOCUS}`}
            >
              {expanded ? "ნაკლების ჩვენება" : `კიდევ ${hidden}`}
            </button>
          ) : null}

          {suggestions.length > 0 ? (
            <div className="mt-4">
              <p className="text-[12.5px] font-semibold text-[var(--goals-muted)]">შეთავაზებები გეგმიდან</p>
              <div className="goals-scroll -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
                {suggestions.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => addGoal(item.text, item.type, item.minutes, item.key)}
                    className={`inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed border-[var(--suggest-border)] bg-transparent px-3 text-[13px] font-medium text-[var(--goals-text)] transition-colors hover:border-[var(--goals-muted)] ${FOCUS}`}
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.6} style={{ color: GOAL_CATEGORY_COLOR[item.type] }} aria-hidden />
                    {item.text}
                    {item.minutes ? <span className="text-[var(--goals-muted)]">· {item.minutes} წთ</span> : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {today && todays.length === 0 ? (
            <button
              type="button"
              onClick={generateAiGoals}
              disabled={aiLoading}
              className={`mt-3 inline-flex h-8 items-center gap-1.5 rounded-full text-[13px] font-semibold text-[var(--goals-link)] disabled:opacity-60 ${FOCUS}`}
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              {aiLoading ? "გენერირდება..." : "AI-ით შედგენა"}
            </button>
          ) : null}

          {error ? (
            <p role="alert" className="mt-2 text-[13px] text-rose-700 dark:text-rose-300">
              {error}{" "}
              <button type="button" onClick={generateAiGoals} className="font-semibold underline">
                კვლავ სცადე
              </button>
            </p>
          ) : null}
        </div>
      </div>

      {removed ? (
        <Toast message="მიზანი წაიშალა" actionLabel="დაბრუნება" onAction={undoDelete} onClose={() => setRemoved(null)} />
      ) : null}
    </section>
  );
}

const RING_R = 62;
const RING_C = 2 * Math.PI * RING_R;

function GoalsRing({ done, total, size }: { done: number; total: number; size: number }) {
  const share = total > 0 ? done / total : 0;
  const big = size >= 100;
  return (
    <div role="img" aria-label={`შესრულებულია ${done} ${total}-დან`} className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 150 150" width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx="75" cy="75" r={RING_R} fill="none" stroke="var(--ring-track)" strokeWidth={big ? 12 : 14} />
        <circle
          className="goals-ring-fill"
          cx="75"
          cy="75"
          r={RING_R}
          fill="none"
          stroke="var(--ring-fill)"
          strokeWidth={big ? 12 : 14}
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={RING_C * (1 - share)}
          opacity={share > 0 ? 1 : 0}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
        <span className={`font-bold tabular-nums leading-none ${big ? "text-[32px]" : "text-[16px]"}`}>
          {done}/{total}
        </span>
        {big ? <span className="mt-1 text-[12.5px] text-[var(--goals-muted)]">დღეს</span> : null}
      </div>
    </div>
  );
}

function MotivationLine({ motivation }: { motivation: GoalMotivation }) {
  switch (motivation.kind) {
    case "empty":
      return <span className="text-[var(--goals-muted)]">დაამატე პირველი მიზანი</span>;
    case "all-done":
      return <span className="font-semibold text-[var(--goals-ok)]">დღის მიზნები შესრულდა ✓</span>;
    case "streak-kept":
      return (
        <span className="text-[var(--goals-muted)]">
          დღევანდელი სტრიქი უკვე შენარჩუნებულია{" "}
          <span className="inline-flex items-center gap-0.5 whitespace-nowrap font-bold text-[var(--streak-text)]">
            <Flame className="h-3.5 w-3.5" fill="currentColor" strokeWidth={1.8} aria-hidden />
            {motivation.streak} დღე
          </span>
        </span>
      );
    case "to-go":
      return (
        <span className="text-[var(--goals-muted)]">
          კიდევ {motivation.remaining} მიზანი და{" "}
          <span className="whitespace-nowrap font-bold text-[var(--streak-text)]">სტრიქი {motivation.nextStreak} დღე</span> გახდება
        </span>
      );
  }
}

function GoalComposer({
  autoFocus,
  onAdd,
  onClose,
}: {
  autoFocus: boolean;
  onAdd: (text: string, type: GoalCategory, minutes?: number) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [type, setType] = useState<GoalCategory>("study");
  const [minutes, setMinutes] = useState<number | undefined>(undefined);
  const inputId = useId();

  const submit = () => {
    if (!text.trim()) return;
    onAdd(text, type, minutes);
    setText("");
    setMinutes(undefined);
  };

  return (
    <form
      className="mt-3"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        ახალი მიზანი
      </label>
      <input
        id={inputId}
        value={text}
        autoFocus={autoFocus}
        maxLength={MAX_GOAL_LENGTH}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          }
        }}
        placeholder="დაამატე მიზანი… მაგ. 20 წუთი ქვიზი ისტორიაში"
        className="h-12 w-full rounded-[14px] border border-[var(--goals-field-border)] bg-[var(--goals-field)] px-4 text-[15px] text-[var(--goals-text)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--goals-muted)] focus:border-[var(--goals-focus)] focus:ring-2 focus:ring-[var(--goals-focus)]/20"
      />
      <div className="goals-scroll -mx-4 mt-2.5 flex items-center gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        <div role="radiogroup" aria-label="კატეგორია" className="flex shrink-0 gap-1.5">
          {GOAL_CATEGORIES.map((category) => {
            const on = type === category;
            return (
              <button
                key={category}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setType(category)}
                className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-semibold transition-colors ${FOCUS} ${
                  on
                    ? "border-[var(--goals-chip-on)] bg-[var(--goals-chip-on)] text-[var(--goals-chip-on-text)]"
                    : "border-[var(--goals-field-border)] text-[var(--goals-text)] hover:border-[var(--goals-hover)]"
                }`}
              >
                <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: GOAL_CATEGORY_COLOR[category] }} />
                {GOAL_CATEGORY_LABEL[category]}
              </button>
            );
          })}
        </div>
        <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-[var(--goals-divider)]" />
        <div role="group" aria-label="დრო (არასავალდებულო)" className="flex shrink-0 gap-1.5">
          {GOAL_MINUTES.map((value) => {
            const on = minutes === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={on}
                onClick={() => setMinutes(on ? undefined : value)}
                className={`inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-[12.5px] font-semibold tabular-nums transition-colors ${FOCUS} ${
                  on
                    ? "border-[var(--goals-chip-on)] bg-[var(--goals-chip-on)] text-[var(--goals-chip-on-text)]"
                    : "border-[var(--goals-field-border)] text-[var(--goals-muted)] hover:border-[var(--goals-hover)]"
                }`}
              >
                {value} წთ
              </button>
            );
          })}
        </div>
      </div>
    </form>
  );
}

function GoalRow({
  goal,
  onToggle,
  onEdit,
  onDelete,
}: {
  goal: DailyGoal;
  onToggle: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goal.text);
  const menuRef = useRef<HTMLDivElement>(null);
  const color = GOAL_CATEGORY_COLOR[goal.type];

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

  const finishEdit = (save: boolean) => {
    if (save) onEdit(goal.id, draft);
    setEditing(false);
  };

  return (
    <li data-goal={goal.id} className="group flex min-h-12 items-center gap-2 rounded-[14px] bg-[var(--goals-row)] px-3.5 py-3">
      <button
        type="button"
        onClick={() => onToggle(goal.id)}
        aria-pressed={goal.done}
        aria-label={`${goal.text} (${GOAL_CATEGORY_LABEL[goal.type]})`}
        className={`relative mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors before:absolute before:-inset-[10px] before:content-[''] ${FOCUS} ${
          goal.done ? "border-[#22c55e] bg-[#22c55e] text-white" : "bg-transparent text-transparent"
        }`}
        style={goal.done ? undefined : { borderColor: color }}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
      </button>
      {editing ? (
        <input
          value={draft}
          autoFocus
          aria-label="მიზნის რედაქტირება"
          maxLength={MAX_GOAL_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => finishEdit(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") finishEdit(true);
            if (event.key === "Escape") {
              setDraft(goal.text);
              finishEdit(false);
            }
          }}
          className="h-8 min-w-0 flex-1 rounded-[10px] border border-[var(--goals-field-border)] bg-[var(--goals-field)] px-2.5 text-[15px] text-[var(--goals-text)] outline-none focus:border-[var(--goals-focus)]"
        />
      ) : (
        <span
          className={`min-w-0 flex-1 text-[15px] leading-snug line-clamp-2 ${
            goal.done ? "text-[var(--goals-done-text)] line-through" : "text-[var(--goals-text)]"
          }`}
        >
          {goal.text}
        </span>
      )}
      {goal.minutes ? <span className="shrink-0 text-[12px] tabular-nums text-[var(--goals-muted)]">{goal.minutes} წთ</span> : null}
      <div ref={menuRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setMenu((open) => !open)}
          aria-label={`მოქმედებები: ${goal.text}`}
          aria-haspopup="menu"
          aria-expanded={menu}
          className={`-my-1 flex h-8 w-8 items-center justify-center rounded-full text-[var(--goals-muted)] transition-opacity hover:text-[var(--goals-text)] ${FOCUS} ${
            menu ? "opacity-100" : "md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100"
          }`}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </button>
        {menu ? (
          <div
            role="menu"
            className="absolute right-0 top-9 z-20 w-44 rounded-[14px] border border-[var(--goals-border)] bg-[var(--goals-bg)] p-1.5 text-[13.5px] shadow-[0_12px_32px_-12px_rgb(15_23_42/0.3)]"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenu(false);
                setDraft(goal.text);
                setEditing(true);
              }}
              className={`flex w-full items-center rounded-[10px] px-3 py-2 text-left text-[var(--goals-text)] hover:bg-[var(--goals-row)] ${FOCUS}`}
            >
              რედაქტირება
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenu(false);
                onDelete(goal.id);
              }}
              className={`flex w-full items-center rounded-[10px] px-3 py-2 text-left text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 ${FOCUS}`}
            >
              წაშლა
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}
