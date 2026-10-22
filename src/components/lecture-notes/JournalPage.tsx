"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { recordToolUsage } from "@/lib/activity";
import {
  LECTURE_NOTES_STORAGE_KEY,
  createBlankLectureNote,
  isJournalSection,
  loadLectureNotes,
  saveLectureNotes,
  upsertLectureNote,
  type JournalSection,
  type LectureNote,
} from "@/lib/lecture-notes";
import { onRemoteUserData } from "@/lib/user-data";
import { JournalEditor } from "./JournalEditor";
import { JournalList } from "./JournalList";

/** How long a deleted entry can still be brought back. */
const UNDO_MS = 5000;

/**
 * /journal: the list of entries, or one entry in the editor (`?id=`).
 * `?new=<category>` opens a new entry, saved once something is written;
 * `?tab=<category>` filters the list. Owns the notes and the delete undo.
 */
export function JournalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const newParam = searchParams.get("new");
  const tabParam = searchParams.get("tab");
  const tab: JournalSection | "all" = isJournalSection(tabParam) ? tabParam : "all";

  const [notes, setNotes] = useState<LectureNote[] | null>(null);
  // A new entry not saved yet (nothing written in it).
  const [draft, setDraft] = useState<LectureNote | null>(null);
  const [deleted, setDeleted] = useState<LectureNote | null>(null);
  const undoTimer = useRef<number | null>(null);

  useEffect(() => {
    recordToolUsage("journal", "ჟურნალი");
    void Promise.resolve().then(() => setNotes(loadLectureNotes()));
    // Entries arriving from the account (another device).
    return onRemoteUserData(
      (key) => key === LECTURE_NOTES_STORAGE_KEY,
      () => setNotes(loadLectureNotes()),
    );
  }, []);

  // `?new=lectures` → a blank entry of that kind, then its own `?id=`.
  useEffect(() => {
    if (!isJournalSection(newParam)) return;
    const blank = createBlankLectureNote(newParam);
    void Promise.resolve().then(() => setDraft(blank));
    router.replace(`/journal?id=${blank.id}`, { scroll: false });
  }, [newParam, router]);

  const save = useCallback((note: LectureNote) => {
    setNotes((current) => {
      const next = upsertLectureNote(current ?? loadLectureNotes(), note);
      saveLectureNotes(next);
      return next;
    });
    setDraft((current) => (current?.id === note.id ? null : current));
  }, []);

  const remove = useCallback(
    (note: LectureNote) => {
      setDraft((current) => (current?.id === note.id ? null : current));
      setNotes((current) => {
        const list = current ?? loadLectureNotes();
        if (!list.some((item) => item.id === note.id)) return list;
        const next = list.filter((item) => item.id !== note.id);
        saveLectureNotes(next);
        return next;
      });
      setDeleted(note);
      if (undoTimer.current) window.clearTimeout(undoTimer.current);
      undoTimer.current = window.setTimeout(() => setDeleted(null), UNDO_MS);
      router.push(`/journal?tab=${note.section}`, { scroll: false });
    },
    [router],
  );

  const undoDelete = () => {
    if (!deleted) return;
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    save(deleted);
    setDeleted(null);
  };

  useEffect(() => () => {
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
  }, []);

  if (notes === null) {
    return <div className="under-site-header min-h-[60vh] bg-[var(--bg-primary)]" aria-busy />;
  }

  const editing = id ? (notes.find((note) => note.id === id) ?? (draft?.id === id ? draft : null)) : null;
  if (editing) {
    return (
      <JournalEditor
        key={editing.id}
        note={editing}
        onSave={save}
        onDelete={remove}
        onBack={() => router.push(`/journal?tab=${editing.section}`, { scroll: false })}
      />
    );
  }

  return (
    <JournalList
      notes={notes}
      tab={tab}
      onTab={(next) => router.replace(next === "all" ? "/journal" : `/journal?tab=${next}`, { scroll: false })}
      deleted={deleted}
      onUndo={undoDelete}
    />
  );
}
