"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Bold, Check, ChevronDown, List, Mic, MoreHorizontal, NotebookPen, Pin, Square, Trash2 } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { Toast } from "@/components/ui/Toast";
import { useUserDataStatus } from "@/hooks/useUserDataStatus";
import { useDismiss } from "@/hooks/useDismiss";
import { useSpeechDictation } from "@/hooks/useSpeechDictation";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import type { LectureNotesKeywords } from "@/lib/ai/lecture-notes-schema";
import { setDockHidden } from "@/lib/mobile-overlay";
import { createAutosave, type SaveStatus } from "@/lib/journal-view";
import { readSavedSemesterSubjects, type SemesterSubject } from "@/lib/semester-subjects";
import {
  blankNote,
  cleanKeywords,
  deleteNote,
  getNote,
  hasContent,
  insertAnswer,
  KEYWORDS_MIN_CHARS,
  keywordsHash,
  needsKeywords,
  NO_SUBJECT,
  noteHref,
  saveNote,
  shortNoteDate,
  subjectHref,
  SUBJECT_NOTES_KEY,
  SUBJECT_NOTES_UPDATED_EVENT,
  type AskMessage,
  type SubjectNote,
} from "@/lib/subject-notes";
import { getTopics, SUBJECTS_UPDATED_EVENT } from "@/lib/subject-store";
import type { SubjectTopic } from "@/lib/subjects";
import { localDay } from "@/lib/task-helper";
import { onRemoteUserData } from "@/lib/user-data";
import { AskCard, KeyTopics, MobileAsk, NoteTools, useAskNote } from "./NoteAssist";
import "./subjects.css";

/** Key topics are asked for this long after a save. */
const KEYWORDS_DELAY = 3000;

type Picker = "subject" | "topic" | null;

