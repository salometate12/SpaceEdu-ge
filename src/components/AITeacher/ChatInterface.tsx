"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { ArrowLeft, ArrowUp, BookOpen, Calculator, Dna, Landmark, Menu, Plus, Trash2, X } from "lucide-react";
import { fetchAiTextStream } from "@/lib/ai/fetch-ai";
import {
  conversationTitleFrom,
  deleteConversation,
  loadConversations,
  saveConversation,
  type AiTeacherConversation,
} from "@/lib/ai-teacher-history";
import { AI_TEACHER_PROMPT_KEY } from "@/lib/syllabus-calendar";
import { useCurrentUserFirstName } from "@/hooks/useCurrentUserFirstName";
import { dashboardHrefForSpace } from "@/lib/dashboard-routes";
import { readSpaceeduSpace } from "@/lib/space-back-navigation";
import { MessageBubble } from "./MessageBubble";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_ACTIONS = [
  {
    title: "ამიხსენი თემა ღრმად",
    prompt: "ამიხსენი უჯრედის ორგანოიდები — ინტუიცია, მაგალითი და გამოცდის ხაფანგები.",
    icon: Dna,
    color: "var(--accent-green)",
  },
  {
    title: "ამიხსენი ფორმულა",
    prompt: "მითხარი როგორ ვიყენებ კვადრატულ ფორმულას პრაქტიკაში, ნაბიჯ-ნაბიჯ.",
    icon: Calculator,
    color: "var(--accent-cyan)",
  },
  {
    title: "გამიხსენი ნაწარმოები",
    prompt: "დეტალურად ამიხსენი „ვეფხისტყაოსნის“ მთავარი იდეა და პერსონაჟები.",
    icon: BookOpen,
    color: "var(--accent-purple)",
  },
  {
    title: "ისტორიის მოვლენა",
    prompt: "ამიხსენი პირველი მსოფლიო ომის მიზეზები და შედეგები გასაგებად.",
    icon: Landmark,
    color: "var(--accent-amber)",
  },
];

