"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  AudioLines,
  Brain,
  Check,
  Compass,
  FileText,
  Film,
  Loader2,
  MoreHorizontal,
  Pencil,
  Presentation,
  RotateCcw,
  Trash2,
  Type,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useDismiss } from "@/hooks/useDismiss";
import { deleteConspectus, getConspectusById, renameConspectus } from "@/lib/conspectus-storage";
import { deleteCustomDeck, getCustomDeckById, renameCustomDeck } from "@/lib/custom-decks";
import { saveSession, startSession } from "@/lib/flashcard-session";
import { retryDeckGeneration } from "@/lib/library/generation";
import { deckAsQuizText, materialHref, type MaterialItem, type MaterialSource } from "@/lib/library/materials";
import { deleteQuiz, renameQuiz } from "@/lib/quiz-library";
import { deleteTaskHelper, renameTaskHelper } from "@/lib/task-helper-store";
import { handOff } from "@/lib/tool-handoff";

const SOURCE_ICONS: Record<MaterialSource, LucideIcon> = {
  file: FileText,
  youtube: Video,
  presentation: Presentation,
  audio: AudioLines,
  video: Film,
  text: Type,
};

const MONTHS = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];

export function shortDate(ms: number): string {
  if (!ms) return "";
  const date = new Date(ms);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** The 38px tile with the kind of material (a quiz and an assignment show their own icon). */
export function SourceTile({ item, size = 38 }: { item: MaterialItem; size?: number }) {
  const Icon = item.kind === "quiz" ? Brain : item.kind === "task" ? Compass : SOURCE_ICONS[item.source];
  const tone = item.kind === "quiz" ? "file" : item.kind === "task" ? "task" : item.source;
  return (
    <span
      className={`lib-tile src-${tone} flex shrink-0 items-center justify-center rounded-[11px]`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
    </span>
  );
}

/** Known · to repeat · not seen yet, on one 8px bar (6px on a phone). */
function DeckBar({ known, unknown, total }: { known: number; unknown: number; total: number }) {
  const part = (value: number) => `${total > 0 ? (value / total) * 100 : 0}%`;
  return (
    <div className="flex h-1.5 overflow-hidden rounded-full bg-[var(--lib-track)] sm:h-2" aria-hidden>
      <span className="h-full bg-[var(--lib-known)]" style={{ width: part(known) }} />
      <span className="h-full bg-[var(--lib-unknown)]" style={{ width: part(unknown) }} />
    </div>
  );
}

/** The last result as a 52px ring: green from 70%, amber below. */
function ScoreRing({ correct, total }: { correct: number; total: number }) {
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  const radius = 22;
  const length = 2 * Math.PI * radius;
  const color = percent >= 70 ? "var(--lib-ok)" : "var(--lib-warn)";
  return (
    <span className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center" aria-hidden>
      <svg width="52" height="52" viewBox="0 0 52 52" className="-rotate-90">
        <circle cx="26" cy="26" r={radius} fill="none" stroke="var(--lib-track)" strokeWidth="5" />
        <circle
          cx="26"
          cy="26"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${(percent / 100) * length} ${length}`}
        />
      </svg>
      <span className="absolute text-[12.5px] font-bold text-[var(--lib-title)]">{percent}%</span>
    </span>
  );
}

const BUTTON = "lib-focus h-10 px-4 text-[14px]";

function CardMenu({ item, onRename }: { item: MaterialItem; onRename: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useDismiss(open, () => setOpen(false), panel, trigger);

  const toQuiz = () => {
    if (item.kind === "deck") {
      const deck = getCustomDeckById(item.id);
      if (deck) handOff("quiz", { title: deck.title, text: deckAsQuizText(deck) });
    } else {
      const conspectus = getConspectusById(item.id);
      if (conspectus) handOff("quiz", { title: conspectus.title, text: conspectus.content });
    }
    router.push("/quiz?tab=new");
  };

  const remove = () => {
    if (item.kind === "deck") deleteCustomDeck(item.id);
    else if (item.kind === "quiz") deleteQuiz(item.id);
    else if (item.kind === "task") deleteTaskHelper(item.id);
    else deleteConspectus(item.id);
    setOpen(false);
  };

  const row = "lib-focus flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium hover:bg-[var(--lib-hover)]";

  return (
    <div className="relative">
      <button
        ref={trigger}
        type="button"
        aria-label={`მეტი: ${item.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value);
          setConfirming(false);
        }}
        className="lib-focus flex h-9 w-9 items-center justify-center rounded-full text-[var(--lib-muted)] hover:bg-[var(--lib-hover)]"
      >
        <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden />
      </button>
      {open ? (
        <div
          ref={panel}
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-56 rounded-2xl border border-[var(--lib-border)] bg-[var(--lib-card)] p-1.5 text-[var(--lib-title)] shadow-[0_12px_32px_-12px_rgb(15_23_42/0.3)]"
        >
          {confirming ? (
            <>
              <p className="px-3 pb-1 pt-2 text-[13px] text-[var(--lib-muted)]">წავშალოთ? ეს ვეღარ დაბრუნდება.</p>
              <button type="button" role="menuitem" onClick={remove} className={`${row} text-[var(--lib-bad)]`}>
                <Trash2 className="h-4 w-4" aria-hidden />
                წაშლა
              </button>
              <button type="button" role="menuitem" onClick={() => setConfirming(false)} className={row}>
                გაუქმება
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onRename();
                }}
                className={row}
              >
                <Pencil className="h-4 w-4" aria-hidden />
                გადარქმევა
              </button>
              {(item.kind === "deck" || item.kind === "conspectus") && item.status === "ready" ? (
                <button type="button" role="menuitem" onClick={toQuiz} className={row}>
                  <Brain className="h-4 w-4" aria-hidden />
                  ქვიზად გადაქცევა
                </button>
              ) : null}
              <button type="button" role="menuitem" onClick={() => setConfirming(true)} className={`${row} text-[var(--lib-bad)]`}>
                <Trash2 className="h-4 w-4" aria-hidden />
                წაშლა
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function RenameField({ item, onDone }: { item: MaterialItem; onDone: () => void }) {
  const [value, setValue] = useState(item.title);
  const save = () => {
    if (item.kind === "deck") renameCustomDeck(item.id, value);
    else if (item.kind === "quiz") renameQuiz(item.id, value);
    else if (item.kind === "task") renameTaskHelper(item.id, value);
    else renameConspectus(item.id, value);
    onDone();
  };
  return (
    <input
      autoFocus
      value={value}
      aria-label="ახალი სახელი"
      onChange={(event) => setValue(event.target.value)}
      onBlur={save}
      onKeyDown={(event) => {
        if (event.key === "Enter") save();
        if (event.key === "Escape") onDone();
      }}
      className="h-9 w-full rounded-[10px] border border-[var(--lib-field-border)] bg-[var(--lib-card)] px-2.5 text-[15px] font-bold text-[var(--lib-title)] outline-none focus:border-transparent focus:shadow-[0_0_0_2px_#e11d74]"
    />
  );
}

/**
 * One deck, quiz or conspectus in „ჩემი მასალები“: the kind of material,
 * the name and a ⋯ menu (rename, make a quiz, delete); then what's done so
 * far and the one thing to do next. A generation in progress shows its
 * count; a failed one offers „თავიდან ცდა“.
 */
export function MaterialCard({ item }: { item: MaterialItem }) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const meta = [item.sourceName !== item.title ? item.sourceName : "", shortDate(item.createdAt)].filter(Boolean).join(" · ");

  let body: ReactNode = null;
  let actions: ReactNode = null;

  if (item.status === "generating") {
    const deck = item.deck;
    const ready = deck ? deck.cards : 0;
    const total = deck ? deck.target : (item.quiz?.questions ?? 0);
    const percent = deck && total > 0 ? Math.max(6, Math.round((ready / total) * 100)) : 30;
    body = (
      <div className="flex flex-col gap-2.5">
        <p className="flex items-center gap-2 text-[14px] font-semibold text-[var(--lib-title)]">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--lib-pink)]" aria-hidden />
          {deck ? `იქმნება · ${ready} / ${total} ბარათი` : `იქმნება · ${total} კითხვა`}
        </p>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--lib-track)] sm:h-2" role="progressbar" aria-label="პროგრესი" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="lib-generating-bar h-full rounded-full transition-[width] duration-700" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-[13px] text-[var(--lib-muted)]">შეგიძლია დახურო, მზად რომ იქნება შეგატყობინებთ</p>
      </div>
    );
  } else if (item.status === "failed") {
    body = (
      <p className="flex items-center gap-2 text-[14px] font-semibold text-[var(--lib-bad)]">
        <AlertCircle className="h-4 w-4" aria-hidden />
        ვერ შეიქმნა
      </p>
    );
    const retry = () => {
      if (item.kind === "deck" && retryDeckGeneration(item.id)) return;
      router.push(item.kind === "quiz" ? "/quiz?tab=new" : "/generate?tab=new");
    };
    actions = (
      <button type="button" onClick={retry} className={`lib-primary ${BUTTON}`}>
        <RotateCcw className="h-4 w-4" aria-hidden />
        თავიდან ცდა
      </button>
    );
  } else if (item.kind === "deck" && item.deck) {
    const { known, unknown, cards, started } = item.deck;
    body = (
      <div className="flex flex-col gap-2">
        <p className="text-[13.5px] text-[var(--lib-text)]">
          {started ? (
            <>
              ვიცი <b className="text-[var(--lib-title)]">{known}</b> · გასამეორებელი <b className="text-[var(--lib-title)]">{unknown}</b>
              <span className="text-[var(--lib-muted)]"> · {cards} ბარათი</span>
            </>
          ) : (
            <>{cards} ბარათი · ჯერ არ დაგიწყია</>
          )}
        </p>
        <DeckBar known={known} unknown={unknown} total={cards} />
      </div>
    );
    actions = item.done ? (
      <>
        <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--lib-ok)]">
          <Check className="h-4 w-4" strokeWidth={2.6} aria-hidden />
          ყველა ბარათი იცი
        </span>
        <button
          type="button"
          onClick={() => {
            const deck = getCustomDeckById(item.id);
            if (deck) saveSession(startSession(deck.id, deck.cards.map((card) => card.id)));
            router.push(materialHref(item));
          }}
          className={`lib-secondary ${BUTTON}`}
        >
          თავიდან გავლა
        </button>
      </>
    ) : (
      <Link href={materialHref(item)} className={`lib-primary ${BUTTON}`}>
        {started ? "გაგრძელება" : "დაწყება"}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    );
  } else if (item.kind === "quiz" && item.quiz) {
    const quiz = item.quiz;
    if (quiz.finished) {
      body = (
        <div className="flex items-center gap-3">
          <ScoreRing correct={quiz.correct} total={quiz.questions} />
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-[var(--lib-title)]">
              {quiz.correct} / {quiz.questions} სწორი
            </p>
            <p className="text-[13px] text-[var(--lib-muted)]">ბოლო მცდელობა · სულ {quiz.attempts} მცდელობა</p>
          </div>
        </div>
      );
      actions = (
        <>
          {quiz.mistakes ? (
            <Link href={materialHref(item, "mistakes")} className={`lib-primary ${BUTTON}`}>
              შეცდომები
            </Link>
          ) : null}
          <Link href={materialHref(item, "restart")} className={`lib-secondary ${BUTTON}`}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            თავიდან
          </Link>
        </>
      );
    } else {
      const percent = quiz.questions > 0 ? Math.round((quiz.answered / quiz.questions) * 100) : 0;
      body = (
        <div className="flex flex-col gap-2">
          <p className="text-[13.5px] text-[var(--lib-text)]">
            {quiz.answered > 0 ? `${quiz.answered} / ${quiz.questions} კითხვა` : `${quiz.questions} კითხვა · ჯერ არ დაგიწყია`}
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--lib-track)] sm:h-2" aria-hidden>
            <div className="h-full rounded-full bg-[var(--lib-teal)]" style={{ width: `${percent}%` }} />
          </div>
        </div>
      );
      actions = (
        <Link href={materialHref(item)} className={`lib-primary ${BUTTON}`}>
          {quiz.answered > 0 ? "გაგრძელება" : "დაწყება"}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      );
    }
  } else if (item.kind === "task" && item.task) {
    const { done, steps, dueDate } = item.task;
    body = (
      <div className="flex flex-col gap-2">
        <p className="text-[13.5px] text-[var(--lib-text)]">
          {[steps > 0 ? `${done}/${steps} ნაბიჯი` : null, dueDate ? `ჩაბარება ${shortDate(Date.parse(`${dueDate}T12:00:00`))}` : null].filter(Boolean).join(" · ") || "გეგმა"}
        </p>
        {steps > 0 ? (
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--lib-track)] sm:h-2" aria-hidden>
            <div className="h-full rounded-full bg-[#0284c7] dark:bg-[#38bdf8]" style={{ width: `${(done / steps) * 100}%` }} />
          </div>
        ) : null}
      </div>
    );
    actions = (
      <Link href={materialHref(item)} className={`lib-primary ${BUTTON}`}>
        {done > 0 && done < steps ? "გაგრძელება" : "გახსნა"}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    );
  } else if (item.kind === "conspectus") {
    body = <p className="line-clamp-2 text-[13.5px] leading-relaxed text-[var(--lib-text)]">{item.excerpt}</p>;
    actions = (
      <Link href={materialHref(item)} className={`lib-secondary ${BUTTON}`}>
        გახსნა
      </Link>
    );
  }

  return (
    <article className="lib-card flex flex-col gap-4 p-4 sm:p-5" aria-label={item.title}>
      <div className="flex items-start gap-3">
        <SourceTile item={item} />
        <div className="min-w-0 flex-1">
          {renaming ? (
            <RenameField item={item} onDone={() => setRenaming(false)} />
          ) : (
            <h3 className="line-clamp-2 text-[15.5px] font-bold leading-snug text-[var(--lib-title)]">{item.title}</h3>
          )}
          {meta ? <p className="mt-0.5 truncate text-[12.5px] text-[var(--lib-muted)]">{meta}</p> : null}
        </div>
        <CardMenu item={item} onRename={() => setRenaming(true)} />
      </div>
      {body}
      {actions ? <div className="mt-auto flex flex-wrap items-center justify-between gap-2 sm:justify-start">{actions}</div> : null}
    </article>
  );
}
