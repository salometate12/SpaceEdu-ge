"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  LoaderCircle,
  Pin,
  PinOff,
  Save,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { fetchAiJson, fetchAiTextStream } from "@/lib/ai/fetch-ai";
import type { LectureNotesKeywords } from "@/lib/ai/lecture-notes-schema";
import { recordToolUsage } from "@/lib/activity";
import { useCurrentUserFirstName } from "@/hooks/useCurrentUserFirstName";
import {
  JOURNAL_SECTIONS,
  awardJournalSave,
  createBlankLectureNote,
  extractLocalKeywords,
  formatGeorgianDate,
  isJournalSection,
  journalSectionMeta,
  loadJournalProgress,
  loadLectureNotes,
  notesInSection,
  saveJournalProgress,
  saveLectureNotes,
  upsertLectureNote,
  type JournalProgress,
  type JournalSection,
  type LectureNote,
} from "@/lib/lecture-notes";
import { JournalStickers } from "./JournalStickers";
import { OpenNotebook } from "./OpenNotebook";

const QUICK_PROMPTS = [
  "ვერ გავანალიზე ეს აბზაცი და მარტივად აგიხსენი",
  "შემქმენი 3-კითხვიანი სწრაფი ქვიზი ამ ნოტიდან",
];

interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
}

function fireSaveConfetti() {
  confetti({
    particleCount: 70,
    spread: 72,
    startVelocity: 32,
    gravity: 0.95,
    scalar: 0.9,
    origin: { x: 0.5, y: 0.42 },
    colors: ["#F9A8D4", "#FDE047", "#5EEAD4", "#C2186B", "#7DD3FC"],
    disableForReducedMotion: true,
  });
}

