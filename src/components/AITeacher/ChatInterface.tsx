"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUp, BookOpen, ClipboardList, GraduationCap, ListChecks, PanelLeft, Sparkles, Square, SquarePen, type LucideIcon } from "lucide-react";
import { useIsPhoneLayout, useIsTouchDevice, useMobileChatViewport } from "@/hooks/useMobileChatViewport";
import { useChatScroll } from "@/hooks/useChatScroll";
import { fetchAiTextStream } from "@/lib/ai/fetch-ai";
import { buildChatHistory } from "@/lib/ai/ai-teacher-conversation";
import {
  AI_TEACHER_HISTORY_UPDATED_EVENT,
  conversationTitleFrom,
  deleteConversation,
  loadConversations,
  renameConversation,
  saveConversation,
  type AiTeacherConversation,
} from "@/lib/ai-teacher-history";
import { AI_TEACHER_CONTENT, type AiTeacherSpace } from "@/lib/ai-teacher-content";
import { AI_TEACHER_PROMPT_KEY } from "@/lib/syllabus-calendar";
import { useCurrentUserFirstName } from "@/hooks/useCurrentUserFirstName";
import { dashboardHrefForSpace } from "@/lib/dashboard-routes";
import { buildSuggestions, type SuggestionKind } from "@/lib/ai-teacher-suggestions";
import { readSuggestionData, type SuggestionData } from "@/lib/ai-teacher-suggestion-data";
import { AITeacherSidebar, trapFocus } from "./AITeacherSidebar";
import { JumpToEndButton } from "./JumpToEndButton";
import { MessageBubble } from "./MessageBubble";
import { QuickReplies } from "./QuickReplies";

/** Each kind of starting card: its icon and soft colour. */
const SUGGESTION_LOOK: Record<SuggestionKind, { icon: LucideIcon; tint: string }> = {
  lecture: { icon: BookOpen, tint: "bg-[var(--icon-green)] text-[var(--icon-green-text)]" },
  exam: { icon: GraduationCap, tint: "bg-[var(--icon-yellow)] text-[var(--icon-yellow-text)]" },
  assignment: { icon: ClipboardList, tint: "bg-[var(--icon-pink)] text-[var(--icon-pink-text)]" },
  quiz: { icon: ListChecks, tint: "bg-[var(--icon-blue)] text-[var(--icon-blue-text)]" },
};

/** „რომელ საგანზე ვიმუშაოთ დღეს?“ with its last word marked in pink. */
function markLastWord(text: string) {
  const cut = text.lastIndexOf(" ");
  if (cut === -1) return <span className="chat-mark-pink">{text}</span>;
  return (
    <>
      {text.slice(0, cut + 1)}
      <span className="chat-mark-pink">{text.slice(cut + 1)}</span>
    </>
  );
}

/** Remembers whether the desktop sidebar is collapsed. */
const SIDEBAR_KEY = "spaceedu-ai-teacher-sidebar";
const SIDEBAR_EVENT = "spaceedu-ai-teacher-sidebar-change";

// Per-tab memory for when localStorage is unavailable.
let sidebarFallback = false;

function readSidebarCollapsed(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_KEY) === "collapsed";
  } catch {
    return sidebarFallback;
  }
}

function writeSidebarCollapsed(collapsed: boolean) {
  sidebarFallback = collapsed;
  try {
    window.localStorage.setItem(SIDEBAR_KEY, collapsed ? "collapsed" : "open");
  } catch {
    // remembered for this visit only
  }
  window.dispatchEvent(new Event(SIDEBAR_EVENT));
}

