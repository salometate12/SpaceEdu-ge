"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  LoaderCircle,
  NotebookPen,
  Plus,
  Send,
  Sparkles,
  StickyNote,
  Trash2,
} from "lucide-react";
import { fetchAiJson, fetchAiTextStream } from "@/lib/ai/fetch-ai";
import type { LectureNotesKeywords } from "@/lib/ai/lecture-notes-schema";
import { recordToolUsage } from "@/lib/activity";
import {
  ABIT_LECTURE_NOTES_UPDATED_EVENT,
  createBlankLectureNote,
  extractLocalKeywords,
  formatGeorgianDate,
  loadAbitLectureNotes,
  saveAbitLectureNotes,
  upsertLectureNote,
  type LectureNote,
} from "@/lib/abit-lecture-notes";

const QUICK_PROMPTS = [
  "ეს აბზაცი ვერ გავიგე — მარტივად ამიხსენი",
  "შემიქმენი 3-კითხვიანი სწრაფი ქვიზი ამ ნოტიდან",
  "გამომიყვანე მთავარი დასამახსოვრებელი პუნქტები",
];

interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export function AbiturientLectureNotesWidget() {
  const [notes, setNotes] = useState<LectureNote[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [keywordBusy, setKeywordBusy] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);

  const keywordTimer = useRef<number | null>(null);
  const keywordAbort = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const active =
    notes.find((note) => note.id === activeId) ?? notes[0] ?? null;

  useEffect(() => {
    const hydrate = () => {
      recordToolUsage("abit-lecture-notes", "აბიტურიენტის ნოტები");
      const loaded = loadAbitLectureNotes();
      if (loaded.length === 0) {
        const blank = createBlankLectureNote();
        setNotes([blank]);
        setActiveId(blank.id);
        saveAbitLectureNotes([blank]);
      } else {
        setNotes(loaded);
        setActiveId(loaded[0].id);
      }
      setHydrated(true);
    };
    hydrate();
  }, []);

  // Debounced persistence — one place writes storage.
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      saveAbitLectureNotes(notes);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [notes, hydrated]);

  // Pick up edits made in another tab / elsewhere in the app.
  useEffect(() => {
    const sync = () => {
      const loaded = loadAbitLectureNotes();
      if (loaded.length === 0) return;
      setNotes(loaded);
      setActiveId((current) =>
        current && loaded.some((note) => note.id === current)
          ? current
          : loaded[0].id,
      );
    };
    window.addEventListener("storage", sync);
    window.addEventListener(ABIT_LECTURE_NOTES_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(ABIT_LECTURE_NOTES_UPDATED_EVENT, sync);
    };
  }, []);

  const patchActive = useCallback(
    (patch: Partial<LectureNote>) => {
      const stamp = Date.now();
      setNotes((prev) => {
        const current = prev.find((note) => note.id === activeId);
        if (!current) return prev;
        return upsertLectureNote(prev, {
          ...current,
          ...patch,
          updatedAt: stamp,
        });
      });
    },
    [activeId],
  );

  const applyKeywords = useCallback((noteId: string, tags: string[]) => {
    const stamp = Date.now();
    setNotes((prev) => {
      const current = prev.find((note) => note.id === noteId);
      if (!current) return prev;
      if (current.aiKeywords.join("|") === tags.join("|")) return prev;
      return upsertLectureNote(prev, {
        ...current,
        aiKeywords: tags,
        updatedAt: stamp,
      });
    });
  }, []);

  const activeContent = active?.content;
  const activeTitle = active?.title;
  const activeKeyId = active?.id;

  useEffect(() => {
    if (!activeKeyId || activeContent === undefined) return;
    if (keywordTimer.current) window.clearTimeout(keywordTimer.current);
    keywordTimer.current = window.setTimeout(() => {
      const local = extractLocalKeywords(activeContent);
      if (activeContent.trim().length < 40) {
        applyKeywords(activeKeyId, local);
        return;
      }
      keywordAbort.current?.abort();
      const controller = new AbortController();
      keywordAbort.current = controller;
      const markBusy = (value: boolean) => setKeywordBusy(value);
      markBusy(true);
      void fetchAiJson<LectureNotesKeywords>({
        pageType: "lecture-notes",
        responseMode: "json",
        signal: controller.signal,
        payload: {
          mode: "keywords",
          title: activeTitle,
          content: activeContent,
        },
      })
        .then((data) => {
          const tags = data.keywords
            .map((tag) => tag.replace(/^#/, "").trim())
            .filter(Boolean);
          applyKeywords(activeKeyId, tags.length ? tags.slice(0, 8) : local);
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          applyKeywords(activeKeyId, local);
          console.warn(error);
        })
        .finally(() => {
          if (!controller.signal.aborted) markBusy(false);
        });
    }, 1400);
    return () => {
      if (keywordTimer.current) window.clearTimeout(keywordTimer.current);
    };
  }, [activeContent, activeKeyId, activeTitle, applyKeywords]);

  const askAi = useCallback(
    async (message: string, keyword?: string | null) => {
      if (!active || chatBusy) return;
      const trimmed = message.trim();
      if (!trimmed) return;
      setChatInput("");
      setChatError(null);
      const userTurn: ChatTurn = {
        id: crypto.randomUUID(),
        role: "user",
        text: trimmed,
      };
      const assistantId = crypto.randomUUID();
      setTurns((prev) => [
        ...prev,
        userTurn,
        { id: assistantId, role: "assistant", text: "" },
      ]);
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
              prev.map((turn) =>
                turn.id === assistantId ? { ...turn, text: partial } : turn,
              ),
            );
          },
        );
      } catch (error) {
        setChatError(
          error instanceof Error
            ? error.message
            : "AI ამჟამად მიუწვდომელია. სცადე კიდევ ერთხელ.",
        );
        setTurns((prev) => prev.filter((turn) => turn.id !== assistantId));
      } finally {
        setChatBusy(false);
      }
    },
    [active, chatBusy, selectedKeyword],
  );

  const onKeywordClick = (tag: string) => {
    const next = selectedKeyword === tag ? null : tag;
    setSelectedKeyword(next);
    if (!next || !active) return;
    const count = active.content.split(tag).length - 1;
    void askAi(
      `"${tag}" — მოკლედ ამიხსენი ამ ნოტის კონტექსტში.${
        count > 0 ? ` ნოტში ${count}-ჯერ გვხვდება.` : ""
      }`,
      tag,
    );
  };

  const createNote = () => {
    const blank = createBlankLectureNote();
    setNotes((prev) => [blank, ...prev]);
    setActiveId(blank.id);
    setSelectedKeyword(null);
    setTurns([]);
    textareaRef.current?.focus();
  };

  const deleteActive = () => {
    if (!active) return;
    const removedId = active.id;
    const remaining = notes.filter((note) => note.id !== removedId);
    if (remaining.length === 0) {
      const blank = createBlankLectureNote();
      setNotes([blank]);
      setActiveId(blank.id);
    } else {
      setNotes(remaining);
      setActiveId(remaining[0].id);
    }
    setTurns([]);
    setSelectedKeyword(null);
  };

  const highlightCount = useMemo(() => {
    if (!active || !selectedKeyword) return 0;
    return Math.max(0, active.content.split(selectedKeyword).length - 1);
  }, [active, selectedKeyword]);

  const displayTitle = active?.title.trim() || "ახალი ნოტი";

  return (
    <section className="dashboard-section p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <NotebookPen
            className="h-6 w-6 text-emerald-600 dark:text-emerald-400"
            strokeWidth={1.5}
          />
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              ჩემი ნოტები
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              ჩაწერე მასალა, AI ამოიღებს საკვანძო თემებს და გიპასუხებს ნოტზე
              დაყრდნობით — მხოლოდ აბიტურიენტის სივრცეში.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={createNote}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" />
          ახალი ნოტი
        </button>
      </div>

      {!hydrated || !active ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-zinc-500">
          ნოტები იტვირთება...
        </p>
      ) : (
        <>
          {notes.length > 1 && (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
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
                        ? "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-400/15 dark:text-emerald-100"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300"
                    }`}
                  >
                    <StickyNote className="h-3.5 w-3.5" />
                    <span className="max-w-[10rem] truncate">
                      {note.title.trim() || "უსათაურო"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-emerald-200/80 bg-emerald-50/70 p-4 dark:border-emerald-300/15 dark:bg-emerald-300/[0.06] sm:p-5"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-emerald-800/70 dark:text-emerald-200/80">
                    ნოტის სათაური
                  </span>
                  <input
                    value={active.title}
                    onChange={(event) =>
                      patchActive({ title: event.target.value })
                    }
                    placeholder="მაგ: ბიოლოგია — ფოტოსინთეზი"
                    className="w-full rounded-2xl border border-emerald-900/10 bg-white/85 px-4 py-2.5 text-sm font-semibold text-stone-900 outline-none placeholder:text-stone-400 focus:border-emerald-600/40 dark:border-white/10 dark:bg-black/20 dark:text-white"
                  />
                </label>
                <label className="block sm:w-44">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-emerald-800/70 dark:text-emerald-200/80">
                    თარიღი
                  </span>
                  <input
                    type="date"
                    value={active.date}
                    onChange={(event) =>
                      patchActive({ date: event.target.value })
                    }
                    className="w-full rounded-2xl border border-emerald-900/10 bg-white/85 px-3 py-2.5 text-sm font-semibold text-stone-900 outline-none focus:border-emerald-600/40 dark:border-white/10 dark:bg-black/20 dark:text-white"
                  />
                </label>
              </div>

              <p className="mt-3 text-sm font-medium text-emerald-900/70 dark:text-emerald-100/70">
                {displayTitle} — {formatGeorgianDate(active.date)}
              </p>

              <textarea
                ref={textareaRef}
                value={active.content}
                onChange={(event) =>
                  patchActive({ content: event.target.value })
                }
                placeholder="ჩაწერე მასალა აქ... AI ავტომატურად ამოიღებს საკვანძო თემებს."
                className="mt-3 min-h-[240px] w-full resize-y rounded-3xl border border-emerald-900/10 bg-white/80 p-4 text-sm leading-relaxed text-stone-900 outline-none placeholder:text-stone-400 focus:border-emerald-600/40 dark:border-white/10 dark:bg-black/25 dark:text-zinc-100"
              />

              {selectedKeyword && (
                <p className="mt-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                  მონიშნული თემა: #{selectedKeyword}
                  {highlightCount > 0
                    ? ` · ${highlightCount} ხსენება ნოტში`
                    : ""}
                </p>
              )}

              <div className="mt-4">
                <button
                  type="button"
                  onClick={deleteActive}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white/70 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-400/20 dark:bg-white/5 dark:text-rose-300"
                >
                  <Trash2 className="h-4 w-4" />
                  ნოტის წაშლა
                </button>
              </div>
            </motion.div>

            <div className="flex flex-col gap-4">
              <section className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-[#121214] sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    AI საკვანძო თემები
                  </h4>
                  {keywordBusy && (
                    <LoaderCircle className="h-4 w-4 animate-spin text-emerald-600" />
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  თემები ავტომატურად იკრიბება. დააჭირე — AI აგიხსნის.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {active.aiKeywords.length === 0 ? (
                    <span className="text-xs text-slate-400">
                      დაიწყე წერა — თემები აქ გამოჩნდება.
                    </span>
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
                              ? "border-emerald-400 bg-emerald-100 text-emerald-900 dark:border-emerald-300/40 dark:bg-emerald-400/20 dark:text-emerald-100"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200"
                          }`}
                        >
                          #{tag.replace(/\s+/g, "_")}
                        </button>
                      );
                    })
                  )}
                </div>
              </section>

              <section className="flex min-h-[300px] flex-col rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-[#121214] sm:p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    კონტექსტური AI
                  </h4>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void askAi(prompt)}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-left text-[11px] font-semibold text-emerald-900 hover:bg-emerald-100 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex-1 space-y-2 overflow-y-auto rounded-2xl bg-slate-50 p-3 dark:bg-white/[0.03]">
                  {turns.length === 0 ? (
                    <p className="text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
                      ჰკითხე ამ ნოტზე დაყრდნობით — გაამარტივე აბზაცი ან ააგე
                      სწრაფი ქვიზი.
                    </p>
                  ) : (
                    turns.map((turn) => (
                      <div
                        key={turn.id}
                        className={`whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                          turn.role === "user"
                            ? "ml-6 bg-emerald-100 text-emerald-950 dark:bg-emerald-400/20 dark:text-emerald-50"
                            : "mr-4 bg-white text-slate-800 shadow-sm dark:bg-white/10 dark:text-zinc-100"
                        }`}
                      >
                        {turn.text || (chatBusy ? "..." : "")}
                      </div>
                    ))
                  )}
                </div>

                {chatError && (
                  <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">
                    {chatError}
                  </p>
                )}

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
                    className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={chatBusy || !chatInput.trim()}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-500 disabled:opacity-50"
                    aria-label="გაგზავნა"
                  >
                    {chatBusy ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
              </section>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
