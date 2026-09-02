"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LoaderCircle,
  Pin,
  PinOff,
  Plus,
  Send,
  Sparkles,
  StickyNote,
  Trash2,
} from "lucide-react";
import { ToolPageHeader } from "@/components/layout/ToolPageHeader";
import { fetchAiJson, fetchAiTextStream } from "@/lib/ai/fetch-ai";
import type { LectureNotesKeywords } from "@/lib/ai/lecture-notes-schema";
import {
  createBlankLectureNote,
  extractLocalKeywords,
  formatGeorgianDate,
  loadLectureNotes,
  saveLectureNotes,
  upsertLectureNote,
  type LectureNote,
} from "@/lib/lecture-notes";
import { recordToolUsage } from "@/lib/activity";

const QUICK_PROMPTS = [
  "ვერ გავანალიზე ეს აბზაცი და მარტივად აგიხსენი",
  "შემქმენი 3-კითხვიანი სწრაფი ქვიზი ამ ნოტიდან",
];

interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export function LectureNotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("id");
  const [notes, setNotes] = useState<LectureNote[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [keywordBusy, setKeywordBusy] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [pinFlash, setPinFlash] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const saveTimer = useRef<number | null>(null);
  const keywordTimer = useRef<number | null>(null);
  const keywordAbort = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const notesRef = useRef<LectureNote[]>([]);

  const active = notes.find((note) => note.id === activeId) ?? notes[0] ?? null;
  notesRef.current = notes;

  const persist = useCallback((nextNotes: LectureNote[]) => {
    setNotes(nextNotes);
    saveLectureNotes(nextNotes);
  }, []);

  useEffect(() => {
    recordToolUsage("lecture-notes", "ლექციის ნოტები");
    const loaded = loadLectureNotes();
    const idFromUrl = new URLSearchParams(window.location.search).get("id");
    if (loaded.length === 0) {
      const blank = createBlankLectureNote();
      persist([blank]);
      setActiveId(blank.id);
    } else {
      setNotes(loaded);
      const match = idFromUrl ? loaded.find((note) => note.id === idFromUrl) : null;
      setActiveId(match?.id ?? loaded[0].id);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated || !requestedId) return;
    setActiveId((current) => {
      if (notes.some((note) => note.id === requestedId)) return requestedId;
      return current;
    });
  }, [hydrated, notes, requestedId]);

  useEffect(() => {
    if (!hydrated || !activeId) return;
    const current = new URLSearchParams(window.location.search);
    if (current.get("id") === activeId) return;
    router.replace(`/lecture-notes?id=${encodeURIComponent(activeId)}`, { scroll: false });
  }, [activeId, hydrated, router]);

  const patchActive = useCallback((patch: Partial<LectureNote>) => {
    setNotes((prev) => {
      const current = prev.find((note) => note.id === activeId);
      if (!current) return prev;
      const next = { ...current, ...patch, updatedAt: Date.now() };
      const updated = upsertLectureNote(prev, next);
      notesRef.current = updated;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        saveLectureNotes(notesRef.current);
      }, 280);
      return updated;
    });
  }, [activeId]);

  const applyKeywords = useCallback(
    (noteId: string, tags: string[]) => {
      setNotes((prev) => {
        const current = prev.find((note) => note.id === noteId);
        if (!current) return prev;
        if (current.aiKeywords.join("|") === tags.join("|")) return prev;
        const updated = upsertLectureNote(prev, {
          ...current,
          aiKeywords: tags,
          updatedAt: Date.now(),
        });
        notesRef.current = updated;
        saveLectureNotes(updated);
        return updated;
      });
    },
    [],
  );

  useEffect(() => {
    if (!active) return;
    const noteId = active.id;
    const title = active.title;
    const content = active.content;
    if (keywordTimer.current) window.clearTimeout(keywordTimer.current);
    keywordTimer.current = window.setTimeout(() => {
      const local = extractLocalKeywords(content);
      if (content.trim().length < 40) {
        applyKeywords(noteId, local);
        return;
      }
      keywordAbort.current?.abort();
      const controller = new AbortController();
      keywordAbort.current = controller;
      setKeywordBusy(true);
      void fetchAiJson<LectureNotesKeywords>({
        pageType: "lecture-notes",
        responseMode: "json",
        signal: controller.signal,
        payload: { mode: "keywords", title, content },
      })
        .then((data) => {
          const tags = data.keywords.map((tag) => tag.replace(/^#/, "").trim()).filter(Boolean);
          applyKeywords(noteId, tags.length ? tags.slice(0, 8) : local);
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          applyKeywords(noteId, local);
          console.warn(error);
        })
        .finally(() => {
          if (!controller.signal.aborted) setKeywordBusy(false);
        });
    }, 1400);
    return () => {
      if (keywordTimer.current) window.clearTimeout(keywordTimer.current);
    };
  }, [active?.content, active?.id, active?.title, applyKeywords]);

  const askAi = async (message: string, keyword?: string | null) => {
    if (!active || chatBusy) return;
    const trimmed = message.trim();
    if (!trimmed) return;
    setChatInput("");
    setChatError(null);
    const userTurn: ChatTurn = { id: crypto.randomUUID(), role: "user", text: trimmed };
    const assistantId = crypto.randomUUID();
    setTurns((prev) => [...prev, userTurn, { id: assistantId, role: "assistant", text: "" }]);
    setChatBusy(true);
    try {
      await fetchAiTextStream(
        {
          pageType: "lecture-notes",
          responseMode: "stream",
          payload: {
            mode: "chat",
            title: active.title,
            content: active.content,
            message: trimmed,
            keyword: keyword ?? selectedKeyword ?? undefined,
          },
        },
        (partial) => {
          setTurns((prev) =>
            prev.map((turn) => (turn.id === assistantId ? { ...turn, text: partial } : turn)),
          );
        },
      );
    } catch (error) {
      setChatError(
        error instanceof Error ? error.message : "AI ამჟამად მიუწვდომელია. სცადე კიდევ ერთხელ.",
      );
      setTurns((prev) => prev.filter((turn) => turn.id !== assistantId));
    } finally {
      setChatBusy(false);
    }
  };

  const onKeywordClick = (tag: string) => {
    const next = selectedKeyword === tag ? null : tag;
    setSelectedKeyword(next);
    if (!next || !active) return;
    const count = active.content.split(tag).length - 1;
    textareaRef.current?.focus();
    void askAi(
      `"${tag}" — მოკლედ ამიხსენი ამ ლექციის კონტექსტში.${count > 0 ? ` ნოტში ${count}-ჯერ გვხვდება.` : ""}`,
      tag,
    );
  };

  const createNote = () => {
    const blank = createBlankLectureNote();
    persist([blank, ...notes]);
    setActiveId(blank.id);
    setSelectedKeyword(null);
    setTurns([]);
  };

  const deleteActive = () => {
    if (!active) return;
    const remaining = notes.filter((note) => note.id !== active.id);
    if (remaining.length === 0) {
      const blank = createBlankLectureNote();
      persist([blank]);
      setActiveId(blank.id);
    } else {
      persist(remaining);
      setActiveId(remaining[0].id);
    }
    setTurns([]);
    setSelectedKeyword(null);
  };

  const togglePin = () => {
    if (!active) return;
    const nextPinned = !active.pinned;
    setNotes((prev) => {
      const current = prev.find((note) => note.id === active.id);
      if (!current) return prev;
        const updated = upsertLectureNote(prev, {
          ...current,
          pinned: nextPinned,
          updatedAt: Date.now(),
        });
        notesRef.current = updated;
        if (saveTimer.current) window.clearTimeout(saveTimer.current);
        saveLectureNotes(updated);
        return updated;
    });
    setPinFlash(nextPinned ? "სტიკერი დაემატა დეშბორდს" : "სტიკერი მოიხსნა დეშბორდიდან");
    window.setTimeout(() => setPinFlash(null), 2200);
  };

  const highlightCount = useMemo(() => {
    if (!active || !selectedKeyword) return 0;
    return Math.max(0, active.content.split(selectedKeyword).length - 1);
  }, [active, selectedKeyword]);

  if (!hydrated || !active) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        ნოტები იტვირთება...
      </div>
    );
  }

  const displayTitle = active.title.trim() || "ახალი ლექცია";

  return (
    <section className="space-y-5">
      <ToolPageHeader
        title="AI Lecture Notes"
        subtitle="ჩაწერე ლექცია ცოცხლად, AI ამოიღებს საკვანძო თემებს და შეგიძლია ნოტი სტიკერად დადო დეშბორდზე."
        actions={
          <button
            type="button"
            onClick={createNote}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-800"
          >
            <Plus className="h-4 w-4" />
            ახალი ნოტი
          </button>
        }
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {notes.map((note) => {
          const selected = note.id === active.id;
          return (
            <button
              key={note.id}
              type="button"
              onClick={() => {
                setActiveId(note.id);
                setTurns([]);
                setSelectedKeyword(null);
              }}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                selected
                  ? "border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-100"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300"
              }`}
            >
              <StickyNote className="h-3.5 w-3.5" />
              <span className="max-w-[10rem] truncate">{note.title.trim() || "უსათაურო"}</span>
              {note.pinned && <Pin className="h-3 w-3" />}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-amber-200/80 bg-[#F5EFE0] p-5 shadow-[0_12px_40px_rgba(217,160,6,0.12)] dark:border-amber-300/15 dark:bg-amber-300/10 sm:p-6"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-amber-900/70 dark:text-amber-200/80">
                ლექციის სათაური
              </span>
              <input
                value={active.title}
                onChange={(event) => patchActive({ title: event.target.value })}
                placeholder="კომპიუტერული ქსელები"
                className="w-full rounded-2xl border border-amber-900/10 bg-white/80 px-4 py-2.5 text-sm font-semibold text-stone-900 outline-none placeholder:text-stone-400 focus:border-amber-700/40 dark:border-white/10 dark:bg-black/20 dark:text-white"
              />
            </label>
            <label className="block sm:w-44">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-amber-900/70 dark:text-amber-200/80">
                თარიღი
              </span>
              <input
                type="date"
                value={active.date}
                onChange={(event) => patchActive({ date: event.target.value })}
                className="w-full rounded-2xl border border-amber-900/10 bg-white/80 px-3 py-2.5 text-sm font-semibold text-stone-900 outline-none focus:border-amber-700/40 dark:border-white/10 dark:bg-black/20 dark:text-white"
              />
            </label>
          </div>

          <p className="mt-3 text-sm font-medium text-amber-950/70 dark:text-amber-100/70">
            {displayTitle} — {formatGeorgianDate(active.date)}
          </p>

          <textarea
            ref={textareaRef}
            value={active.content}
            onChange={(event) => patchActive({ content: event.target.value })}
            placeholder="ჩაწერე ლექცია აქ... მაგ: დღეს გავიარეთ TCP/IP მოდელი, DNS lookup და subnetting..."
            className="mt-3 min-h-[320px] w-full resize-y rounded-3xl border border-amber-900/10 bg-white/75 p-4 text-sm leading-relaxed text-stone-900 outline-none placeholder:text-stone-400 focus:border-amber-700/40 dark:border-white/10 dark:bg-black/25 dark:text-zinc-100"
          />

          {selectedKeyword && (
            <p className="mt-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
              მონიშნული თემა: #{selectedKeyword}
              {highlightCount > 0 ? ` · ${highlightCount} ხსენება ნოტში` : ""}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={togglePin}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold transition ${
                active.pinned
                  ? "bg-amber-900 text-amber-50 hover:bg-amber-800"
                  : "border border-amber-900/20 bg-white/80 text-amber-950 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-amber-50"
              }`}
            >
              {active.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              {active.pinned ? "ამოღება დეშბორდიდან" : "Add as Dashboard Sticker"}
            </button>
            <button
              type="button"
              onClick={deleteActive}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white/70 px-3 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-400/20 dark:bg-white/5 dark:text-rose-300"
            >
              <Trash2 className="h-4 w-4" />
              წაშლა
            </button>
            <AnimatePresence>
              {pinFlash && (
                <motion.span
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-semibold text-amber-900 dark:text-amber-200"
                >
                  {pinFlash}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="flex flex-col gap-4 xl:sticky xl:top-24">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-[#121214]"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">AI საკვანძო თემები</h2>
              {keywordBusy && <LoaderCircle className="h-4 w-4 animate-spin text-amber-700" />}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              თემები ავტომატურად იკრიბება ნოტიდან. დააჭირე — AI აგიხსნის.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {active.aiKeywords.length === 0 ? (
                <span className="text-xs text-slate-400">დაიწყე წერა — თემები აქ გამოჩნდება.</span>
              ) : (
                active.aiKeywords.map((tag) => {
                  const on = selectedKeyword === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onKeywordClick(tag)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        on
                          ? "border-amber-400 bg-amber-100 text-amber-950 dark:border-amber-300/40 dark:bg-amber-400/20 dark:text-amber-100"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200"
                      }`}
                    >
                      #{tag.replace(/\s+/g, "_")}
                    </button>
                  );
                })
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="flex min-h-[340px] flex-col rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-[#121214]"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-700 dark:text-amber-300" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">კონტექსტური AI</h2>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void askAi(prompt)}
                  className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-left text-[11px] font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="mt-3 flex-1 space-y-2 overflow-y-auto rounded-2xl bg-slate-50 p-3 dark:bg-white/[0.03]">
              {turns.length === 0 && (
                <p className="text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
                  ჰკითხე ამ ნოტზე დაყრდნობით — მაგალითად, გაამარტივე აბზაცი ან ააგე სწრაფი ქვიზი.
                </p>
              )}
              {turns.map((turn) => (
                <div
                  key={turn.id}
                  className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    turn.role === "user"
                      ? "ml-6 bg-amber-100 text-amber-950 dark:bg-amber-400/20 dark:text-amber-50"
                      : "mr-4 bg-white text-slate-800 shadow-sm dark:bg-white/10 dark:text-zinc-100"
                  }`}
                >
                  {turn.text || (chatBusy ? "..." : "")}
                </div>
              ))}
            </div>

            {chatError && <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">{chatError}</p>}

            <form
              className="mt-3 flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void askAi(chatInput);
              }}
            >
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="დასვი კითხვა ამ ნოტზე..."
                className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
              <button
                type="submit"
                disabled={chatBusy || !chatInput.trim()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-900 text-amber-50 transition hover:bg-amber-800 disabled:opacity-50"
                aria-label="გაგზავნა"
              >
                {chatBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </motion.section>
        </div>
      </div>
    </section>
  );
}
