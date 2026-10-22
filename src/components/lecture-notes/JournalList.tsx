"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Pin, Plus, Search, X } from "lucide-react";
import { JOURNAL_CATEGORIES, journalCategory } from "@/lib/journal-categories";
import { filterNotes, groupNotesByDay, noteText } from "@/lib/journal-view";
import { journalHref, journalNewHref, previewLectureNote, type JournalSection, type LectureNote } from "@/lib/lecture-notes";
import { nbButtonClass } from "@/lib/nb-button";
import { CategoryDot } from "./CategoryDot";

/** The page's round icon buttons. */
export const JOURNAL_ICON_BUTTON =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50";

/** The sticky header strip: under the status bar on phones, under the site header on desktop. */
export const JOURNAL_HEADER =
  "sticky top-0 z-30 bg-[var(--bg-primary)]/85 pt-[var(--safe-top)] backdrop-blur-md md:top-[var(--site-header-h)]";

/** A category name as coloured text: the darker shade on light, the colour itself on dark. */
export function CategoryLabel({ section, children }: { section: JournalSection; children?: React.ReactNode }) {
  const category = journalCategory(section);
  return (
    <span
      className="font-semibold text-[var(--cat-ink)] dark:text-[var(--cat)]"
      style={{ "--cat": category.color, "--cat-ink": category.colorDark } as React.CSSProperties}
    >
      {children ?? category.label}
    </span>
  );
}

function NoteCard({ note }: { note: LectureNote }) {
  const text = noteText(note).trim();
  return (
    <Link
      href={journalHref(note.id, note.section)}
      className="block rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-colors hover:border-[var(--border-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50"
    >
      <div className="flex items-center gap-2 text-[12.5px]">
        <CategoryDot section={note.section} />
        <CategoryLabel section={note.section} />
        {note.subject ? <span className="truncate font-medium text-[var(--text-secondary)]">· {note.subject}</span> : null}
      </div>
      <h3 className="mt-1.5 text-[16px] font-[650] leading-snug text-[var(--text-primary)]">
        {note.title.trim() || journalCategory(note.section).label}
      </h3>
      {text ? (
        <p className="mt-1 line-clamp-2 text-[14px] font-medium leading-relaxed text-[var(--text-secondary)]">
          {previewLectureNote(text, 220)}
        </p>
      ) : null}
    </Link>
  );
}

/**
 * The journal's list: category chips, search, entries grouped by day
 * (pinned first), and a floating „+ ახალი“. The deleted-entry undo shows
 * here as a toast.
 */
export function JournalList({
  notes,
  tab,
  onTab,
  deleted,
  onUndo,
}: {
  notes: LectureNote[];
  tab: JournalSection | "all";
  onTab: (tab: JournalSection | "all") => void;
  deleted: LectureNote | null;
  onUndo: () => void;
}) {
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searching) searchRef.current?.focus();
  }, [searching]);

  const all = filterNotes(notes, { category: "all", query: "" });
  const shown = filterNotes(notes, { category: tab, query });
  const groups = groupNotesByDay(shown);
  const newHref = journalNewHref(tab === "all" ? "lectures" : tab);

  const chips: { id: JournalSection | "all"; label: string }[] = [
    { id: "all", label: `ყველა · ${all.length}` },
    ...JOURNAL_CATEGORIES.map((category) => ({ id: category.id, label: category.plural })),
  ];

  return (
    <div className="under-site-header min-h-dvh bg-[var(--bg-primary)] pb-36 max-md:-mt-[var(--safe-top)] md:pb-16">
      <header className={JOURNAL_HEADER}>
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center gap-3 px-4">
          <Link href="/dashboard-student" aria-label="დეშბორდზე" className={JOURNAL_ICON_BUTTON}>
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Link>
          {searching ? (
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" aria-hidden />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="მოძებნე ჩანაწერებში…"
                aria-label="ძებნა ჩანაწერებში"
                // 16px: iOS zooms into smaller fields.
                className="h-10 w-full rounded-full border border-[var(--border)] bg-[var(--bg-card)] pl-10 pr-3 text-[16px] font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[var(--text-secondary)] [&::-webkit-search-cancel-button]:hidden"
              />
            </div>
          ) : (
            <h1 className="min-w-0 flex-1 truncate text-[22px] font-bold text-[var(--text-primary)]">ჟურნალი</h1>
          )}
          <button
            type="button"
            onClick={() => {
              setSearching((open) => !open);
              setQuery("");
            }}
            aria-label={searching ? "ძებნის დახურვა" : "ძებნა"}
            aria-expanded={searching}
            className={JOURNAL_ICON_BUTTON}
          >
            {searching ? <X className="h-[18px] w-[18px]" /> : <Search className="h-[18px] w-[18px]" />}
          </button>
        </div>
        <div
          role="tablist"
          aria-label="კატეგორიები"
          className="mx-auto flex w-full max-w-3xl gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {chips.map((chip) => {
            const active = chip.id === tab;
            return (
              <button
                key={chip.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTab(chip.id)}
                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13.5px] font-semibold transition-colors ${
                  active
                    ? "bg-[var(--text-primary)] text-[var(--bg-primary)]"
                    : "border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                }`}
              >
                {chip.id !== "all" ? <CategoryDot section={chip.id} /> : null}
                {chip.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pt-2">
        {groups.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-4 text-center">
            <p className="max-w-xs text-[15px] font-medium text-[var(--text-secondary)]">
              {query
                ? "ვერაფერი მოიძებნა."
                : tab === "all"
                  ? "აქ გამოჩნდება შენი ჩანაწერები ლექციებზე, დავალებებსა და იდეებზე."
                  : `${journalCategory(tab).plural} ჯერ არ გაქვს.`}
            </p>
            {query ? null : (
              <Link href={newHref} className={nbButtonClass({ variant: "primary" })}>
                <Plus aria-hidden />
                ახალი ჩანაწერი
              </Link>
            )}
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.id} className="mt-5" aria-label={group.label}>
              <h2 className="mb-2 flex items-center gap-1.5 px-1 text-[13px] font-semibold text-[var(--text-secondary)]">
                {group.id === "pinned" ? <Pin className="h-3.5 w-3.5" aria-hidden /> : null}
                {group.label}
              </h2>
              <div className="space-y-2.5">
                {group.notes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Above the phone's dock, clear of it. */}
      <Link
        href={newHref}
        className={nbButtonClass({
          variant: "primary",
          className: "fixed bottom-[calc(env(safe-area-inset-bottom)+104px)] right-4 z-30 md:bottom-28 md:right-8",
        })}
      >
        <Plus aria-hidden />
        ახალი
      </Link>

      {deleted ? (
        <div
          role="status"
          className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+168px)] z-40 mx-auto flex max-w-sm items-center justify-between gap-3 rounded-full bg-[var(--text-primary)] py-2 pl-4 pr-2 text-[14px] font-medium text-[var(--bg-primary)] shadow-lg md:bottom-24"
        >
          <span className="truncate">ჩანაწერი წაიშალა</span>
          <button type="button" onClick={onUndo} className="shrink-0 rounded-full px-3 py-1.5 font-semibold text-pink-300 hover:bg-white/10 dark:text-pink-600 dark:hover:bg-black/10">
            გაუქმება
          </button>
        </div>
      ) : null}
    </div>
  );
}
