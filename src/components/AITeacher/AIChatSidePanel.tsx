"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  ChevronRight,
  Maximize2,
  Minimize2,
  Plus,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { aiTeacherHrefForSpace } from "@/lib/access-control";
import { CopyButton } from "@/components/CodeBlock";
import { fetchAiTextStream } from "@/lib/ai/fetch-ai";
import { buildChatHistory } from "@/lib/ai/ai-teacher-conversation";
import { useAIChatPanel } from "@/contexts/AIChatPanelContext";
import { useWorkingSpace } from "@/hooks/useWorkingSpace";
import {
  AI_TEACHER_CONTENT,
  aiTeacherSpaceFor,
  type AiTeacherAccent,
  type AiTeacherPanelTopic,
} from "@/lib/ai-teacher-content";
import { MessageBubble } from "./MessageBubble";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface SuggestionOption {
  label: string;
  prompt: string;
}

interface PendingSuggestions {
  accent: Accent;
  items: SuggestionOption[];
}

type Accent = AiTeacherAccent;

/** Light and dark pairs, so the panel reads on /ai-teacher's own surface
 *  rather than only on near-black. */
const ACCENTS: Record<
  Accent,
  { text: string; bg: string; border: string; glow: string }
> = {
  emerald: {
    text: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30 dark:border-emerald-400/30",
    glow: "rgba(16,185,129,0.4)",
  },
  cyan: {
    text: "text-cyan-700 dark:text-cyan-300",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30 dark:border-cyan-400/30",
    glow: "rgba(34,211,238,0.4)",
  },
  violet: {
    text: "text-pink-700 dark:text-pink-300",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30 dark:border-pink-400/30",
    glow: "rgba(167,139,250,0.4)",
  },
  amber: {
    text: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30 dark:border-amber-400/30",
    glow: "rgba(245,158,11,0.4)",
  },
};

type View = "home" | "chat";

const PHONE_QUERY = "(max-width: 767.98px)";
function subscribePhone(onChange: () => void) {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const readPhone = () => window.matchMedia(PHONE_QUERY).matches;

/** How far the on-screen keyboard pushes up from the bottom, and the
 * visible height above it, so the sheet's input stays over the keyboard. */
function useKeyboardInset(active: boolean): { inset: number; height: number } {
  const [state, setState] = useState({ inset: 0, height: 0 });
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!active || !viewport) return;
    const update = () => {
      const inset = Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop));
      setState({ inset: inset > 80 ? inset : 0, height: Math.round(viewport.height) });
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [active]);
  return active ? state : { inset: 0, height: 0 };
}

/**
 * The AI-teacher chat, as a rounded floating window. It opens out of the
 * round button in the bottom-right corner (AIChatBubble) — or from the
 * rail / mobile menu — and floats over the page instead of pushing it aside.
 * On a phone it is a rounded card over almost the whole screen.
 *
 * The AI itself is never gated behind a subject: typing a question straight
 * away answers it directly. Clicking a subject card only shows a friendly
 * greeting + two one-tap follow-ups — nothing is sent to the model until the
 * user actually picks or types something. "Home" (back arrow) just switches
 * which screen is showing — it never clears the conversation, only "+" does.
 */
