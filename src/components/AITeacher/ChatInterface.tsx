"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { ArrowLeft, ArrowUp, BookOpen, Calculator, Dna, Landmark, Menu, Plus, X } from "lucide-react";
import { fetchAiTextStream } from "@/lib/ai/fetch-ai";
import { useCurrentUserFirstName } from "@/hooks/useCurrentUserFirstName";
import { dashboardHrefForSpace } from "@/lib/dashboard-routes";
import { readSpaceeduSpace } from "@/lib/space-back-navigation";
import { MessageBubble } from "./MessageBubble";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const MOCK_SESSIONS = [
  "ბიოლოგია: უჯრედები",
  "მათემატიკა: ინტეგრალები",
  "ქართული ლიტერატურა",
  "ფიზიკა: კვანტური მოდელი",
];

const QUICK_ACTIONS = [
  {
    title: "დამეხმარე ბიოლოგიაში",
    prompt: "ამიხსენი უჯრედის ორგანოიდები მარტივად.",
    subject: "ბიოლოგია",
    icon: Dna,
    color: "var(--accent-green)",
  },
  {
    title: "ამიხსენი ფორმულა",
    prompt: "მითხარი როგორ ვიყენებ კვადრატულ ფორმულას პრაქტიკაში.",
    subject: "მათემატიკა",
    icon: Calculator,
    color: "var(--accent-cyan)",
  },
  {
    title: "ქართული ლიტერატურა",
    prompt: "მოკლედ ამიხსენი 'ვეფხისტყაოსნის' მთავარი იდეა.",
    subject: "ქართული ლიტერატურა",
    icon: BookOpen,
    color: "var(--accent-purple)",
  },
  {
    title: "ისტორიის დახმარება",
    prompt: "ამიხსენი პირველი მსოფლიო ომის მიზეზები მარტივი ენით.",
    subject: "ისტორია",
    icon: Landmark,
    color: "var(--accent-amber)",
  },
];

export function ChatInterface() {
  const [subject, setSubject] = useState("ბიოლოგია");
  const [material, setMaterial] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [friendlyError, setFriendlyError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState(MOCK_SESSIONS[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    const element = feedRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
  }, [messages, isLoading]);

  const sendMessage = async (rawMessage: string) => {
    const trimmed = rawMessage.trim();
    if (!trimmed || isLoading) return;

    setFriendlyError(null);
    setSidebarOpen(false);
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: trimmed },
    ]);
    setInput("");

    const assistantId = crypto.randomUUID();
    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const text = await fetchAiTextStream(
        {
          pageType: "ai-teacher",
          payload: {
            subject,
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

      if (!text.trim()) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content: "პასუხი ცარიელია. სცადე სხვა ფორმულირებით.",
                }
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
    setFriendlyError(null);
    setInput("");
    setMaterial("");
    setSidebarOpen(false);
    setIsLoading(false);
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
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">ისტორია</p>
        <span className="text-xs text-[var(--text-muted)]">{MOCK_SESSIONS.length}</span>
      </div>

      <div className="mt-3 flex-1 space-y-1 overflow-y-auto pr-1">
        {MOCK_SESSIONS.map((session) => {
          const isActive = session === activeSession;
          return (
            <button
              key={session}
              type="button"
              onClick={() => {
                setActiveSession(session);
                const hint = session.split(":")[0]?.trim() ?? "";
                if (hint) setSubject(hint);
                setSidebarOpen(false);
              }}
              className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${
                isActive
                  ? "bg-[var(--accent-primary)]/10 text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {session}
            </button>
          );
        })}
      </div>
    </>
  );

  const floatingInput = (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/95 to-transparent px-4 pb-5 pt-10">
      <div className="pointer-events-auto w-full max-w-3xl">
        {friendlyError ? (
          <div className="mb-3 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            {friendlyError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div
            className={`rounded-2xl border transition-all duration-300 ${
              inputFocused
                ? "border-[var(--accent-primary)]/50 shadow-[0_0_0_4px_rgba(124,58,237,0.1)]"
                : "border-[var(--border)]"
            }`}
          >
            <div className="flex items-end gap-2 rounded-2xl bg-[var(--bg-card)] px-3 py-2">
              <textarea
                ref={textareaRef}
                value={input}
                rows={1}
                onChange={(event) => setInput(event.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="დაწერე შენი კითხვა..."
                className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-sm leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />
              <button
                type="submit"
                disabled={!canSend}
                aria-label="გაგზავნა"
                className={`mb-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                  canSend
                    ? "bg-[var(--accent-primary)] text-white shadow-sm hover:opacity-90"
                    : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                }`}
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-[var(--text-muted)]">
            Enter — გაგზავნა · Shift+Enter — ახალი ხაზი
          </p>
        </form>
      </div>
    </div>
  );

  return (
    <section className="relative flex h-full w-full overflow-hidden bg-[var(--bg-primary)]">
      {/* Desktop sidebar */}
      <aside className="hidden w-[280px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-primary)] px-3 py-4 md:flex">
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
          <aside className="relative flex h-full w-[280px] flex-col border-r border-[var(--border)] bg-[var(--bg-primary)] px-3 py-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between px-1">
              <span className="text-sm font-medium text-[var(--text-secondary)]">საუბრების ისტორია</span>
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
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-3 md:hidden">
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
          className={`scrollbar-thin flex-1 overflow-y-auto px-4 sm:px-6 ${
            hasMessages ? "pb-44 pt-6" : "pb-44"
          }`}
        >
          {!hasMessages ? (
            <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center px-2 text-center">
              <div
                className="animate-icon-glow mb-6 h-16 w-16 rounded-full shadow-lg sm:h-20 sm:w-20"
                style={
                  {
                    background:
                      "radial-gradient(circle at 32% 28%, var(--accent-secondary), var(--accent-primary) 70%)",
                    "--icon-glow-color": "rgba(124,58,237,0.4)",
                  } as CSSProperties
                }
                aria-hidden
              />
              <h1 className="headline text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                {firstName ? `გამარჯობა, ${firstName}!` : "გამარჯობა!"}
              </h1>
              <p className="mt-1 text-lg font-medium text-[var(--text-secondary)] sm:text-xl">
                რით შემიძლია დაგეხმარო?
              </p>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--text-muted)]">
                აირჩიე ერთ-ერთი შეთავაზება ან დაწერე კითხვა ქვემოთ. პასუხი იქნება მარტივი,
                სტრუქტურირებული და შენს საგანზე მორგებული.
              </p>

              <div className="mt-10 grid w-full gap-3 sm:grid-cols-2">
                {QUICK_ACTIONS.map((action) => {
                  const ActionIcon = action.icon;
                  return (
                    <button
                      key={action.title}
                      type="button"
                      onClick={() => {
                        setSubject(action.subject);
                        void sendMessage(action.prompt);
                      }}
                      className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/30 hover:shadow-lg"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                        style={{ background: `color-mix(in oklab, ${action.color}, white 82%)` }}
                      >
                        <ActionIcon className="h-4 w-4" style={{ color: action.color }} strokeWidth={2} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-[var(--text-primary)]">
                          {action.title}
                        </span>
                        <span className="mt-1 block text-xs text-[var(--text-muted)]">{action.subject}</span>
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
