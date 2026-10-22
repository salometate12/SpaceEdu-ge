"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bold,
  Check,
  ChevronDown,
  Copy,
  Heading,
  ImageIcon,
  List,
  LoaderCircle,
  MoreHorizontal,
  Pin,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { fetchAiJson, fetchAiTextStream } from "@/lib/ai/fetch-ai";
import type { LectureNotesKeywords } from "@/lib/ai/lecture-notes-schema";
import { JOURNAL_CATEGORIES, journalCategory } from "@/lib/journal-categories";
import { createAutosave, enoughForAi, formatJournalDate, noteText, type SaveStatus } from "@/lib/journal-view";
import { awardJournalSave, loadJournalProgress, saveJournalProgress, type LectureNote } from "@/lib/lecture-notes";
import { setDockHidden } from "@/lib/mobile-overlay";
import { readSemesterSubjects } from "@/lib/semester-subjects";
import { AI_TEACHER_PROMPT_KEY } from "@/lib/syllabus-calendar";
import { handOff } from "@/lib/tool-handoff";
import { CategoryDot } from "./CategoryDot";
import { CategoryLabel, JOURNAL_HEADER, JOURNAL_ICON_BUTTON } from "./JournalList";

/** Text handed to the AI teacher stays well inside a prompt. */
const HANDOFF_LIMIT = 6000;

/** How far the on-screen keyboard covers the page (0 without one). */
function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        setInset(Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop))),
      );
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);
  return inset;
}

/** A small menu anchored to its button (closes on Esc or a tap outside). */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);
  return ref;
}