/** A chip that opens a short list to choose from. */
function ChipPicker({
  label,
  open,
  onOpen,
  onClose,
  tone = "neutral",
  children,
}: {
  label: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  tone?: "pink" | "neutral";
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useDismiss(open, onClose, panel, trigger);
  return (
    <div className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? onClose() : onOpen())}
        className={`sj-focus inline-flex h-8 max-w-[15rem] items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold ${
          tone === "pink" ? "sj-note-chip" : "border border-[var(--sj-field-border)] bg-[var(--sj-card)] text-[var(--sj-title)]"
        }`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
      </button>
      {open ? (
        <div ref={panel} role="menu" className="sj-menu absolute left-0 top-full z-30 mt-1 max-h-72 w-64 overflow-y-auto p-1.5">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function Option({ checked, onSelect, children }: { checked: boolean; onSelect: () => void; children: ReactNode }) {
  return (
    <button type="button" role="menuitemradio" aria-checked={checked} onClick={onSelect} className="sj-menu-item sj-focus">
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {checked ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
    </button>
  );
}

function SaveLine({ status }: { status: SaveStatus }) {
  if (status === "saving") return <span className="text-[13px] font-semibold text-[var(--sj-muted)]">ინახება…</span>;
  if (status === "saved")
    return (
      <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--sj-saved)]">
        <Check className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden />
        შენახულია
      </span>
    );
  return null;
}

/**
 * One lecture note of „ჩემი საგნები“ (/subjects/<id>/notes/<noteId>; `new`
 * for a new one, with `?topic=`): subject, topic and date chips, the title
 * and the text, saved ~800ms after the last keystroke. A new note is saved
 * once something is written in it. Pin to the dashboard, and „⋯“: change
 * the topic, move to another subject, delete.
 *
 * Beside it (below `lg`: chips under the title and a chat sheet): the key
 * topics the AI finds in the text, „ამ ჩანაწერიდან შექმენი“ (quiz, cards,
 * conspectus with the note as the source) and „ჰკითხე ამ ჩანაწერს“.
 */
export function NoteEditor({ subjectId, noteId }: { subjectId: string; noteId: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const syncStatus = useUserDataStatus();
  const [draft, setDraft] = useState<SubjectNote | null>(null);
  const [missing, setMissing] = useState(false);
  const [subjects, setSubjects] = useState<SemesterSubject[]>([]);
  const [topics, setTopics] = useState<SubjectTopic[]>([]);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [picker, setPicker] = useState<Picker>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [keywordsBusy, setKeywordsBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; undo?: () => void } | null>(null);
  const draftRef = useRef<SubjectNote | null>(null);
  const subjectNameRef = useRef<string | null>(null);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const moreTrigger = useRef<HTMLButtonElement>(null);
  const morePanel = useRef<HTMLDivElement>(null);
  useDismiss(
    moreOpen,
    () => {
      setMoreOpen(false);
      setConfirming(false);
    },
    morePanel,
    moreTrigger,
  );

  // The note (or a new one), and what the chips offer.
  const topicParam = search.get("topic") ?? undefined;
  useEffect(() => {
    const load = () => {
      setSubjects(readSavedSemesterSubjects());
      if (noteId === "new") {
        setDraft((current) => current ?? blankNote(subjectId === NO_SUBJECT ? null : subjectId, topicParam, localDay()));
        return;
      }
      const found = getNote(noteId);
      setMissing(!found);
      if (found) setDraft((current) => current ?? found);
    };
    void Promise.resolve().then(load);
    // Not here yet (the account's copy on its way): read again when notes arrive.
    window.addEventListener(SUBJECT_NOTES_UPDATED_EVENT, load);
    return () => window.removeEventListener(SUBJECT_NOTES_UPDATED_EVENT, load);
  }, [noteId, subjectId, topicParam]);

  const noteSubject = draft?.subjectId ?? null;
  useEffect(() => {
    const refresh = () => setTopics(noteSubject ? getTopics(noteSubject) : []);
    void Promise.resolve().then(refresh);
    window.addEventListener(SUBJECTS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(SUBJECTS_UPDATED_EVENT, refresh);
  }, [noteSubject]);

  // Autosave: on this device now, on the account shortly after.
  const autosave = useRef<ReturnType<typeof createAutosave<SubjectNote>> | null>(null);
  const savedOnce = useRef(noteId !== "new");
  const [isSaved, setIsSaved] = useState(noteId !== "new");
  useEffect(() => {
    const saver = createAutosave<SubjectNote>((value) => {
      if (!savedOnce.current && !hasContent(value)) return;
      saveNote(value);
      if (!savedOnce.current) {
        savedOnce.current = true;
        setIsSaved(true);
        // A new note has its own address from now on.
        window.history.replaceState(window.history.state, "", noteHref(value));
      }
    }, setStatus);
    autosave.current = saver;
    return () => saver.flush();
  }, []);

  // Edited on another device: take that copy, unless this one has unsaved changes.
  useEffect(() => {
    if (noteId === "new") return;
    return onRemoteUserData(
      (key) => key === SUBJECT_NOTES_KEY,
      () => {
        if (status === "saving") return;
        const fresh = getNote(noteId);
        if (fresh) setDraft(fresh);
      },
    );
  }, [noteId, status]);

  // The title and the text grow with what's in them.
  const body = draft?.body ?? "";
  const title = draft?.title ?? "";
  useEffect(() => {
    for (const element of [textareaRef.current, titleRef.current]) {
      if (!element) continue;
      element.style.height = "auto";
      element.style.height = `${element.scrollHeight}px`;
    }
  }, [body, title]);

  /** `dropTopic`: out of its topic (moved to another subject, or „თემის გარეშე“). */
  // Always from the latest copy: a streamed answer or the key topics land while typing goes on.
  const change = useCallback((patch: Partial<SubjectNote>, { dropTopic = false } = {}) => {
    const current = draftRef.current;
    if (!current) return;
    // saveNote stamps updatedAt.
    const next = { ...current, ...patch };
    if (dropTopic) delete next.topicId;
    draftRef.current = next;
    setDraft(next);
    autosave.current?.schedule(next);
  }, []);

  // „საკვანძო თემები“: 3 s after a save (or after opening a note that has none yet),
  // once the text is 300+ characters and changed since.
  const keywordsFailed = useRef<string | null>(null);
  const [keywordsFailedFor, setKeywordsFailedFor] = useState<string | null>(null);
  useEffect(() => {
    if (status === "saving") return;
    const timer = window.setTimeout(() => {
      const note = draftRef.current;
      if (!note || !savedOnce.current || !needsKeywords(note)) return;
      const hash = keywordsHash(note);
      if (keywordsFailed.current === hash) return;
      setKeywordsBusy(true);
      fetchAiJson<LectureNotesKeywords>({
        pageType: "lecture-notes",
        responseMode: "json",
        payload: { mode: "keywords", title: note.title, subject: subjectNameRef.current ?? undefined, content: note.body.slice(0, 12_000) },
      })
        .then((data) => {
          const keywords = cleanKeywords(data.keywords ?? []);
          if (keywords.length === 0) throw new Error("no keywords");
          if (draftRef.current?.id === note.id) change({ keywords, keywordsHash: hash });
        })
        .catch(() => {
          // Not again for the same text; the next edit tries again.
          keywordsFailed.current = hash;
          setKeywordsFailedFor(hash);
        })
        .finally(() => setKeywordsBusy(false));
    }, KEYWORDS_DELAY);
    return () => window.clearTimeout(timer);
  }, [status, change]);

  // Dictation: each phrase at the end of the text.
  const dictation = useSpeechDictation((text) => {
    const current = draftRef.current?.body ?? "";
    const glue = !current || /\s$/.test(current) ? "" : " ";
    change({ body: `${current}${glue}${text}` });
  });

  // Phones: the chat pill takes the bottom edge, the dock steps aside.
  useEffect(() => {
    setDockHidden("note-editor", true);
    return () => setDockHidden("note-editor", false);
  }, []);

  /** Moved to another subject (or none): the topic goes, the address follows. */
  const moveTo = (id: string | null) => {
    if (!draft) return;
    setPicker(null);
    if (id === draft.subjectId) return;
    change({ subjectId: id }, { dropTopic: true });
    if (savedOnce.current) window.history.replaceState(window.history.state, "", noteHref({ id: draft.id, subjectId: id }));
  };

  const back = () => {
    autosave.current?.flush();
    router.push(subjectHref(draft?.subjectId ?? null, draft?.topicId));
  };

  const remove = () => {
    if (!draft) return;
    autosave.current?.cancel();
    if (savedOnce.current) deleteNote(draft.id);
    router.push(subjectHref(draft.subjectId, draft.topicId));
  };

  /** Bold around the selection, or a list marker at the line's start. */
  const format = (kind: "bold" | "list") => {
    const element = textareaRef.current;
    const start = element?.selectionStart ?? body.length;
    const end = element?.selectionEnd ?? body.length;
    let next = body;
    let cursor = end;
    if (kind === "bold") {
      next = `${body.slice(0, start)}**${body.slice(start, end)}**${body.slice(end)}`;
      cursor = start === end ? start + 2 : end + 4;
    } else {
      const lineStart = body.lastIndexOf("\n", start - 1) + 1;
      next = `${body.slice(0, lineStart)}- ${body.slice(lineStart)}`;
      cursor = end + 2;
    }
    change({ body: next });
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(cursor, cursor);
    });
  };

  const subject = subjects.find((item) => item.id === draft?.subjectId) ?? null;
  useEffect(() => {
    subjectNameRef.current = subject?.name ?? null;
  }, [subject]);
  const saveHistory = useCallback((askHistory: AskMessage[]) => change({ askHistory }), [change]);
  const ask = useAskNote(draftRef, subject?.name ?? null, saveHistory);
  const insert = useCallback(
    (answer: string) => {
      const before = draftRef.current?.body ?? "";
      const after = insertAnswer(before, answer);
      change({ body: after });
      setToast({
        message: "ჩასმულია ჩანაწერში",
        undo: () => {
          if (draftRef.current?.body === after) change({ body: before });
          setToast(null);
        },
      });
    },
    [change],
  );
  const pickTopic = (topic: string) => {
    setAskOpen(true);
    ask.send(`ამიხსენი: ${topic}`);
  };
  const flush = () => autosave.current?.flush();
  const closeAsk = useCallback(() => setAskOpen(false), []);
  const closeToast = useCallback(() => setToast(null), []);
  const topicIndex = topics.findIndex((topic) => topic.id === draft?.topicId);
  const topic = topicIndex === -1 ? null : topics[topicIndex];
  const crumb = [subject?.name ?? "საგნის გარეშე", topic ? `თემა ${topicIndex + 1}` : null].filter(Boolean).join(" · ");

  if (!draft) {
    return (
      <div className="sj under-site-header min-h-dvh max-md:-mt-[var(--safe-top)]">
        <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-[calc(var(--safe-top)+16px)] sm:px-6 md:pt-10">
          <BackButton fallbackHref={subjectHref(subjectId === NO_SUBJECT ? null : subjectId)} />
          {missing && syncStatus !== "syncing" ? (
            <section className="sj-card mt-6 flex flex-col items-center gap-3 px-6 py-12 text-center">
              <p className="text-[17px] font-bold text-[var(--sj-title)]">ჩანაწერი ვერ მოიძებნა</p>
              <p className="text-[14px] text-[var(--sj-muted)]">შეიძლება წაიშალა.</p>
              <Link href="/subjects" className="sj-primary sj-focus h-11 px-5 text-[14.5px]">
                ჩემი საგნები
              </Link>
            </section>
          ) : (
            <div className="sj-card mt-6 h-80 animate-pulse motion-reduce:animate-none" aria-busy="true" aria-label="ჩანაწერი იტვირთება" />
          )}
        </div>
      </div>
    );
  }

  const toolsReady = Boolean(draft.body.trim());
  const keywordsState = draft.body.trim().length < KEYWORDS_MIN_CHARS ? "short" : keywordsFailedFor === keywordsHash(draft) ? "failed" : "waiting";
  const canAsk = hasContent(draft);
  const pinLabel = draft.pinned ? "მიმაგრებულია დეშბორდზე" : "დეშბორდზე მიმაგრება";
  const menuRow = "sj-menu-item sj-focus";

  return (
    <div className="sj under-site-header min-h-dvh max-md:-mt-[var(--safe-top)] max-md:-mb-36 max-md:pb-36">
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-[calc(var(--safe-top)+16px)] sm:px-6 md:pt-10">
        <header className="flex items-center gap-3 sm:gap-4">
          <BackButton onClick={back} label="საგანზე დაბრუნება" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-[var(--sj-muted)]">{crumb}</p>
            <p className="truncate text-[17px] font-bold text-[var(--sj-title)] sm:text-[19px]">ჩანაწერი</p>
          </div>
          <span className="sm:hidden" aria-live="polite">
            <SaveLine status={status} />
          </span>
          <button
            type="button"
            aria-pressed={draft.pinned}
            onClick={() => change({ pinned: !draft.pinned })}
            className={`sj-secondary sj-focus h-10 px-4 text-[14px] max-sm:!hidden ${draft.pinned ? "!border-[#fbcfe8] !text-[#be185d] dark:!border-[rgba(236,72,153,0.35)] dark:!text-[#f9a8d4]" : ""}`}
          >
            <Pin className="h-4 w-4" aria-hidden />
            {pinLabel}
          </button>
          <div className="relative">
            <button
              ref={moreTrigger}
              type="button"
              aria-label="მეტი"
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              onClick={() => {
                setMoreOpen((value) => !value);
                setConfirming(false);
              }}
              className="sj-secondary sj-focus h-10 w-10"
            >
              <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden />
            </button>
            {moreOpen ? (
              <div ref={morePanel} role="menu" className="sj-menu absolute right-0 top-full z-30 mt-1 w-60 p-1.5">
                {confirming ? (
                  <>
                    <p className="px-3 pb-1 pt-2 text-[13px] text-[var(--sj-muted)]">წავშალოთ ჩანაწერი? ეს ვეღარ დაბრუნდება.</p>
                    <button type="button" role="menuitem" onClick={remove} className={`${menuRow} !text-rose-600 dark:!text-rose-400`}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                      წაშლა
                    </button>
                    <button type="button" role="menuitem" onClick={() => setConfirming(false)} className={menuRow}>
                      გაუქმება
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMoreOpen(false);
                        change({ pinned: !draft.pinned });
                      }}
                      className={`${menuRow} sm:!hidden`}
                    >
                      <Pin className="h-4 w-4" aria-hidden />
                      {draft.pinned ? "დეშბორდიდან მოხსნა" : "დეშბორდზე მიმაგრება"}
                    </button>
                    {draft.subjectId ? (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMoreOpen(false);
                          setPicker("topic");
                        }}
                        className={menuRow}
                      >
                        თემის შეცვლა
                      </button>
                    ) : null}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMoreOpen(false);
                        setPicker("subject");
                      }}
                      className={menuRow}
                    >
                      გადატანა სხვა საგანში
                    </button>
                    <div className="my-1 border-t border-[var(--sj-border)] lg:hidden">
                      <NoteTools noteId={draft.id} ready={draft.body.trim() !== ""} beforeOpen={flush} layout="menu" role="menuitem" />
                    </div>
                    <button type="button" role="menuitem" onClick={() => setConfirming(true)} className={`${menuRow} !text-rose-600 dark:!text-rose-400`}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                      წაშლა
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </header>

        <div className="mx-auto mt-5 flex max-w-[820px] flex-col gap-5 lg:max-w-none lg:flex-row lg:items-start">
        <div className="min-w-0 lg:flex-[1.5]">
        <article className="sj-card p-4 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <ChipPicker label={subject?.name ?? "საგნის გარეშე"} tone="pink" open={picker === "subject"} onOpen={() => setPicker("subject")} onClose={() => setPicker(null)}>
              {subjects.map((item) => (
                <Option key={item.id} checked={item.id === draft.subjectId} onSelect={() => moveTo(item.id)}>
                  {item.name}
                </Option>
              ))}
              <Option checked={!subject} onSelect={() => moveTo(null)}>
                საგნის გარეშე
              </Option>
            </ChipPicker>
            {draft.subjectId ? (
              <ChipPicker label={topic ? topic.title : "თემა"} open={picker === "topic"} onOpen={() => setPicker("topic")} onClose={() => setPicker(null)}>
                {topics.map((item, index) => (
                  <Option
                    key={item.id}
                    checked={item.id === draft.topicId}
                    onSelect={() => {
                      setPicker(null);
                      change({ topicId: item.id });
                    }}
                  >
                    {index + 1}. {item.title}
                  </Option>
                ))}
                <Option
                  checked={!topic}
                  onSelect={() => {
                    setPicker(null);
                    change({}, { dropTopic: true });
                  }}
                >
                  თემის გარეშე
                </Option>
              </ChipPicker>
            ) : null}
            <label className="sj-focus relative inline-flex h-8 cursor-pointer items-center rounded-full border border-[var(--sj-field-border)] bg-[var(--sj-card)] px-3 text-[13px] font-semibold text-[var(--sj-title)] focus-within:shadow-[0_0_0_2px_#e11d74]">
              {shortNoteDate(draft.lectureDate)}
              <span className="sr-only">ლექციის თარიღი</span>
              <input
                type="date"
                value={draft.lectureDate}
                onChange={(event) => event.target.value && change({ lectureDate: event.target.value })}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
            <span className="ml-auto max-sm:hidden" aria-live="polite">
              <SaveLine status={status} />
            </span>
          </div>

          {/* A one-line text area: long titles wrap, and phones keep its size (inputs are forced to 16px there). */}
          <textarea
            ref={titleRef}
            rows={1}
            value={draft.title}
            onChange={(event) => change({ title: event.target.value.replace(/\n/g, " ") })}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              textareaRef.current?.focus();
            }}
            placeholder="ჩანაწერის სათაური"
            aria-label="სათაური"
            className="mt-5 block w-full resize-none bg-transparent !text-[24px] font-bold leading-tight text-[var(--sj-title)] outline-none placeholder:text-[var(--sj-muted)] placeholder:opacity-70 sm:!text-[28px]"
          />

          <div className="lg:hidden">
            <KeyTopics keywords={draft.keywords} busy={keywordsBusy} state={keywordsState} onPick={pickTopic} layout="row" />
          </div>

          <div className="mt-4 flex items-center gap-1 border-y border-[var(--sj-border)] py-2">
            <button type="button" onClick={() => format("bold")} aria-label="მუქი შრიფტი" className="sj-focus flex h-9 w-9 items-center justify-center rounded-full text-[var(--sj-text)] hover:bg-[var(--sj-hover)]">
              <Bold className="h-4 w-4" aria-hidden />
            </button>
            <button type="button" onClick={() => format("list")} aria-label="სია" className="sj-focus flex h-9 w-9 items-center justify-center rounded-full text-[var(--sj-text)] hover:bg-[var(--sj-hover)]">
              <List className="h-4 w-4" aria-hidden />
            </button>
            {dictation.supported ? (
              <>
                <button
                  type="button"
                  aria-pressed={dictation.listening}
                  onClick={() => (dictation.listening ? dictation.stop() : dictation.start())}
                  aria-label={dictation.listening ? "ხმით ჩაწერის შეჩერება" : "ხმით ჩაწერა"}
                  className={`sj-focus flex h-9 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold ${dictation.listening ? "sj-listening px-3" : "w-9 text-[var(--sj-text)] hover:bg-[var(--sj-hover)]"}`}
                >
                  {dictation.listening ? <Square className="h-3.5 w-3.5 fill-current" aria-hidden /> : <Mic className="h-4 w-4" aria-hidden />}
                  {dictation.listening ? "ისმის…" : null}
                </button>
                <span className="ml-auto truncate pl-2 text-[12.5px] text-[var(--sj-muted)] max-sm:hidden">ხმით ჩაწერა ლექციის დროს</span>
              </>
            ) : null}
          </div>
          {dictation.error ? (
            <p role="alert" className="mt-2 text-[13px] font-medium text-rose-600 dark:text-rose-400">
              {dictation.error}
            </p>
          ) : null}

          <textarea
            ref={textareaRef}
            value={draft.body}
            onChange={(event) => change({ body: event.target.value })}
            placeholder="ჩაწერე ლექცია აქ…"
            aria-label="ჩანაწერის ტექსტი"
            rows={10}
            className="mt-4 block min-h-[16rem] w-full resize-none bg-transparent text-[15.5px] leading-[1.5] text-[var(--sj-title)] outline-none placeholder:text-[var(--sj-muted)]"
          />
        </article>

        {!isSaved && !hasContent(draft) ? (
          <p className="mt-3 flex items-center gap-2 px-1 text-[13px] text-[var(--sj-muted)]">
            <NotebookPen className="h-4 w-4" aria-hidden />
            ჩანაწერი შეინახება, როგორც კი რამეს დაწერ.
          </p>
        ) : null}
        </div>

        <aside className="hidden min-w-0 flex-col gap-4 lg:flex lg:flex-1">
          <KeyTopics keywords={draft.keywords} busy={keywordsBusy} state={keywordsState} onPick={(topic) => ask.send(`ამიხსენი: ${topic}`)} />
          <NoteTools noteId={draft.id} ready={toolsReady} beforeOpen={flush} />
          <AskCard history={draft.askHistory} ask={ask} keywords={draft.keywords} onInsert={insert} canAsk={canAsk} />
        </aside>
        </div>

        <MobileAsk
          open={askOpen}
          onOpen={() => setAskOpen(true)}
          onClose={closeAsk}
          noteId={draft.id}
          toolsReady={toolsReady}
          beforeOpenTool={flush}
          history={draft.askHistory}
          ask={ask}
          keywords={draft.keywords}
          onInsert={insert}
          canAsk={canAsk}
        />
        {toast ? <Toast message={toast.message} actionLabel={toast.undo ? "დაბრუნება" : undefined} onAction={toast.undo} onClose={closeToast} /> : null}
      </div>
    </div>
  );
}