export function LectureNotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("id");
  const requestedTab = searchParams.get("tab");
  const firstName = useCurrentUserFirstName();

  const [notes, setNotes] = useState<LectureNote[]>([]);
  const [section, setSection] = useState<JournalSection>("lectures");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [keywordBusy, setKeywordBusy] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [pinFlash, setPinFlash] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [aiOpen, setAiOpen] = useState(false);
  const [progress, setProgress] = useState<JournalProgress>({
    xp: 0,
    streak: 0,
    lastSaveDate: null,
    unlocked: {},
  });
  const [xpBurst, setXpBurst] = useState<number | null>(null);
  const [flipDirection, setFlipDirection] = useState(1);

  const saveTimer = useRef<number | null>(null);
  const keywordTimer = useRef<number | null>(null);
  const keywordAbort = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const notesRef = useRef<LectureNote[]>([]);

  const sectionNotes = useMemo(() => notesInSection(notes, section), [notes, section]);
  const active = sectionNotes.find((note) => note.id === activeId) ?? sectionNotes[0] ?? null;
  const pageIndex = active ? Math.max(0, sectionNotes.findIndex((note) => note.id === active.id)) : 0;
  notesRef.current = notes;
  const meta = journalSectionMeta(section);

  const persist = useCallback((nextNotes: LectureNote[]) => {
    setNotes(nextNotes);
    saveLectureNotes(nextNotes);
  }, []);

  const syncUrl = useCallback(
    (nextId: string, nextSection: JournalSection) => {
      const current = new URLSearchParams(window.location.search);
      if (current.get("id") === nextId && current.get("tab") === nextSection) return;
      router.replace(`/lecture-notes?tab=${nextSection}&id=${encodeURIComponent(nextId)}`, {
        scroll: false,
      });
    },
    [router],
  );

  useEffect(() => {
    recordToolUsage("lecture-notes", "ციფრული ჟურნალი");
    const loaded = loadLectureNotes();
    const url = new URLSearchParams(window.location.search);
    const idFromUrl = url.get("id");
    const tabFromUrl = url.get("tab");
    const startSection = isJournalSection(tabFromUrl) ? tabFromUrl : "lectures";
    let nextNotes = loaded;
    let startNotes = notesInSection(nextNotes, startSection);
    if (startNotes.length === 0) {
      const blank = createBlankLectureNote(startSection);
      nextNotes = [blank, ...nextNotes];
      persist(nextNotes);
      startNotes = [blank];
    } else {
      setNotes(nextNotes);
    }
    const match = idFromUrl ? nextNotes.find((note) => note.id === idFromUrl) : null;
    const initial = match ?? startNotes[0];
    setSection(match?.section ?? startSection);
    setActiveId(initial.id);
    setProgress(loadJournalProgress());
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated || !requestedId) return;
    const match = notes.find((note) => note.id === requestedId);
    if (!match) return;
    setSection(match.section);
    setActiveId(match.id);
  }, [hydrated, notes, requestedId]);

  useEffect(() => {
    if (!hydrated || !requestedTab || !isJournalSection(requestedTab)) return;
    setSection(requestedTab);
  }, [hydrated, requestedTab]);

  useEffect(() => {
    if (!hydrated || !activeId) return;
    syncUrl(activeId, section);
  }, [activeId, hydrated, section, syncUrl]);

  const patchActive = useCallback(
    (patch: Partial<LectureNote>) => {
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
    },
    [activeId],
  );

  const applyKeywords = useCallback((noteId: string, tags: string[]) => {
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
  }, []);

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
    setAiOpen(true);
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

  const createNote = (nextSection: JournalSection = section) => {
    const blank = createBlankLectureNote(nextSection);
    persist([blank, ...notes]);
    setFlipDirection(1);
    setSection(nextSection);
    setActiveId(blank.id);
    setSelectedKeyword(null);
    setTurns([]);
  };

  const changeSection = (next: JournalSection) => {
    if (next === section) return;
    const currentIndex = JOURNAL_SECTIONS.findIndex((item) => item.id === section);
    const nextIndex = JOURNAL_SECTIONS.findIndex((item) => item.id === next);
    setFlipDirection(nextIndex >= currentIndex ? 1 : -1);
    const existing = notesInSection(notes, next);
    if (existing.length === 0) {
      createNote(next);
      return;
    }
    setSection(next);
    setActiveId(existing[0].id);
    setTurns([]);
    setSelectedKeyword(null);
  };

  const goToPage = (index: number) => {
    const target = sectionNotes[index];
    if (!target || target.id === activeId) return;
    setFlipDirection(index > pageIndex ? 1 : -1);
    setActiveId(target.id);
    setTurns([]);
    setSelectedKeyword(null);
  };

  const deleteActive = () => {
    if (!active) return;
    const remaining = notes.filter((note) => note.id !== active.id);
    const leftover = notesInSection(remaining, section);
    if (leftover.length === 0) {
      const blank = createBlankLectureNote(section);
      persist([blank, ...remaining]);
      setActiveId(blank.id);
    } else {
      persist(remaining);
      setActiveId(leftover[0].id);
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

  const saveWithXp = () => {
    if (!active) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveLectureNotes(notesRef.current);
    const awarded = awardJournalSave(progress);
    setProgress(awarded.progress);
    saveJournalProgress(awarded.progress);
    setXpBurst(awarded.xpGained);
    fireSaveConfetti();
    window.setTimeout(() => setXpBurst(null), 1600);
  };

  const unlockSticker = (id: string) => {
    setProgress((prev) => {
      const next = { ...prev, unlocked: { ...prev.unlocked, [id]: true } };
      saveJournalProgress(next);
      return next;
    });
    confetti({
      particleCount: 28,
      spread: 50,
      origin: { x: 0.68, y: 0.45 },
      colors: ["#FDE047", "#F9A8D4", "#5EEAD4"],
      disableForReducedMotion: true,
    });
  };

  if (!hydrated || !active) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#C2186B] text-sm font-semibold text-white/80">
        რვეული იხსნება...
      </div>
    );
  }

  const displayTitle = active.title.trim() || meta.heading;
  const studentLabel = firstName || "SpaceEdu";

  return (
    <div className="relative min-h-[calc(100dvh-4rem)] overflow-x-clip bg-[#C2186B]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_36%),radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.12),transparent_40%)]" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pb-1 pt-5 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard-student"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            aria-label="დეშბორდი"
          >
            ←
          </Link>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-pink-100/80">Open Notebook</p>
            <h1 className="text-xl font-black text-white sm:text-2xl">ციფრული ჟურნალი</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={saveWithXp}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-black text-[#C2186B] shadow-sm transition hover:bg-pink-50"
          >
            <Save className="h-4 w-4" />
            შენახვა
          </button>
          <button
            type="button"
            onClick={togglePin}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-sm font-bold text-white transition hover:bg-white/25"
          >
            {active.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            {active.pinned ? "პინის მოხსნა" : "დეშბორდზე"}
          </button>
          <button
            type="button"
            onClick={deleteActive}
            className="inline-flex items-center gap-1.5 rounded-full bg-black/15 px-3 py-2 text-sm font-bold text-white/90 transition hover:bg-black/25"
          >
            <Trash2 className="h-4 w-4" />
            წაშლა
          </button>
        </div>
      </div>

      <AnimatePresence>
        {xpBurst != null && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.9 }}
            animate={{ opacity: 1, y: -12, scale: 1 }}
            exit={{ opacity: 0, y: -36 }}
            className="pointer-events-none absolute left-1/2 top-28 z-40 -translate-x-1/2 rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-amber-950 shadow-lg"
          >
            +{xpBurst} XP
          </motion.div>
        )}
      </AnimatePresence>

      <OpenNotebook
        section={section}
        onSectionChange={changeSection}
        flipKey={`${section}-${active.id}`}
        flipDirection={flipDirection}
        onNewNote={() => createNote(section)}
        onPrevPage={() => goToPage(pageIndex - 1)}
        onNextPage={() => goToPage(pageIndex + 1)}
        canPrev={pageIndex > 0}
        canNext={pageIndex < sectionNotes.length - 1}
        leftHeaderLeft={studentLabel}
        leftHeaderRight={formatGeorgianDate(active.date)}
        rightHeaderLeft={meta.label}
        rightHeaderRight={`გვერდი ${pageIndex + 1} / ${sectionNotes.length}`}
        leftPage={
          <div className="relative flex min-h-0 flex-1 flex-col">
            <label className="block">
              <span className="sr-only">სათაური</span>
              <input
                value={active.title}
                onChange={(event) => patchActive({ title: event.target.value })}
                placeholder={meta.heading}
                className="w-full bg-transparent text-3xl font-black tracking-tight outline-none placeholder:opacity-40 sm:text-4xl"
                style={{ color: meta.headingColor }}
              />
            </label>
            <label className="mt-1 block w-40">
              <span className="sr-only">თარიღი</span>
              <input
                type="date"
                value={active.date}
                onChange={(event) => patchActive({ date: event.target.value })}
                className="w-full bg-transparent text-xs font-semibold text-stone-400 outline-none"
              />
            </label>
            <textarea
              ref={textareaRef}
              value={active.content}
              onChange={(event) => patchActive({ content: event.target.value })}
              placeholder={meta.placeholder}
              className="mt-4 min-h-[320px] w-full flex-1 resize-none bg-transparent text-[15px] text-stone-700 outline-none placeholder:text-stone-400"
              style={{
                lineHeight: "32px",
                backgroundImage:
                  "repeating-linear-gradient(transparent, transparent 31px, rgba(196,80,120,0.22) 32px)",
                backgroundAttachment: "local",
              }}
            />
            {pinFlash && (
              <p className="mt-2 text-xs font-semibold text-rose-500">{pinFlash}</p>
            )}
          </div>
        }
        rightPage={
          <div className="flex min-h-0 flex-1 flex-col">
            <p
              className="text-3xl font-black tracking-tight sm:text-4xl"
              style={{
                color: "#FB7185",
                WebkitTextStroke: "1.5px #FB7185",
              }}
            >
              სტიკერები
            </p>
            <JournalStickers
              xp={progress.xp}
              streak={progress.streak}
              unlocked={progress.unlocked}
              onUnlock={unlockSticker}
            />
            <div className="mt-auto border-t border-[#E8A0B8] pt-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xl font-black tracking-tight text-pink-400" style={{ WebkitTextStroke: "1px #F472B6" }}>
                  თემები
                </p>
                {keywordBusy && <LoaderCircle className="h-4 w-4 animate-spin text-pink-400" />}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {active.aiKeywords.length === 0 ? (
                  <span className="text-xs text-stone-400">დაიწყე წერა — თემები აქ გამოჩნდება.</span>
                ) : (
                  active.aiKeywords.map((tag) => {
                    const on = selectedKeyword === tag;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => onKeywordClick(tag)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                          on
                            ? "border-pink-400 bg-pink-100 text-pink-800"
                            : "border-stone-200 bg-white text-stone-600 hover:border-pink-300"
                        }`}
                      >
                        #{tag.replace(/\s+/g, "_")}
                      </button>
                    );
                  })
                )}
              </div>
              <button
                type="button"
                onClick={() => setAiOpen((open) => !open)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {aiOpen ? "AI პანელის დახურვა" : "AI ამ ნოტზე"}
              </button>
            </div>
          </div>
        }
      />

      <AnimatePresence>
        {aiOpen && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="relative mx-auto mb-8 w-full max-w-3xl rounded-[28px] bg-[#FFFDF8] p-5 shadow-[0_16px_40px_rgba(80,0,30,0.2)]"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-700" />
              <h2 className="text-sm font-bold text-stone-900">კონტექსტური AI · {displayTitle}</h2>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void askAi(prompt)}
                  className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-left text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-2xl bg-stone-50 p-3">
              {turns.length === 0 && (
                <p className="text-xs leading-relaxed text-stone-500">
                  ჰკითხე ამ ნოტზე დაყრდნობით — მაგალითად, გაამარტივე აბზაცი ან ააგე სწრაფი ქვიზი.
                </p>
              )}
              {turns.map((turn) => (
                <div
                  key={turn.id}
                  className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    turn.role === "user"
                      ? "ml-6 bg-amber-100 text-amber-950"
                      : "mr-4 bg-white text-stone-800 shadow-sm"
                  }`}
                >
                  {turn.text || (chatBusy ? "..." : "")}
                </div>
              ))}
            </div>
            {chatError && <p className="mt-2 text-xs text-rose-600">{chatError}</p>}
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
                className="flex-1 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-pink-300"
              />
              <button
                type="submit"
                disabled={chatBusy || !chatInput.trim()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#C2186B] text-white transition hover:bg-[#ad155f] disabled:opacity-50"
                aria-label="გაგზავნა"
              >
                {chatBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