export function AIChatSidePanel() {
  const { isOpen, close, isExpanded, toggleExpanded } = useAIChatPanel();
  // The window floats over every page, so its topics follow the space the
  // user is working in: university topics for students, exam prep otherwise.
  const { space: workingSpace } = useWorkingSpace();
  const teacherSpace = aiTeacherSpaceFor(workingSpace);
  const content = AI_TEACHER_CONTENT[teacherSpace];

  const [view, setView] = useState<View>("home");
  const [subject, setSubject] = useState<string | null>(null);
  const [subjectAccent, setSubjectAccent] = useState<Accent>("emerald");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingSuggestions, setPendingSuggestions] = useState<PendingSuggestions | null>(
    null,
  );
  const [friendlyError, setFriendlyError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);
  const hasMessages = messages.length > 0;
  const showHome = view === "home";

  const adjustTextareaHeight = useCallback(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 140)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  useEffect(() => {
    const element = feedRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
  }, [messages, isLoading, pendingSuggestions, view]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 320);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape closes the window, wherever focus is inside it.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  // While fullscreen-expanded, the panel visually covers the whole viewport —
  // lock body scroll so the dashboard behind it can't scroll/reflow underneath.
  useEffect(() => {
    if (!isExpanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isExpanded]);

  // Phone: the chat is a bottom sheet (see the phone branch below).
  const isPhone = useSyncExternalStore(subscribePhone, readPhone, () => false);
  const keyboard = useKeyboardInset(isPhone && isOpen);
  const [sheetDrag, setSheetDrag] = useState(0);
  const dragStart = useRef<number | null>(null);

  // The page behind an open sheet doesn't scroll (and the dock stays put).
  useEffect(() => {
    if (!isPhone || !isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isPhone, isOpen]);

  /** `base` replaces the conversation so far — „თავიდან დაწერა“ resends a
   * question with the turns before it. */
  const sendMessage = async (rawMessage: string, base: ChatMessage[] = messages) => {
    const trimmed = rawMessage.trim();
    if (!trimmed || isLoading) return;
    // The turns before this question, so follow-ups keep their topic.
    const history = buildChatHistory(base);

    setView("chat");
    setPendingSuggestions(null);
    setFriendlyError(null);
    setInput("");

    const assistantId = crypto.randomUUID();
    setIsLoading(true);
    setMessages([
      ...base,
      { id: crypto.randomUUID(), role: "user", content: trimmed },
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const text = await fetchAiTextStream(
        {
          pageType: "ai-teacher",
          // No subject = the model just answers the question directly,
          // instead of being artificially framed around an unrelated topic.
          payload: subject
            ? { subject, message: trimmed, space: teacherSpace, history }
            : { message: trimmed, space: teacherSpace, history },
        },
        (partial) => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId ? { ...message, content: partial } : message,
            ),
          );
        },
      );

      if (!text.trim()) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? { ...message, content: "პასუხი ცარიელია. სცადე სხვა ფორმულირებით." }
              : message,
          ),
        );
      }
    } catch {
      setFriendlyError("AI ამჟამად მიუწვდომელია. სცადე კიდევ ერთხელ.");
      setMessages((prev) => prev.filter((message) => message.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) void sendMessage(input);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setPendingSuggestions(null);
    setFriendlyError(null);
    setInput("");
    setIsLoading(false);
    setSubject(null);
    setView("home");
  };

  const goHome = () => setView("home");

  const handleBack = () => {
    if (!showHome && hasMessages) {
      goHome();
      return;
    }
    close();
  };

  const pickSubject = (action: AiTeacherPanelTopic) => {
    setSubject(action.subject);
    setSubjectAccent(action.accent);
    setFriendlyError(null);
    setView("chat");
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "assistant", content: action.greeting },
    ]);
    setPendingSuggestions({ accent: action.accent, items: action.followUps });
  };

  const activeAccent = ACCENTS[subjectAccent];

  /** Asks the question behind this answer again. */
  const regenerate = (assistantIndex: number) => {
    const userIndex = messages.slice(0, assistantIndex).map((m) => m.role).lastIndexOf("user");
    if (userIndex === -1) return;
    void sendMessage(messages[userIndex].content, messages.slice(0, userIndex));
  };

  if (isPhone) {
    const sheetHeight = keyboard.inset > 0 ? `min(78dvh, ${Math.max(240, keyboard.height - 12)}px)` : "78dvh";
    const lastAssistant = messages.map((m) => m.role).lastIndexOf("assistant");
    const iconButton =
      "flex h-8 w-8 items-center justify-center rounded-full text-[#71717a] active:bg-black/5 dark:text-[#a1a1aa] dark:active:bg-white/10";
    return (
      <>
        <div
          aria-hidden
          onClick={close}
          className={`fixed inset-0 z-[61] bg-[rgba(15,23,42,0.32)] transition-opacity duration-[280ms] ease-out motion-reduce:transition-none ${
            isOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />
        <div
          id="ai-chat-window"
          role="dialog"
          aria-modal="true"
          aria-label="AI მასწავლებელი"
          aria-hidden={!isOpen}
          inert={!isOpen || undefined}
          className={`fixed inset-x-0 z-[62] flex flex-col overflow-hidden rounded-t-[28px] bg-white text-[#18181b] shadow-[0_-16px_40px_-16px_rgba(15,23,42,0.35)] ease-out motion-reduce:transition-none dark:bg-[var(--bg-card)] dark:text-[#f4f4f5] ${
            sheetDrag ? "" : "transition-transform duration-[280ms]"
          } ${isOpen ? "" : "pointer-events-none"}`}
          style={{
            bottom: keyboard.inset,
            height: sheetHeight,
            transform: isOpen ? `translateY(${sheetDrag}px)` : "translateY(105%)",
          }}
        >
          {/* Handle + header: drag down to close. */}
          <div
            className="shrink-0 touch-none"
            onPointerDown={(event) => {
              if ((event.target as HTMLElement).closest("button, a")) return;
              dragStart.current = event.clientY;
              try {
                event.currentTarget.setPointerCapture(event.pointerId);
              } catch {
                // moves still arrive without capture
              }
            }}
            onPointerMove={(event) => {
              if (dragStart.current === null) return;
              setSheetDrag(Math.max(0, event.clientY - dragStart.current));
            }}
            onPointerUp={() => {
              if (dragStart.current === null) return;
              dragStart.current = null;
              if (sheetDrag > 90) close();
              setSheetDrag(0);
            }}
            onPointerCancel={() => {
              dragStart.current = null;
              setSheetDrag(0);
            }}
          >
            <div className="flex justify-center pb-1 pt-2.5">
              <span className="h-1 w-9 rounded-full bg-[#e4e4e7] dark:bg-white/20" aria-hidden />
            </div>
            <div className="flex items-center gap-2.5 px-4 pb-3 pt-1.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-[#fdf2f8] text-[var(--accent-primary)] dark:bg-[rgba(216,24,120,0.15)]">
                <Sparkles className="h-4 w-4" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold leading-tight">AI მასწავლებელი</p>
                <p className="truncate text-xs text-[#71717a] dark:text-[#a1a1aa]">{subject ?? content.headerSubtitle}</p>
              </div>
              {hasMessages ? (
                <button type="button" onClick={startNewChat} aria-label="ახალი ჩატი" className={iconButton}>
                  <Plus className="h-[18px] w-[18px]" />
                </button>
              ) : null}
              <Link href={aiTeacherHrefForSpace(workingSpace)} onClick={close} aria-label="სრულ ეკრანზე" className={iconButton}>
                <Maximize2 className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={close}
                aria-label="დახურვა"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4f4f5] text-[#52525b] dark:bg-white/10 dark:text-[#d4d4d8]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="h-px bg-[#f1f1f3] dark:bg-white/[0.08]" />
          </div>

          <div ref={feedRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3 pt-5">
            {!hasMessages ? (
              <div>
                <h2 className="text-2xl font-bold leading-tight">რით დაგეხმარო?</h2>
                <p className="mt-1.5 text-sm text-[#71717a] dark:text-[#a1a1aa]">დაწერე კითხვა ან აირჩიე ერთ-ერთი:</p>
                <div className="mt-5 space-y-2">
                  {content.suggestions.slice(0, 3).map((suggestion) => (
                    <button
                      key={suggestion.title}
                      type="button"
                      onClick={() => void sendMessage(suggestion.prompt)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-[#ececef] px-4 py-3 text-left active:bg-black/[0.03] dark:border-white/[0.08] dark:active:bg-white/[0.04]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-medium">{suggestion.title}</span>
                        <span className="block truncate text-xs text-[#71717a] dark:text-[#a1a1aa]">{suggestion.prompt}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#a1a1aa]" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {messages.map((message, index) => (
                  <div key={message.id}>
                    <MessageBubble role={message.role} content={message.content} appearance="sheet" />
                    {message.role === "assistant" && message.content.trim() && !(isLoading && index === messages.length - 1) ? (
                      <div className="mt-1.5 flex gap-1 pl-[34px]">
                        <CopyButton
                          text={message.content}
                          className="h-8 rounded-full px-2 text-[#71717a] active:bg-black/5 dark:text-[#a1a1aa] dark:active:bg-white/10"
                        />
                        {index === lastAssistant && messages[index - 1]?.role === "user" ? (
                          <button type="button" onClick={() => regenerate(index)} aria-label="თავიდან დაწერა" className={iconButton}>
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
                {pendingSuggestions && !isLoading ? (
                  <div className="flex flex-wrap gap-2 pl-[34px]">
                    {pendingSuggestions.items.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => void sendMessage(option.prompt)}
                        className="rounded-full border border-[#ececef] px-3.5 py-2 text-xs font-medium dark:border-white/[0.08]"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div
            className="shrink-0 px-3 pt-2"
            style={{ paddingBottom: keyboard.inset > 0 ? 10 : "max(12px, env(safe-area-inset-bottom))" }}
          >
            {friendlyError ? (
              <div className="mb-2 rounded-2xl bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                {friendlyError}
              </div>
            ) : null}
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                rows={1}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="დაწერე კითხვა…"
                aria-label="შენი კითხვა"
                // 16px keeps iOS from zooming into the field.
                className="max-h-32 min-h-[44px] flex-1 resize-none rounded-[22px] bg-[#f4f4f5] px-4 py-[11px] text-base leading-snug text-[#18181b] outline-none placeholder:text-[#a1a1aa] dark:bg-white/[0.06] dark:text-[#f4f4f5]"
              />
              <button
                type="submit"
                disabled={!canSend}
                aria-label="გაგზავნა"
                className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#18181b] text-white transition-opacity disabled:opacity-35 dark:bg-white dark:text-[#18181b]"
              >
                <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.5} />
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      id="ai-chat-window"
      role="dialog"
      aria-label="AI მასწავლებელი"
      className={`ai-teacher-surface fixed z-[62] flex origin-bottom-right flex-col overflow-hidden rounded-3xl border border-white/60 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)] transition-[opacity,transform] duration-200 ease-out dark:border-white/10 dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] ${
        // Phone: a rounded card over almost the whole screen, clear of the
        // notch and home bar. Desktop: a window rising out of the bubble's
        // corner, or a larger rounded window when expanded.
        "inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] top-[max(0.5rem,env(safe-area-inset-top))]"
      } ${
        isExpanded
          ? "md:inset-x-6 md:bottom-6 md:top-24"
          : "md:inset-x-auto md:bottom-[5.75rem] md:right-6 md:top-auto md:h-[min(640px,calc(100dvh-8.5rem))] md:w-[420px] md:max-w-[calc(100vw-3rem)]"
      } ${
        isOpen
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-3 scale-95 opacity-0"
      }`}
      aria-hidden={!isOpen}
      inert={!isOpen || undefined}
    >

      <div className="relative z-[1] flex shrink-0 items-center justify-between gap-2 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={handleBack}
            aria-label="უკან"
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-1.5 text-[var(--text-secondary)] transition hover:bg-black/[0.05] hover:text-[var(--text-primary)] dark:hover:bg-white/[0.08]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            <span className="pr-1 text-xs font-medium">უკან</span>
          </button>
          <span
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)] text-white shadow-[0_6px_18px_-6px_rgba(216,24,120,0.55)]"
          >
            <Sparkles className="h-4 w-4" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">AI მასწავლებელი</p>
            {subject ? (
              <span
                className={`mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${activeAccent.border} ${activeAccent.bg} ${activeAccent.text}`}
              >
                {subject}
              </span>
            ) : (
              <p className="text-[11px] leading-tight text-[var(--text-muted)]">{content.headerSubtitle}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={toggleExpanded}
            aria-label={isExpanded ? "დავიწროება" : "მთელ ეკრანზე გაშლა"}
            className="hidden h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-black/[0.05] hover:text-[var(--text-primary)] md:inline-flex dark:hover:bg-white/[0.08]"
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4" strokeWidth={2} />
            ) : (
              <Maximize2 className="h-4 w-4" strokeWidth={2} />
            )}
          </button>
          <button
            type="button"
            onClick={startNewChat}
            aria-label="ახალი ჩატი"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-black/[0.05] hover:text-[var(--accent-primary)] dark:hover:bg-white/[0.08]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={close}
            aria-label="დახურვა"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-black/[0.05] hover:text-[var(--text-primary)] dark:hover:bg-white/[0.08]"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
      <div className="relative z-[1] h-px shrink-0 bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/[0.08]" />

      <div
        ref={feedRef}
        className="scrollbar-thin relative z-[1] mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto px-4 pb-4 pt-5"
      >
        {showHome ? (
          <div className="flex h-full flex-col justify-center px-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
              <Sparkles
                className="h-5 w-5 text-[var(--accent-primary)]"
                strokeWidth={1.75}
              />
            </div>
            <h2 className="headline text-xl font-bold text-[var(--text-primary)]">
              გამარჯობა, რით დაგეხმარო?
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
              დამისვი ნებისმიერი კითხვა პირდაპირ, ან აირჩიე თემა სწრაფი დასაწყისისთვის
            </p>

            {hasMessages ? (
              <button
                type="button"
                onClick={() => setView("chat")}
                className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-medium text-[var(--text-secondary)] backdrop-blur-xl transition hover:text-[var(--text-primary)] dark:border-white/10 dark:bg-white/[0.06]"
              >
                <ArrowLeft className="h-3.5 w-3.5 rotate-180" strokeWidth={2} />
                გააგრძელე წინა საუბარი
              </button>
            ) : null}

            <div className="mt-6 grid grid-cols-2 gap-2.5">
              {content.panelTopics.map((action) => {
                const a = ACCENTS[action.accent];
                return (
                  <button
                    key={action.title}
                    type="button"
                    onClick={() => pickSubject(action)}
                    className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-3.5 text-left backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.06]"
                    onMouseEnter={(event) => {
                      event.currentTarget.style.boxShadow = `0 8px 24px -8px ${a.glow}`;
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <span
                      className={`mb-2 flex h-8 w-8 items-center justify-center rounded-xl border ${a.border} ${a.bg} ${a.text}`}
                    >
                      <action.icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </span>
                    <span className="block text-[13px] font-semibold text-[var(--text-primary)]">
                      {action.title}
                    </span>
                    <span className={`mt-0.5 block truncate text-[10px] ${a.text} opacity-80`}>
                      {action.subject}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                role={message.role}
                content={message.content}
                complete={!(isLoading && index === messages.length - 1)}
              />
            ))}

            {pendingSuggestions && !isLoading ? (
              <div className="flex flex-wrap gap-2 pl-12">
                {pendingSuggestions.items.map((option) => {
                  const a = ACCENTS[pendingSuggestions.accent];
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => void sendMessage(option.prompt)}
                      className={`rounded-full border px-3.5 py-2 text-xs font-medium transition-all hover:-translate-y-0.5 ${a.border} ${a.bg} ${a.text}`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="relative z-[1] mx-auto w-full max-w-2xl shrink-0 px-3 pb-3 pt-2">
        {friendlyError ? (
          <div className="mb-2 rounded-2xl border border-rose-300/70 bg-rose-50/90 px-3 py-2 text-xs text-rose-700 backdrop-blur dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            {friendlyError}
          </div>
        ) : null}
        <form onSubmit={handleSubmit}>
          {/* Two rows rather than one: what you write on top, what you do
              with it underneath — the shape of the composer in the
              reference, on /ai-teacher's own card. */}
          <div
            className={`overflow-hidden rounded-[28px] border bg-white/70 shadow-[0_16px_44px_-16px_rgba(79,70,229,0.35)] backdrop-blur-xl transition-all duration-300 dark:bg-white/[0.06] ${
              inputFocused
                ? "border-[var(--accent-primary)]/50 shadow-[0_0_0_4px_rgba(124,58,237,0.12)]"
                : "border-white/60 dark:border-white/10"
            }`}
          >
            <textarea
              ref={textareaRef}
              value={input}
              rows={1}
              onChange={(event) => setInput(event.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={
                subject ? `${subject} — დაწერე შენი კითხვა...` : "დაწერე შენი კითხვა..."
              }
              className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-4 py-3 text-sm leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            />

            <div className="flex items-center justify-end gap-2 border-t border-black/[0.06] px-3 py-2 dark:border-white/[0.08]">
              <button
                type="submit"
                disabled={!canSend}
                aria-label="გაგზავნა"
                className={`ml-auto inline-flex h-10 w-16 shrink-0 items-center justify-center rounded-full transition ${
                  canSend
                    ? "bg-[var(--accent-primary)] text-white shadow-[0_6px_18px_-6px_rgba(216,24,120,0.5)] hover:opacity-90 active:scale-95"
                    : "bg-black/[0.06] text-[var(--text-muted)] dark:bg-white/10"
                }`}
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