function subscribeSidebar(onChange: () => void) {
  window.addEventListener(SIDEBAR_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SIDEBAR_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The phone header's two buttons: soft 40px circles. */
const MOBILE_ROUND_BUTTON =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-transform duration-150 active:scale-[0.94] motion-reduce:transition-none";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  /** Which space's AI teacher this is: its texts, its saved history, where
   * "უკან" goes, and the learner level the AI is told about. */
  space: AiTeacherSpace;
}

export function ChatInterface({ space }: ChatInterfaceProps) {
  const copy = AI_TEACHER_CONTENT[space];
  const [material, setMaterial] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [friendlyError, setFriendlyError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<AiTeacherConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Bumped when a saved conversation is opened, so it opens at its last question.
  const [openCount, setOpenCount] = useState(0);
  // Phone header: a hairline appears once the conversation scrolls under it.
  const [feedScrolled, setFeedScrolled] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const reduceMotion = useReducedMotion();
  // The student's subjects, latest entry and upcoming dates, for the starting cards.
  const [suggestionData, setSuggestionData] = useState<SuggestionData | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationIdRef = useRef<string | null>(null);
  const initialPromptConsumed = useRef(false);

  const router = useRouter();
  useMobileChatViewport();
  const isPhone = useIsPhoneLayout();
  const isTouch = useIsTouchDevice();
  const firstName = useCurrentUserFirstName();

  useEffect(() => {
    void Promise.resolve().then(() => setSuggestionData(readSuggestionData(space)));
  }, [space]);

  const suggestions = useMemo(
    () =>
      suggestionData
        ? buildSuggestions({ ...suggestionData, space, fallback: copy.suggestions })
        : [],
    [suggestionData, space, copy.suggestions],
  );
  const needsSubjects = space === "student" && suggestionData !== null && suggestionData.subjects.length === 0;

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);
  const hasMessages = messages.length > 0;

  const adjustTextareaHeight = useCallback(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  }, []);

  // Also when the placeholder switches to the phone's short one.
  useEffect(() => {
    adjustTextareaHeight();
  }, [input, isPhone, adjustTextareaHeight]);

  // The last question and its answer; the question scrolls to the top when
  // it's sent, and the answer is read from its start (no following the stream).
  const lastQuestion = messages.map((message) => message.role).lastIndexOf("user");
  const { attachFeed, turnStyle, showJump, jumpToEnd } = useChatScroll({
    questionKey: lastQuestion === -1 ? null : messages[lastQuestion].id,
    openKey: openCount,
  });

  // Mirror messages into a ref so sendMessage can read the history that
  // preceded the current exchange without a stale closure.
  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Load the recent-conversation list once, and keep it in sync if another
  // tab changes it or the account's history arrives from another device.
  useEffect(() => {
    const sync = () => setConversations(loadConversations(space));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(AI_TEACHER_HISTORY_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(AI_TEACHER_HISTORY_UPDATED_EVENT, sync);
    };
  }, [space]);

  const persistCurrentConversation = (finalMessages: ChatMessage[]) => {
    if (!conversationIdRef.current) conversationIdRef.current = crypto.randomUUID();
    setActiveConversationId(conversationIdRef.current);
    setConversations(
      saveConversation({
        id: conversationIdRef.current,
        title: conversationTitleFrom(finalMessages),
        messages: finalMessages,
      }, space),
    );
  };

  /** `context`: reference material sent along (a starting card's subject and dates). */
  const sendMessage = async (rawMessage: string, context?: string) => {
    const trimmed = rawMessage.trim();
    if (!trimmed || isLoading) return;

    const priorMessages = messagesRef.current;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    const assistantId = crypto.randomUUID();

    setFriendlyError(null);
    setSidebarOpen(false);
    setInput("");
    setIsLoading(true);
    setMessages([
      ...priorMessages,
      userMessage,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;
    let partialText = "";

    try {
      const text = await fetchAiTextStream(
        {
          pageType: "ai-teacher",
          payload: {
            material: context ?? (material.trim() || undefined),
            message: trimmed,
            space,
            // This chat's earlier turns (empty after „ახალი ჩატი“).
            history: buildChatHistory(priorMessages),
          },
          signal: controller.signal,
        },
        (partial) => {
          partialText = partial;
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId ? { ...message, content: partial } : message,
            ),
          );
        },
      );

      const answer = text.trim() || "პასუხი ცარიელია. სცადე სხვა ფორმულირებით.";
      const finalMessages: ChatMessage[] = [
        ...priorMessages,
        userMessage,
        { id: assistantId, role: "assistant", content: answer },
      ];
      setMessages(finalMessages);
      persistCurrentConversation(finalMessages);
    } catch {
      if (controller.signal.aborted) {
        // Stopped with ■: keep whatever already arrived.
        if (partialText.trim()) {
          const finalMessages: ChatMessage[] = [
            ...priorMessages,
            userMessage,
            { id: assistantId, role: "assistant", content: partialText.trim() },
          ];
          setMessages(finalMessages);
          persistCurrentConversation(finalMessages);
        } else {
          setMessages((prev) => prev.filter((message) => message.id !== assistantId));
        }
      } else {
        setFriendlyError("AI ამჟამად მიუწვდომელია. სცადე კიდევ ერთხელ.");
        setMessages((prev) => prev.filter((message) => message.id !== assistantId));
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsLoading(false);
    }
  };

  const stopGenerating = () => abortRef.current?.abort();

  // Consume a one-shot prompt handed over from another page (e.g. the
  // dashboard calendar's "დაიწყე სწავლა"), then auto-send it once. The ref
  // guard keeps React Strict Mode's double effect run from dropping it.
  useEffect(() => {
    if (typeof window === "undefined" || initialPromptConsumed.current) return;
    let pending: string | null = null;
    try {
      pending = window.sessionStorage.getItem(AI_TEACHER_PROMPT_KEY);
      if (pending) window.sessionStorage.removeItem(AI_TEACHER_PROMPT_KEY);
    } catch {
      pending = null;
    }
    if (!pending) {
      const fromQuery = new URLSearchParams(window.location.search).get("prompt");
      if (fromQuery) {
        pending = fromQuery;
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
    if (!pending || !pending.trim()) return;
    initialPromptConsumed.current = true;
    const message = pending;
    window.setTimeout(() => {
      void sendMessage(message);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // On a phone Enter is a new line; sending is the button's job.
    if (isTouch) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) void sendMessage(input);
    }
  };

  const startNewChat = () => {
    abortRef.current?.abort();
    conversationIdRef.current = null;
    setActiveConversationId(null);
    setMessages([]);
    setFriendlyError(null);
    setInput("");
    setMaterial("");
    setSidebarOpen(false);
    setIsLoading(false);
  };

  const openConversation = (conversation: AiTeacherConversation) => {
    abortRef.current?.abort();
    conversationIdRef.current = conversation.id;
    setActiveConversationId(conversation.id);
    setMessages(conversation.messages);
    setOpenCount((count) => count + 1);
    setFriendlyError(null);
    setInput("");
    setSidebarOpen(false);
    setIsLoading(false);
  };

  const removeConversation = (id: string) => {
    setConversations(deleteConversation(id, space));
    if (conversationIdRef.current === id) startNewChat();
  };

  const handleBackToDashboard = () => {
    setSidebarOpen(false);
    router.push(dashboardHrefForSpace(space));
  };

  // Collapsed state lives in localStorage; the server render (and the
  // first client render) show it open, then the stored value applies.
  const collapsed = useSyncExternalStore(subscribeSidebar, readSidebarCollapsed, () => false);
  const toggleCollapsed = useCallback(() => writeSidebarCollapsed(!readSidebarCollapsed()), []);

  // Ctrl/Cmd+B collapses the sidebar, Ctrl/Cmd+Shift+O starts a new chat.
  const startNewChatRef = useRef(startNewChat);
  useEffect(() => {
    startNewChatRef.current = startNewChat;
  });
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === "b" && !event.shiftKey && window.matchMedia("(min-width: 768px)").matches) {
        event.preventDefault();
        toggleCollapsed();
      } else if (key === "o" && event.shiftKey) {
        event.preventDefault();
        startNewChatRef.current();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCollapsed]);

  // Mobile drawer: Esc closes it; focus moves in when it opens.
  const drawerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => drawerRef.current?.querySelector<HTMLElement>("button")?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
    };
  }, [sidebarOpen]);

  // Swipe left on the drawer closes it.
  const swipeStart = useRef<number | null>(null);
  // Swipe right across the chat opens it — not from the very edge, which
  // iOS keeps for "back".
  const feedSwipe = useRef<{ x: number; y: number } | null>(null);

  const sidebarProps = {
    title: copy.headerTitle,
    subtitle: copy.headerSubtitle,
    conversations,
    activeId: activeConversationId,
    onBack: handleBackToDashboard,
    onNewChat: startNewChat,
    onOpen: openConversation,
    onRename: (id: string, title: string) => setConversations(renameConversation(id, title, space)),
    onDelete: removeConversation,
  };

  const lastAnswer = messages[messages.length - 1];
  const showQuickReplies = !isLoading && lastAnswer?.role === "assistant" && lastAnswer.content.trim().length > 0;

  const renderMessage = (message: ChatMessage, index: number) => (
    <MessageBubble
      key={message.id}
      role={message.role}
      content={message.content}
      waitingVariant="full"
      space={space}
      complete={!(isLoading && index === messages.length - 1)}
      onQuickReply={showQuickReplies && index === messages.length - 1 ? (prompt) => void sendMessage(prompt) : undefined}
    />
  );

  const floatingInput = (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/90 to-transparent px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-8 md:pb-5 [.keyboard-open_&]:pb-2">
      <div className="pointer-events-auto relative w-full max-w-[760px]">
        {showJump ? <JumpToEndButton onClick={jumpToEnd} /> : null}
        {showQuickReplies && !input.trim() ? (
          <QuickReplies onSend={(prompt) => void sendMessage(prompt)} copyText={lastAnswer.content} className="mb-2.5 md:hidden" />
        ) : null}
        {friendlyError ? (
          <div className="mb-3 rounded-2xl border border-rose-300/70 bg-rose-50/90 px-3 py-2 text-sm text-rose-700 backdrop-blur dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            {friendlyError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          {/* Phone: one 48px capsule that grows to ~5 lines while typing. */}
          <div
            className="rounded-[29px] border border-[var(--chat-input-border)] bg-[var(--chat-surface)] shadow-[0_8px_28px_-16px_rgba(0,0,0,0.25)] transition-colors duration-200 focus-within:border-[var(--chat-border-hover)] max-md:rounded-[24px] max-md:shadow-[0_2px_12px_rgb(0_0_0/0.06)]"
          >
            <div className="flex items-end gap-2 py-1.5 pl-3 pr-1.5 max-md:gap-1.5 max-md:py-[5px] max-md:pl-2 max-md:pr-[5px]">
              <textarea
                ref={textareaRef}
                value={input}
                rows={1}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isPhone ? "დაწერე კითხვა…" : copy.placeholder}
                aria-label="შენი კითხვა"
                // 16px on phones: iOS zooms into anything smaller.
                className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent py-[11px] pl-2 text-[15px] leading-[22px] text-[var(--chat-text-strong)] outline-none placeholder:text-[var(--chat-text-muted)] max-md:max-h-[140px] max-md:min-h-[36px] max-md:py-[7px] max-md:text-[16px] max-md:leading-[22px]"
              />
              {isLoading ? (
                <button
                  type="button"
                  onClick={stopGenerating}
                  aria-label="შეჩერება"
                  title="შეჩერება"
                  className="mb-px inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[var(--chat-text-strong)] text-[var(--chat-surface)] transition hover:opacity-85 max-md:mb-0 max-md:h-9 max-md:w-9"
                >
                  <Square className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSend}
                  aria-label="გაგზავნა"
                  className="mb-px inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white transition hover:brightness-110 disabled:opacity-45 disabled:hover:brightness-100 max-md:mb-0 max-md:h-9 max-md:w-9"
                >
                  <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <section className="ai-chat relative flex h-full w-full overflow-hidden">
      {/* Desktop sidebar: full height under the header, collapses to icons. */}
      <aside
        aria-label="AI მასწავლებლის მენიუ"
        // From 1024px a floating panel under the header pill: its top and bottom
        // edges show, and only its list scrolls.
        className={`hidden h-full shrink-0 overflow-hidden border-r border-[var(--border)] bg-[var(--bg-card)] transition-[width] duration-[220ms] ease-out motion-reduce:transition-none md:block lg:mb-4 lg:ml-6 lg:mt-3 lg:h-auto lg:rounded-[22px] lg:border lg:border-[var(--chat-border)] lg:bg-[var(--chat-panel)] lg:overscroll-contain ${
          collapsed ? "w-14" : "w-[264px]"
        }`}
      >
        <div className={`h-full ${collapsed ? "w-14" : "w-[264px]"}`}>
          <AITeacherSidebar {...sidebarProps} variant="desktop" collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {sidebarOpen ? (
          <div className="fixed inset-0 z-[70] md:hidden">
            <motion.button
              type="button"
              aria-label="მენიუს დახურვა"
              className="absolute inset-0 bg-black/35"
              onClick={() => setSidebarOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
            />
            <motion.div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="საუბრები"
              onKeyDown={trapFocus}
              onPointerDown={(event) => {
                swipeStart.current = event.clientX;
              }}
              onPointerUp={(event) => {
                if (swipeStart.current !== null && event.clientX - swipeStart.current < -60) setSidebarOpen(false);
                swipeStart.current = null;
              }}
              className="absolute inset-y-0 left-0 w-[min(86vw,320px)] border-r border-[var(--border)] bg-[var(--bg-card)] pt-[env(safe-area-inset-top)] shadow-2xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: reduceMotion ? 0 : 0.26, ease: "easeOut" }}
            >
              <AITeacherSidebar {...sidebarProps} variant="drawer" onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Top bar — phone: under the status bar, always on top of the chat. */}
        <div
          className={`z-10 shrink-0 border-b bg-[var(--bg-primary)]/80 pt-[env(safe-area-inset-top)] backdrop-blur-md transition-colors duration-200 md:hidden ${
            feedScrolled ? "border-[var(--border)]" : "border-transparent"
          }`}
        >
          <div className="flex h-[52px] items-center gap-2.5 px-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className={MOBILE_ROUND_BUTTON}
              aria-label="საუბრები"
              aria-expanded={sidebarOpen}
            >
              <PanelLeft className="h-5 w-5" strokeWidth={1.9} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-semibold leading-tight text-[var(--text-primary)]">{copy.headerTitle}</div>
              <div className="truncate text-[12px] leading-tight text-[var(--text-secondary)]">{copy.headerSubtitle}</div>
            </div>
            <button type="button" onClick={startNewChat} className={MOBILE_ROUND_BUTTON} aria-label="ახალი ჩატი">
              <SquarePen className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </button>
          </div>
        </div>

        <div
          ref={attachFeed}
          onScroll={(event) => setFeedScrolled(event.currentTarget.scrollTop > 2)}
          onTouchStart={(event) => {
            const touch = event.touches[0];
            feedSwipe.current = touch.clientX > 24 ? { x: touch.clientX, y: touch.clientY } : null;
          }}
          onTouchEnd={(event) => {
            const start = feedSwipe.current;
            feedSwipe.current = null;
            const touch = event.changedTouches[0];
            if (start && touch.clientX - start.x > 70 && Math.abs(touch.clientY - start.y) < 40) setSidebarOpen(true);
          }}
          className="scrollbar-thin flex-1 overflow-y-auto px-4 pb-36 pt-6 sm:px-6 md:pb-44"
        >
          {!hasMessages ? (
            <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center px-2 text-center">
              {/* Phone: a small, quiet AI mark. */}
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--chat-text-muted)] md:hidden" aria-hidden>
                <Sparkles className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h1 className="text-[26px] font-bold leading-[1.25] tracking-tight text-[var(--chat-text-strong)] sm:text-[34px]">
                {firstName
                  ? copy.greetingWithName.replace("{name}", firstName)
                  : copy.greetingWithoutName}
                <span className="block">{markLastWord(copy.greetingQuestion)}</span>
              </h1>
              <p className="mt-3 hidden max-w-[520px] text-[15.5px] leading-relaxed text-[var(--chat-text-muted)] sm:mt-4 sm:block">
                {copy.intro}
              </p>

              {/* Built from the student's subjects, latest entry and upcoming dates; one column on phones. */}
              <div className="mt-6 grid w-full grid-cols-1 gap-2.5 pb-2 text-left sm:mt-9 sm:grid-cols-2 sm:gap-3">
                {suggestions.map((card) => {
                  const look = SUGGESTION_LOOK[card.kind];
                  const CardIcon = look.icon;
                  return (
                    <button
                      key={`${card.kind}-${card.title}`}
                      type="button"
                      data-suggestion
                      onClick={() => void sendMessage(card.prompt, card.context)}
                      className="flex items-start gap-3 rounded-[18px] border border-[var(--chat-border)] bg-[var(--chat-surface)] px-[18px] py-4 text-left transition-[border-color,transform] duration-150 hover:-translate-y-px hover:border-[var(--chat-border-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                    >
                      <span className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full ${look.tint}`} aria-hidden>
                        <CardIcon className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span data-suggestion-title className="block text-[15px] font-bold leading-snug text-[var(--chat-text-strong)]">
                          {card.title}
                        </span>
                        {card.subject ? (
                          <span
                            data-suggestion-subject
                            className="mt-1.5 inline-flex h-[22px] max-w-full items-center gap-1.5 rounded-full bg-[var(--chat-chip-bg)] px-2 text-[12px] font-semibold text-[var(--chat-text)]"
                          >
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: card.subjectColor ?? "currentColor" }} aria-hidden />
                            <span className="truncate">{card.subject}</span>
                          </span>
                        ) : null}
                        <span data-suggestion-desc className="mt-1 line-clamp-2 text-[13.5px] leading-snug text-[var(--chat-text-muted)]">
                          {card.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {needsSubjects ? (
                <Link
                  href="/dashboard-student#semester-subjects"
                  className="mt-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[14px] font-semibold text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                >
                  დაამატე შენი საგნები
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl space-y-6">
              {messages.slice(0, lastQuestion === -1 ? messages.length : lastQuestion).map(renderMessage)}
              {lastQuestion === -1 ? null : (
                // The current question + answer: tall enough for the question
                // to reach the top while the answer is still short.
                <div className="space-y-6" style={turnStyle}>
                  {messages.slice(lastQuestion).map((message, index) => renderMessage(message, lastQuestion + index))}
                </div>
              )}
            </div>
          )}
        </div>

        {floatingInput}
      </div>
    </section>
  );
}
