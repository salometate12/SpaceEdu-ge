"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Pin } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { journalCategory } from "@/lib/journal-categories";
import { formatGeorgianDate, journalHref, LECTURE_NOTES_UPDATED_EVENT, loadLectureNotes } from "@/lib/lecture-notes";
import { readSavedSemesterSubjects } from "@/lib/semester-subjects";
import { noteHref, pinnedNotes, SUBJECT_NOTES_UPDATED_EVENT } from "@/lib/subject-notes";

/** How many pinned notes the dashboard shows. */
const SHOWN = 6;

interface Pinned {
  key: string;
  title: string;
  meta: string;
  href: string;
  updatedAt: number;
}

function readPinned(): Pinned[] {
  const subjects = new Map(readSavedSemesterSubjects().map((subject) => [subject.id, subject.name]));
  const lectures = pinnedNotes().map((note) => ({
    key: `note:${note.id}`,
    title: note.title.trim() || "უსათაურო ჩანაწერი",
    meta: `${(note.subjectId && subjects.get(note.subjectId)) || "საგნის გარეშე"} · ${formatGeorgianDate(note.lectureDate)}`,
    href: noteHref(note),
    updatedAt: note.updatedAt,
  }));
  const journal = loadLectureNotes()
    .filter((note) => note.pinned)
    .map((note) => ({
      key: `journal:${note.id}`,
      title: note.title.trim() || journalCategory(note.section).label,
      meta: `${journalCategory(note.section).label} · ${formatGeorgianDate(note.date)}`,
      href: journalHref(note.id, note.section),
      updatedAt: note.updatedAt,
    }));
  return [...lectures, ...journal].sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * „მიმაგრებული ჩანაწერები“: lecture notes („ჩემი საგნები“) and journal
 * entries pinned with „დეშბორდზე მიმაგრება“. Only while something is pinned.
 */
export function DashboardPinnedNotes() {
  const [pinned, setPinned] = useState<Pinned[]>([]);

  useEffect(() => {
    const sync = () => setPinned(readPinned());
    void Promise.resolve().then(sync);
    const events = [SUBJECT_NOTES_UPDATED_EVENT, LECTURE_NOTES_UPDATED_EVENT, "storage"];
    events.forEach((name) => window.addEventListener(name, sync));
    return () => events.forEach((name) => window.removeEventListener(name, sync));
  }, []);

  if (pinned.length === 0) return null;

  return (
    <DashboardCard icon={Pin} tone="pink" title="მიმაგრებული ჩანაწერები">
      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {pinned.slice(0, SHOWN).map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className="group flex h-14 items-center gap-3 rounded-xl border border-[var(--border)] px-3 transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--bg-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-[var(--text-primary)]">{item.title}</span>
                <span className="block truncate text-xs text-[var(--text-muted)]">{item.meta}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-primary)]" strokeWidth={1.75} aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
