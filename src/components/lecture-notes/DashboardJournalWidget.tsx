"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { DashboardCard, dashboardCardActionClass } from "@/components/dashboard/DashboardCard";
import { JOURNAL_CATEGORIES, journalCategory } from "@/lib/journal-categories";
import {
  LECTURE_NOTES_UPDATED_EVENT,
  journalHref,
  journalNewHref,
  loadLectureNotes,
  previewLectureNote,
  type JournalSection,
  type LectureNote,
} from "@/lib/lecture-notes";
import { nbButtonClass } from "@/lib/nb-button";
import { CategoryDot } from "./CategoryDot";
import { relativeTimeShortKa } from "@/lib/relative-time-ka";

/** Notes with something written in them, newest first. */
function recentNotes(notes: LectureNote[]): LectureNote[] {
  return notes
    .filter((note) => note.title.trim() || note.content.trim() || note.contentRight?.trim())
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * The dashboard's journal card: the last three entries (a tap opens one)
 * and „+ ახალი ჩანაწერი“ with a choice of kind; empty, a short line and
 * the four kinds as chips. A plain card like the others — the journal's
 * XP still counts (profile, stats) but isn't shown here.
 */
export function DashboardJournalWidget() {
  const router = useRouter();
  const [notes, setNotes] = useState<LectureNote[] | null>(null);
  const [choosing, setChoosing] = useState(false);
  const chooserRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setNotes(recentNotes(loadLectureNotes()));
    sync();
    window.addEventListener(LECTURE_NOTES_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(LECTURE_NOTES_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // The kind chooser closes on Esc or a tap outside it.
  useEffect(() => {
    if (!choosing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setChoosing(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (!chooserRef.current?.contains(event.target as Node)) setChoosing(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [choosing]);

  // Opens a new entry in the editor; it's saved once something is written.
  const create = (section: JournalSection) => router.push(journalNewHref(section));

  if (notes === null) return null;
  const count = notes.length;

  return (
    <DashboardCard
      icon={BookOpen}
      tone="pink"
      title="ჟურნალი"
      subtitle={`${count} ჩანაწერი`}
      action={
        <Link href="/journal" className={dashboardCardActionClass}>
          ყველა →
        </Link>
      }
    >
      {count > 0 ? (
        <ul className="mt-4 border-t border-[var(--border)]">
          {notes.slice(0, 3).map((note) => (
            <li key={note.id} className="border-b border-[var(--border)] last:border-b-0">
              <Link
                href={journalHref(note.id, note.section)}
                className="-mx-2 block rounded-xl px-2 py-3 transition-colors hover:bg-[var(--bg-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50"
              >
                <div className="flex items-center gap-2.5">
                  <CategoryDot section={note.section} />
                  <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[var(--text-primary)]">
                    {note.title.trim() || journalCategory(note.section).label}
                  </span>
                  <span className="shrink-0 text-xs font-medium tabular-nums text-[var(--text-secondary)]">
                    {relativeTimeShortKa(note.updatedAt)}
                  </span>
                </div>
                {note.content.trim() ? (
                  <p className="mt-0.5 truncate pl-[18px] text-[13.5px] font-medium text-[var(--text-secondary)]">
                    {previewLectureNote(note.content, 120)}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4">
          <p className="text-[14px] font-medium leading-relaxed text-[var(--text-secondary)]">
            აქ გამოჩნდება შენი ჩანაწერები ლექციებზე, დავალებებსა და იდეებზე.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {JOURNAL_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => create(category.id)}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3.5 text-[13px] font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--bg-secondary)]"
              >
                <CategoryDot section={category.id} />
                {category.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div ref={chooserRef} className="relative mt-4">
        <button
          type="button"
          onClick={() => (count > 0 ? setChoosing((open) => !open) : create("lectures"))}
          aria-expanded={count > 0 ? choosing : undefined}
          aria-haspopup={count > 0 ? "menu" : undefined}
          className={nbButtonClass({ variant: "primary" })}
        >
          <Plus aria-hidden />
          {count > 0 ? "ახალი ჩანაწერი" : "პირველი ჩანაწერი"}
        </button>
        {choosing ? (
          <div
            role="menu"
            aria-label="ჩანაწერის ტიპი"
            className="absolute left-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-1.5 shadow-[0_12px_32px_-12px_rgb(15_23_42/0.25)]"
          >
            {JOURNAL_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                role="menuitem"
                onClick={() => create(category.id)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)] focus-visible:bg-[var(--bg-secondary)] focus-visible:outline-none"
              >
                <CategoryDot section={category.id} />
                {category.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </DashboardCard>
  );
}
