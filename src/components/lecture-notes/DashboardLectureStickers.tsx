"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Plus, StickyNote } from "lucide-react";
import {
  LECTURE_NOTES_UPDATED_EVENT,
  formatGeorgianDate,
  journalSectionMeta,
  lectureNoteHref,
  loadLectureNotes,
  pinnedLectureNotes,
} from "@/lib/lecture-notes";
import { DashboardCard, dashboardCardActionClass } from "@/components/dashboard/DashboardCard";

/** How many pinned notes the dashboard shows before "all notes". */
const SHOWN = 3;

export function DashboardLectureStickers() {
  const [pinned, setPinned] = useState<ReturnType<typeof pinnedLectureNotes>>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setPinned(pinnedLectureNotes(loadLectureNotes()));
      setReady(true);
    };
    sync();
    window.addEventListener(LECTURE_NOTES_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(LECTURE_NOTES_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!ready) return null;

  const hasNotes = pinned.length > 0;

  return (
    <DashboardCard
      icon={StickyNote}
      tone="amber"
      title="ლექციის ნოტები"
      // Once there are notes, the notes speak for the card; the pitch is
      // only for someone who has not written one yet.
      subtitle={hasNotes ? undefined : "ჩაწერე ლექცია — AI ამოიღებს საკვანძო თემებს"}
      action={
        <Link href="/lecture-notes" className={dashboardCardActionClass}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          ახალი ნოტი
        </Link>
      }
    >
      {hasNotes && (
        <>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pinned.slice(0, SHOWN).map((note) => (
              <li key={note.id}>
                <Link
                  href={lectureNoteHref(note.id)}
                  className="group flex h-14 items-center gap-3 rounded-xl border border-[var(--border)] px-3 transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--bg-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
                      {note.title.trim() || "უსათაურო ლექცია"}
                    </span>
                    <span className="block truncate text-xs text-[var(--text-muted)]">
                      {journalSectionMeta(note.section).heading} · {formatGeorgianDate(note.date)}
                    </span>
                  </span>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-primary)]"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
          {pinned.length > SHOWN && (
            <Link
              href="/lecture-notes"
              className="mt-3 inline-block text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:underline"
            >
              ყველა ნოტი ({pinned.length})
            </Link>
          )}
        </>
      )}
    </DashboardCard>
  );
}
