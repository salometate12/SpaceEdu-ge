"use client";

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
import { ArrowUp, PanelLeft, Square, SquarePen } from "lucide-react";
import { fetchAiTextStream } from "@/lib/ai/fetch-ai";
import { buildChatHistory } from "@/lib/ai/ai-teacher-conversation";
import {
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
import { AITeacherSidebar, trapFocus } from "./AITeacherSidebar";
import { MessageBubble } from "./MessageBubble";

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
  const [inputFocused, setInputFocused] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const reduceMotion = useReducedMotion();

  const feedRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationIdRef = useRef<string | null>(null);
  const initialPromptConsumed = useRef(false);

  const router = useRouter();
  const firstName = useCurrentUserFirstName();

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);
  const hasMessages = messages.length > 0;

  const adjustTextareaHeight = useCallback(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  useEffect(() => {
    if (messages.length === 0) return;
    const element = feedRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
  }, [messages, isLoading]);

  // Mirror messages into a ref so sendMessage can read the history that
  // preceded the current exchange without a stale closure.
  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Load the recent-conversation list once, and keep it in sync if another
  // tab changes it.
  useEffect(() => {
    const sync = () => setConversations(loadConversations(space));
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
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

  const sendMessage = async (rawMessage: string) => {
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
            material: material.trim() || undefined,
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

  const floatingInput = (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-white via-white/90 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+4.75rem)] pt-8 dark:from-[#0a0a0f] dark:via-[#0a0a0f]/90 md:pb-5">
      <div className="pointer-events-auto w-full max-w-3xl">
        {friendlyError ? (
          <div className="mb-3 rounded-2xl border border-rose-300/70 bg-rose-50/90 px-3 py-2 text-sm text-rose-700 backdrop-blur dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            {friendlyError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div
            className={`rounded-[28px] border bg-white/70 shadow-[0_16px_44px_-16px_rgba(79,70,229,0.35)] backdrop-blur-xl transition-all duration-300 dark:bg-white/[0.06] ${
              inputFocused
                ? "border-[var(--accent-primary)]/50 shadow-[0_0_0_4px_rgba(124,58,237,0.12)]"
                : "border-white/60 dark:border-white/10"
            }`}
          >
            <div className="flex items-end gap-2 px-3 py-2">
              <textarea
                ref={textareaRef}
                value={input}
                rows={1}
                onChange={(event) => setInput(event.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder={copy.placeholder}
                className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 pl-2 text-sm leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />
              {isLoading ? (
                <button
                  type="button"
                  onClick={stopGenerating}
                  aria-label="შეჩერება"
                  title="შეჩერება"
                  className="mb-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--text-primary)] text-[var(--bg-card)] transition hover:opacity-85"
                >
                  <Square className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSend}
                  aria-label="გაგზავნა"
                  className={`mb-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
                    canSend
                      ? "bg-gradient-to-br from-[var(--accent-primary)] to-[#6366f1] text-white shadow-[0_6px_18px_-4px_rgba(99,102,241,0.6)] hover:opacity-90"
                      : "bg-black/[0.06] text-[var(--text-muted)] dark:bg-white/10"
                  }`}
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
    <section className="relative flex h-full w-full overflow-hidden">
      {/* Desktop sidebar: full height under the header, collapses to icons. */}
      <aside
        aria-label="AI მასწავლებლის მენიუ"
        className={`hidden h-full shrink-0 overflow-hidden border-r border-[var(--border)] bg-white/70 backdrop-blur-xl transition-[width] duration-[220ms] ease-out motion-reduce:transition-none md:block dark:bg-white/[0.03] ${
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
              className="absolute inset-0 bg-black/50"
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
              className="absolute inset-y-0 left-0 w-[min(300px,86vw)] border-r border-[var(--border)] bg-[var(--bg-card)] pt-[env(safe-area-inset-top)] shadow-2xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
            >
              <AITeacherSidebar {...sidebarProps} variant="drawer" onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Top bar — mobile */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5 backdrop-blur-sm md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            aria-label="საუბრების მენიუ"
            aria-expanded={sidebarOpen}
          >
            <PanelLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{copy.headerTitle}</div>
            <div className="truncate text-xs text-[var(--text-muted)]">{copy.headerSubtitle}</div>
          </div>
          <button
            type="button"
            onClick={startNewChat}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            aria-label="ახალი ჩატი"
          >
            <SquarePen className="h-5 w-5" />
          </button>
        </div>

        <div
          ref={feedRef}
          className="scrollbar-thin flex-1 overflow-y-auto px-4 pb-52 pt-6 sm:px-6 md:pb-44"
        >
          {!hasMessages ? (
            <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-start px-2 pt-1 text-center sm:justify-center sm:pt-0">
              <div className="ai-orb mb-4 h-[4.5rem] w-[4.5rem] sm:mb-8 sm:h-44 sm:w-44" aria-hidden />
              <h1 className="headline text-2xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] sm:text-[2.5rem]">
                {firstName
                  ? copy.greetingWithName.replace("{name}", firstName)
                  : copy.greetingWithoutName}
                <span className="block bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
                  {copy.greetingQuestion}
                </span>
              </h1>
              <p className="mt-3 hidden max-w-md text-sm leading-relaxed text-[var(--text-muted)] sm:mt-4 sm:block">
                {copy.intro}
              </p>

              <div className="mt-5 grid w-full grid-cols-2 gap-2.5 pb-2 sm:mt-9 sm:gap-3">
                {copy.suggestions.map((action) => {
                  const ActionIcon = action.icon;
                  return (
                    <button
                      key={action.title}
                      type="button"
                      onClick={() => void sendMessage(action.prompt)}
                      className="relative rounded-2xl border border-white/60 bg-white/55 p-3 pr-9 text-left shadow-[0_12px_34px_-16px_rgba(79,70,229,0.35)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/75 sm:rounded-3xl sm:p-3.5 sm:pr-10 dark:border-white/10 dark:bg-white/[0.05] dark:hover:bg-white/[0.08]"
                    >
                      <span
                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full shadow-sm sm:right-2.5 sm:top-2.5 sm:h-7 sm:w-7"
                        style={{ background: `color-mix(in oklab, ${action.color}, white 78%)` }}
                      >
                        <ActionIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" style={{ color: action.color }} strokeWidth={2} />
                      </span>
                      <span className="block truncate text-[13px] font-semibold text-[var(--text-primary)]">
                        {action.title}
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[var(--text-muted)] sm:mt-1">
                        {action.prompt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl space-y-6">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  waitingVariant="full"
                  space={space}
                />
              ))}
            </div>
          )}
        </div>

        {floatingInput}
      </div>
    </section>
  );
}
