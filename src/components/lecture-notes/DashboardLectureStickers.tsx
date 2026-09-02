"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  LECTURE_NOTES_UPDATED_EVENT,
  loadLectureNotes,
  pinnedLectureNotes,
} from "@/lib/lecture-notes";
import { DashboardStickyNote } from "./DashboardStickyNote";

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

  if (pinned.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-amber-200 bg-[#F5EFE0]/70 p-5 dark:border-amber-300/20 dark:bg-amber-300/10">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-800/80 dark:text-amber-200">
          ლექციის ნოტები
        </p>
        <h3 className="mt-1 text-lg font-bold text-stone-900 dark:text-white">დაამატე სტიკერი დეშბორდზე</h3>
        <p className="mt-1 max-w-xl text-sm text-stone-600 dark:text-zinc-400">
          ჩაწერე ლექცია, AI ამოიღებს საკვანძო თემებს და შეგიძლია ნოტი პინით დადო აქ.
        </p>
        <Link
          href="/lecture-notes"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-900 px-4 py-2 text-xs font-bold text-amber-50 transition hover:bg-amber-800"
        >
          <Plus className="h-3.5 w-3.5" />
          ახალი ნოტი
        </Link>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
            დეშბორდის სტიკერები
          </p>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">ლექციის ნოტები</h3>
        </div>
        <Link
          href="/lecture-notes"
          className="text-xs font-semibold text-amber-800 hover:underline dark:text-amber-300"
        >
          ყველა ნოტი
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {pinned.map((note) => (
          <DashboardStickyNote key={note.id} note={note} />
        ))}
      </div>
    </section>
  );
}
