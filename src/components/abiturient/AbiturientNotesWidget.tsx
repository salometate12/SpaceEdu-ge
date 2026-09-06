"use client";

import { useEffect, useRef, useState } from "react";
import { NotebookPen, Plus, Trash2 } from "lucide-react";
import {
  ABIT_NOTES_UPDATED_EVENT,
  addAbitNote,
  deleteAbitNote,
  loadAbitNotes,
  updateAbitNote,
  type AbitNote,
} from "@/lib/abit-notes";

function timeLabel(at: number): string {
  const now = new Date();
  const then = new Date(at);
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const startOfThen = new Date(then).setHours(0, 0, 0, 0);
  const days = Math.round((startOfToday - startOfThen) / 86_400_000);
  if (days <= 0) {
    return `${String(then.getHours()).padStart(2, "0")}:${String(then.getMinutes()).padStart(2, "0")}`;
  }
  if (days === 1) return "გუშინ";
  return `${then.getDate()}.${String(then.getMonth() + 1).padStart(2, "0")}`;
}

export function AbiturientNotesWidget() {
  const [notes, setNotes] = useState<AbitNote[]>([]);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const draftRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const sync = () => setNotes(loadAbitNotes());
    sync();
    window.addEventListener(ABIT_NOTES_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ABIT_NOTES_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const save = () => {
    if (!draft.trim()) return;
    setNotes(addAbitNote(draft));
    setDraft("");
    draftRef.current?.focus();
  };

  const commitEdit = () => {
    if (editingId === null) return;
    setNotes(updateAbitNote(editingId, editText));
    setEditingId(null);
    setEditText("");
  };

  return (
    <section className="dashboard-section p-5 sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        <NotebookPen className="h-6 w-6 text-violet-600 dark:text-purple-400" strokeWidth={1.5} />
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">ჩემი ნოტები</h3>
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            სწრაფი ჩანაწერები მომზადებისთვის — მხოლოდ აბიტურიენტის სივრცეში.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <textarea
          ref={draftRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              save();
            }
          }}
          rows={2}
          placeholder="ჩაწერე ნოტი და შეინახე..."
          className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-100 dark:placeholder:text-zinc-600"
        />
        <button
          type="button"
          onClick={save}
          disabled={!draft.trim()}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-violet-600 px-4 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-500 dark:hover:bg-violet-400"
        >
          <Plus className="h-4 w-4 stroke-[2]" />
          შენახვა
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-zinc-500">
          ჯერ ნოტები არ გაქვს — ზემოთ ჩაწერე პირველი.
        </p>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="group rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]"
            >
              {editingId === note.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                    className="w-full resize-none rounded-xl border border-violet-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none dark:border-violet-400/40 dark:bg-white/[0.04] dark:text-zinc-100"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={commitEdit}
                      className="rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white dark:bg-violet-500"
                    >
                      შენახვა
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-slate-500 dark:text-zinc-400"
                    >
                      გაუქმება
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p
                    className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-zinc-200"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setEditingId(note.id);
                      setEditText(note.text);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setEditingId(note.id);
                        setEditText(note.text);
                      }
                    }}
                  >
                    {note.text}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                      {timeLabel(note.at)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotes(deleteAbitNote(note.id))}
                      aria-label="ნოტის წაშლა"
                      className="rounded-full p-1 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 dark:text-zinc-600 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
