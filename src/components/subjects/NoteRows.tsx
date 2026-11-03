"use client";

import Link from "next/link";
import { NotebookPen, Plus } from "lucide-react";
import { firstLine, newNoteHref, noteHref, shortNoteDate, type SubjectNote } from "@/lib/subject-notes";

/** One line per note: the pink tile, its title and date, the first line under it. Opens the editor. */
export function NoteRows({ notes }: { notes: SubjectNote[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {notes.map((note) => {
        const preview = firstLine(note.body);
        return (
          <li key={note.id}>
            <Link href={noteHref(note)} className="sj-focus flex w-full items-center gap-2.5 rounded-[12px] px-2 py-2 text-left hover:bg-[var(--sj-hover)]">
              <span className="sj-note-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]" aria-hidden>
                <NotebookPen className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[var(--sj-title)]">{note.title.trim() || "უსათაურო ჩანაწერი"}</span>
                  <span className="shrink-0 text-[12.5px] text-[var(--sj-muted)]">{shortNoteDate(note.lectureDate)}</span>
                </span>
                {preview ? <span className="mt-0.5 block truncate text-[13px] text-[var(--sj-muted)]">{preview}</span> : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** „ჩანაწერები“ with „+ ჩანაწერი“ (for this subject and topic) and the notes. */
export function NotesBlock({
  subjectId,
  topicId,
  notes,
  title = "ჩანაწერები",
  empty,
}: {
  subjectId: string | null;
  topicId?: string;
  notes: SubjectNote[];
  title?: string;
  empty?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 text-[13px] font-semibold text-[var(--sj-muted)]">{title}</p>
        <Link href={newNoteHref(subjectId, topicId)} className="sj-secondary sj-focus h-8 px-3 text-[13px]">
          <Plus className="h-3.5 w-3.5" aria-hidden />
          ჩანაწერი
        </Link>
      </div>
      {notes.length > 0 ? (
        <div className="mt-1.5">
          <NoteRows notes={notes} />
        </div>
      ) : empty ? (
        <p className="mt-1.5 text-[13.5px] text-[var(--sj-muted)]">{empty}</p>
      ) : null}
    </div>
  );
}