export function ChatInterface() {
  const [material, setMaterial] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [friendlyError, setFriendlyError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<AiTeacherConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

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
    const sync = () => setConversations(loadConversations());
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const persistCurrentConversation = (finalMessages: ChatMessage[]) => {
    if (!conversationIdRef.current) conversationIdRef.current = crypto.randomUUID();
    setActiveConversationId(conversationIdRef.current);
    setConversations(
      saveConversation({
        id: conversationIdRef.current,
        title: conversationTitleFrom(finalMessages),
        messages: finalMessages,
      }),
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

    try {
      const text = await fetchAiTextStream(
        {
          pageType: "ai-teacher",
          payload: {
            material: material.trim() || undefined,
            message: trimmed,
          },
        },
        (partial) => {
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
      setFriendlyError("AI ამჟამად მიუწვდომელია. სცადე კიდევ ერთხელ.");
      setMessages((prev) => prev.filter((message) => message.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  };

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
    conversationIdRef.current = conversation.id;
    setActiveConversationId(conversation.id);
    setMessages(conversation.messages);
    setFriendlyError(null);
    setInput("");
    setSidebarOpen(false);
    setIsLoading(false);
  };

  const removeConversation = (id: string) => {
    setConversations(deleteConversation(id));
    if (conversationIdRef.current === id) startNewChat();
  };

  const handleBackToDashboard = () => {
    setSidebarOpen(false);
    // Prefer real browser history so the arrow returns to whichever
    // dashboard (student, abiturient, admin-browsed, ...) the user actually
    // came from, instead of guessing from the account's registered space.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(dashboardHrefForSpace(readSpaceeduSpace()));
  };

  const sidebarContent = (
    <>
      <button
        type="button"
        onClick={startNewChat}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-sm transition hover:border-[var(--accent-primary)]/40 hover:bg-[var(--accent-primary)]/5"
      >
        <span className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4 text-[var(--accent-primary)]" strokeWidth={2} />
          ახალი ჩატი
        </span>
      </button>

      <div className="mt-6 flex items-center justify-between px-1">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          ბოლო საუბრები
        </p>
        {conversations.length > 0 && (
          <span className="text-xs text-[var(--text-muted)]">{conversations.length}</span>
        )}
      </div>

      <div className="mt-3 flex-1 space-y-1 overflow-y-auto pr-1">
        {conversations.length === 0 ? (
          <p className="px-1 py-2 text-xs leading-relaxed text-[var(--text-muted)]">
            აქ გამოჩნდება შენი ბოლო კითხვები, რომლებზეც AI-მ უკვე გიპასუხა.
          </p>
        ) : (
          conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;
            return (
              <div
                key={conversation.id}
                className={`group flex items-center gap-1 rounded-xl transition ${
                  isActive
                    ? "bg-[var(--accent-primary)]/10"
                    : "hover:bg-[var(--bg-secondary)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => openConversation(conversation)}
                  className={`min-w-0 flex-1 truncate rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    isActive
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                  }`}
                >
                  {conversation.title}
                </button>
                <button
                  type="button"
                  onClick={() => removeConversation(conversation.id)}
                  aria-label="საუბრის წაშლა"
                  className="mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] opacity-0 transition hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </>
  );

  const floatingInput = (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-white via-white/92 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-8 dark:from-[#0a0a0f] dark:via-[#0a0a0f]/92 md:pb-5">
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
                placeholder="მომწერე შენი კითხვა..."
                className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 pl-2 text-sm leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />
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
            </div>
          </div>
          <p className="mt-2 hidden text-center text-[11px] text-[var(--text-muted)] sm:block">
            Enter — გაგზავნა · Shift+Enter — ახალი ხაზი
          </p>
        </form>
      </div>
    </div>
  );

  return (
    <section className="relative flex h-full w-full overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-[280px] shrink-0 flex-col border-r border-white/50 bg-white/45 px-3 py-4 backdrop-blur-xl md:flex dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mb-4 flex items-center gap-2 px-1">
          <button
            type="button"
            onClick={handleBackToDashboard}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            aria-label="დეშბორდზე დაბრუნება"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <span className="text-sm font-medium text-[var(--text-secondary)]">AI მასწავლებელი</span>
        </div>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar drawer */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex h-full w-[280px] flex-col border-r border-white/40 bg-white/85 px-3 py-4 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b0b12]/90">
            <div className="mb-4 flex items-center justify-between px-1">
              <span className="text-sm font-medium text-[var(--text-secondary)]">ბოლო საუბრები</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      ) : null}

      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Top bar — mobile */}
        <div className="flex items-center gap-2 border-b border-white/40 px-3 py-3 backdrop-blur-sm md:hidden dark:border-white/10">
          <button
            type="button"
            onClick={handleBackToDashboard}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            aria-label="დეშბორდზე დაბრუნება"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)]"
            aria-label="Open history"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text-primary)]">
            AI მასწავლებელი
          </div>
          <button
            type="button"
            onClick={startNewChat}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--accent-primary)]"
            aria-label="New chat"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={feedRef}
          className="scrollbar-thin flex-1 overflow-y-auto px-4 pb-36 pt-6 sm:px-6 md:pb-44"
        >
          {!hasMessages ? (
            <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center px-2 pb-4 text-center">
              <div className="ai-orb mb-4 h-[4.5rem] w-[4.5rem] sm:mb-8 sm:h-44 sm:w-44" aria-hidden />
              <h1 className="headline text-2xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] sm:text-[2.5rem]">
                {firstName ? `გამარჯობა, ${firstName}!` : "გამარჯობა!"}
                <span className="block bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
                  რით შემიძლია დაგეხმარო?
                </span>
              </h1>
              <p className="mt-3 hidden max-w-md text-sm leading-relaxed text-[var(--text-muted)] sm:mt-4 sm:block">
                აირჩიე ერთ-ერთი შეთავაზება ან დაწერე კითხვა ქვემოთ. პასუხი იქნება სრული,
                ნაბიჯ-ნაბიჯ ახსნილი და შენს კითხვაზე მორგებული.
              </p>

              <div className="mt-5 grid w-full grid-cols-2 gap-2.5 pb-2 sm:mt-9 sm:gap-3">
                {QUICK_ACTIONS.map((action) => {
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