const MENU = "absolute z-40 mt-2 min-w-[13rem] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-1.5 shadow-[0_12px_32px_-12px_rgb(15_23_42/0.3)]";
const MENU_ITEM =
  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)] focus-visible:bg-[var(--bg-secondary)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45";
const CHIP =
  "inline-flex h-9 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3.5 text-[13.5px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)]";

/**
 * One journal entry: a clean sheet that saves itself (~800ms after the last
 * keystroke), category and subject chips, pin and a „⋯“ menu, and a
 * toolbar — on a phone above the keyboard, in place of the dock — with
 * heading / bold / list and „AI დახმარება“.
 */
export function JournalEditor({
  note,
  onSave,
  onDelete,
  onBack,
}: {
  note: LectureNote;
  onSave: (note: LectureNote) => void;
  onDelete: (note: LectureNote) => void;
  onBack: () => void;
}) {
  const router = useRouter();
  // The older two-page notes become one text here; it's saved as such.
  const [draft, setDraft] = useState<LectureNote>(() => ({ ...note, content: noteText(note), contentRight: undefined }));
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [subjects] = useState(() => readSemesterSubjects().subjects.map((subject) => subject.name));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const keyboard = useKeyboardInset();

  // Autosave; the journal's XP still counts — once per visit that changes
  // the entry — it just isn't shown any more.
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  });
  const autosave = useRef<ReturnType<typeof createAutosave<LectureNote>> | null>(null);
  useEffect(() => {
    let awarded = false;
    const saver = createAutosave<LectureNote>(
      (value) => {
        onSaveRef.current(value);
        if (!awarded) {
          awarded = true;
          saveJournalProgress(awardJournalSave(loadJournalProgress()).progress);
        }
      },
      setStatus,
    );
    autosave.current = saver;
    // Leaving the editor saves what's pending.
    return () => saver.flush();
  }, []);

  // The toolbar takes the dock's place on phones.
  useEffect(() => {
    setDockHidden("journal-editor", true);
    return () => setDockHidden("journal-editor", false);
  }, []);

  // The text area grows with its text.
  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [draft.content]);

  const change = (patch: Partial<LectureNote>) => {
    const next = { ...draft, ...patch, updatedAt: Date.now() };
    setDraft(next);
    autosave.current?.schedule(next);
  };

  const back = () => {
    autosave.current?.flush();
    onBack();
  };

  const moreRef = useDismiss(moreOpen, () => {
    setMoreOpen(false);
    setConfirmDelete(false);
  });
  const categoryRef = useDismiss(categoryOpen, () => setCategoryOpen(false));
  const subjectRef = useDismiss(subjectOpen, () => setSubjectOpen(false));
  const aiRef = useDismiss(aiOpen, () => setAiOpen(false));

  const text = draft.content;
  const fullText = `${draft.title.trim() ? `${draft.title.trim()}\n\n` : ""}${text}`;
  const canAi = enoughForAi(text);
  const category = journalCategory(draft.section);

  /** Edits the textarea at the cursor and keeps the selection. */
  const format = (kind: "heading" | "bold" | "list") => {
    const element = textareaRef.current;
    const start = element?.selectionStart ?? text.length;
    const end = element?.selectionEnd ?? text.length;
    let next = text;
    let cursor = end;
    if (kind === "bold") {
      next = `${text.slice(0, start)}**${text.slice(start, end)}**${text.slice(end)}`;
      cursor = start === end ? start + 2 : end + 4;
    } else {
      const lineStart = text.lastIndexOf("\n", start - 1) + 1;
      const marker = kind === "heading" ? "## " : "- ";
      next = `${text.slice(0, lineStart)}${marker}${text.slice(lineStart)}`;
      cursor = end + marker.length;
    }
    change({ content: next });
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(cursor, cursor);
    });
  };

  const summarize = async () => {
    setAiBusy("summary");
    setAiError(null);
    try {
      const summary = await fetchAiTextStream(
        {
          pageType: "lecture-notes",
          responseMode: "stream",
          payload: { mode: "chat", title: draft.title, content: text, message: "შეაჯამე ეს ჩანაწერი 3–5 მოკლე პუნქტად." },
        },
        () => {},
      );
      if (summary.trim()) change({ content: `${text.trimEnd()}\n\n**შეჯამება**\n${summary.trim()}\n` });
      setAiOpen(false);
    } catch {
      setAiError("AI ამჟამად მიუწვდომელია. სცადე კიდევ ერთხელ.");
    } finally {
      setAiBusy(null);
    }
  };

  const keywords = async () => {
    setAiBusy("keywords");
    setAiError(null);
    try {
      const data = await fetchAiJson<LectureNotesKeywords>({
        pageType: "lecture-notes",
        responseMode: "json",
        payload: { mode: "keywords", title: draft.title, content: text },
      });
      const tags = data.keywords.map((tag) => tag.replace(/^#/, "").trim()).filter(Boolean).slice(0, 8);
      change({ aiKeywords: tags });
    } catch {
      setAiError("AI ამჟამად მიუწვდომელია. სცადე კიდევ ერთხელ.");
    } finally {
      setAiBusy(null);
    }
  };

  const openTeacher = (prompt: string) => {
    autosave.current?.flush();
    try {
      window.sessionStorage.setItem(AI_TEACHER_PROMPT_KEY, prompt.slice(0, HANDOFF_LIMIT));
    } catch {
      // storage blocked: the teacher opens without the text
    }
    router.push("/ai-teacher");
  };

  const toTool = (target: "cards" | "quiz") => {
    autosave.current?.flush();
    handOff(target, { title: draft.title.trim() || category.label, text });
    router.push(target === "cards" ? "/generate" : "/quiz");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
    setMoreOpen(false);
  };

  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div
      className="under-site-header min-h-dvh bg-[var(--bg-primary)] max-md:-mt-[var(--safe-top)]"
      style={{ paddingBottom: keyboard + 96 }}
    >
      <header className={JOURNAL_HEADER}>
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center gap-2 px-4">
          <button type="button" onClick={back} aria-label="ჩანაწერების სიაში" className={JOURNAL_ICON_BUTTON}>
            <ArrowLeft className="h-[18px] w-[18px]" />
          </button>
          <p className="min-w-0 flex-1 truncate text-[13px] font-semibold" aria-live="polite">
            {status === "saving" ? (
              <span className="text-[var(--text-secondary)]">ინახება…</span>
            ) : status === "saved" ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                შენახულია <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
            ) : copied ? (
              <span className="text-[var(--text-secondary)]">დაკოპირდა</span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={() => change({ pinned: !draft.pinned })}
            aria-pressed={draft.pinned}
            aria-label={draft.pinned ? "დეშბორდიდან მოხსნა" : "დეშბორდზე მიმაგრება"}
            className={`${JOURNAL_ICON_BUTTON} ${draft.pinned ? "!border-pink-300 !bg-pink-50 !text-pink-600 dark:!border-pink-400/40 dark:!bg-pink-500/15 dark:!text-pink-300" : ""}`}
          >
            <Pin className="h-[18px] w-[18px]" />
          </button>
          <div ref={moreRef} className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((open) => !open)}
              aria-label="მეტი"
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              className={JOURNAL_ICON_BUTTON}
            >
              <MoreHorizontal className="h-[18px] w-[18px]" />
            </button>
            {moreOpen ? (
              <div role="menu" className={`${MENU} right-0`}>
                {confirmDelete ? (
                  <>
                    <p className="px-3 pb-1 pt-2 text-[13px] font-medium text-[var(--text-secondary)]">წავშალოთ ჩანაწერი?</p>
                    <button type="button" role="menuitem" onClick={() => onDelete(draft)} className={`${MENU_ITEM} !text-rose-600 dark:!text-rose-400`}>
                      <Trash2 className="h-4 w-4" /> წაშლა
                    </button>
                    <button type="button" role="menuitem" onClick={() => setConfirmDelete(false)} className={MENU_ITEM}>
                      გაუქმება
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" role="menuitem" onClick={() => void copy()} className={MENU_ITEM}>
                      <Copy className="h-4 w-4" /> კოპირება
                    </button>
                    {canShare ? (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMoreOpen(false);
                          void navigator.share({ title: draft.title || category.label, text: fullText }).catch(() => {});
                        }}
                        className={MENU_ITEM}
                      >
                        <Share2 className="h-4 w-4" /> გაზიარება
                      </button>
                    ) : null}
                    <button type="button" role="menuitem" onClick={() => setConfirmDelete(true)} className={`${MENU_ITEM} !text-rose-600 dark:!text-rose-400`}>
                      <Trash2 className="h-4 w-4" /> წაშლა
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-4">
        <div className="flex flex-wrap gap-2 pb-3 pt-1">
          <div ref={categoryRef} className="relative">
            <button
              type="button"
              onClick={() => setCategoryOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={categoryOpen}
              aria-label={`კატეგორია: ${category.label}`}
              className={CHIP}
            >
              <CategoryDot section={draft.section} />
              <CategoryLabel section={draft.section} />
              <ChevronDown className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
            </button>
            {categoryOpen ? (
              <div role="menu" className={`${MENU} left-0`}>
                {JOURNAL_CATEGORIES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={item.id === draft.section}
                    onClick={() => {
                      change({ section: item.id });
                      setCategoryOpen(false);
                    }}
                    className={MENU_ITEM}
                  >
                    <CategoryDot section={item.id} />
                    {item.label}
                    {item.id === draft.section ? <Check className="ml-auto h-4 w-4" /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div ref={subjectRef} className="relative">
            <button
              type="button"
              onClick={() => setSubjectOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={subjectOpen}
              className={`${CHIP} ${draft.subject ? "" : "text-[var(--text-secondary)]"}`}
            >
              {draft.subject || "საგანი"}
              <ChevronDown className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
            </button>
            {subjectOpen ? (
              <div role="menu" className={`${MENU} left-0 max-h-72 overflow-y-auto`}>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={!draft.subject}
                  onClick={() => {
                    change({ subject: undefined });
                    setSubjectOpen(false);
                  }}
                  className={`${MENU_ITEM} text-[var(--text-secondary)]`}
                >
                  საგნის გარეშე
                </button>
                {subjects.map((name) => (
                  <button
                    key={name}
                    type="button"
                    role="menuitemradio"
                    aria-checked={draft.subject === name}
                    onClick={() => {
                      change({ subject: name });
                      setSubjectOpen(false);
                    }}
                    className={MENU_ITEM}
                  >
                    {name}
                    {draft.subject === name ? <Check className="ml-auto h-4 w-4" /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Desktop: the toolbar sits above the sheet. */}
        <div className="hidden md:mb-3 md:block">
          <Toolbar onFormat={format} aiRef={aiRef} aiOpen={aiOpen} setAiOpen={setAiOpen} />
        </div>

        <article className="mb-6 min-h-[60vh] rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] px-5 pb-10 pt-6 sm:px-8">
          <p className="text-[13px] font-medium text-[var(--text-secondary)]">{formatJournalDate(draft.date)}</p>
          <input
            value={draft.title}
            onChange={(event) => change({ title: event.target.value })}
            placeholder="სათაური"
            aria-label="სათაური"
            className="mt-2 w-full bg-transparent text-[24px] font-bold leading-tight text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]/60"
          />
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(event) => change({ content: event.target.value })}
            placeholder="დაიწყე წერა…"
            aria-label="ჩანაწერის ტექსტი"
            rows={6}
            className="mt-4 w-full resize-none overflow-hidden bg-transparent text-[16px] font-medium leading-[1.75] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]/70"
          />
        </article>
      </div>

      {/* Phone: the toolbar in the dock's place, above the keyboard while typing. */}
      <div
        className="fixed inset-x-3 z-40 md:hidden"
        style={{ bottom: keyboard > 0 ? keyboard + 8 : "max(12px, env(safe-area-inset-bottom))" }}
      >
        <Toolbar onFormat={format} aiRef={aiRef} aiOpen={aiOpen} setAiOpen={setAiOpen} />
      </div>

      {aiOpen ? (
        <AiMenu
          menuRef={aiRef}
          canAi={canAi}
          busy={aiBusy}
          error={aiError}
          keywords={draft.aiKeywords}
          bottom={keyboard}
          onSummary={() => void summarize()}
          onExplain={() => openTeacher(`ახსენი მარტივად ეს ჩანაწერი:\n\n${fullText}`)}
          onCards={() => toTool("cards")}
          onQuiz={() => toTool("quiz")}
          onKeywords={() => void keywords()}
          onKeyword={(tag) => openTeacher(`„${tag}“ — მოკლედ ამიხსენი ამ ჩანაწერის კონტექსტში:\n\n${fullText}`)}
        />
      ) : null}
    </div>
  );
}

function Toolbar({
  onFormat,
  aiRef,
  aiOpen,
  setAiOpen,
}: {
  onFormat: (kind: "heading" | "bold" | "list") => void;
  aiRef: React.RefObject<HTMLDivElement | null>;
  aiOpen: boolean;
  setAiOpen: (open: boolean) => void;
}) {
  const tool =
    "inline-flex h-10 w-10 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10 disabled:opacity-40";
  // Formatting buttons don't take focus away from the text (pointerdown).
  const keep = (event: React.PointerEvent) => event.preventDefault();
  return (
    <div className="flex items-center gap-1 rounded-full bg-[#16161f] p-1.5 shadow-[0_10px_30px_-10px_rgb(0_0_0/0.5)]">
      <button type="button" onPointerDown={keep} onClick={() => onFormat("heading")} aria-label="სათაური" className={tool}>
        <Heading className="h-[18px] w-[18px]" />
      </button>
      <button type="button" onPointerDown={keep} onClick={() => onFormat("bold")} aria-label="მუქი ტექსტი" className={tool}>
        <Bold className="h-[18px] w-[18px]" />
      </button>
      <button type="button" onPointerDown={keep} onClick={() => onFormat("list")} aria-label="სია" className={tool}>
        <List className="h-[18px] w-[18px]" />
      </button>
      <button type="button" disabled title="მალე" aria-label="ფოტო (მალე)" className={tool}>
        <ImageIcon className="h-[18px] w-[18px]" />
      </button>
      <div ref={aiRef} className="ml-auto">
        <button
          type="button"
          onClick={() => setAiOpen(!aiOpen)}
          aria-haspopup="menu"
          aria-expanded={aiOpen}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#e11d74] px-4 text-[14px] font-semibold text-white transition hover:bg-[#c8176a]"
        >
          <Sparkles className="h-4 w-4" />
          AI დახმარება
        </button>
      </div>
    </div>
  );
}

function AiMenu({
  menuRef,
  canAi,
  busy,
  error,
  keywords,
  bottom,
  onSummary,
  onExplain,
  onCards,
  onQuiz,
  onKeywords,
  onKeyword,
}: {
  menuRef: React.RefObject<HTMLDivElement | null>;
  canAi: boolean;
  busy: string | null;
  error: string | null;
  keywords: string[];
  bottom: number;
  onSummary: () => void;
  onExplain: () => void;
  onCards: () => void;
  onQuiz: () => void;
  onKeywords: () => void;
  onKeyword: (tag: string) => void;
}) {
  const items: { id: string; label: string; onClick: () => void }[] = [
    { id: "summary", label: "შეაჯამე", onClick: onSummary },
    { id: "explain", label: "ახსენი მარტივად", onClick: onExplain },
    { id: "cards", label: "გადააქციე ბარათებად", onClick: onCards },
    { id: "quiz", label: "ქვიზი ამ ჩანაწერიდან", onClick: onQuiz },
    { id: "keywords", label: "საკვანძო სიტყვები", onClick: onKeywords },
  ];
  return (
    // Phone: a sheet over the toolbar; desktop: a menu under the toolbar's right end.
    <div
      ref={menuRef}
      role="menu"
      aria-label="AI დახმარება"
      className="fixed inset-x-3 z-50 rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-2 shadow-[0_18px_44px_-14px_rgb(15_23_42/0.45)] md:inset-x-auto md:right-[max(1rem,calc(50%-24rem+1rem))] md:top-[calc(var(--site-header-h)+11rem)] md:w-72"
      style={{ bottom: `calc(${bottom}px + max(76px, env(safe-area-inset-bottom) + 64px))` }}
    >
      {canAi ? null : <p className="px-3 pb-1 pt-2 text-[13px] font-medium text-[var(--text-secondary)]">დაწერე ცოტა მეტი — AI-ს ტექსტი სჭირდება.</p>}
      {items.map((item) => (
        <button key={item.id} type="button" role="menuitem" disabled={!canAi || busy !== null} onClick={item.onClick} className={MENU_ITEM}>
          {busy === item.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-[var(--accent-primary)]" />}
          {item.label}
        </button>
      ))}
      {keywords.length ? (
        <div className="flex flex-wrap gap-1.5 px-3 pb-2 pt-1">
          {keywords.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onKeyword(tag)}
              className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[12.5px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            >
              #{tag.replace(/\s+/g, "_")}
            </button>
          ))}
        </div>
      ) : null}
      {error ? <p className="px-3 pb-2 text-[13px] text-rose-600 dark:text-rose-400">{error}</p> : null}
    </div>
  );
}
