"use client";

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
import { ArrowUp, Plus, Sparkles, X } from "lucide-react";
import { fetchAiTextStream } from "@/lib/ai/fetch-ai";
import { AI_PANEL_WIDTH_PX, useAIChatPanel } from "@/contexts/AIChatPanelContext";
import { MessageBubble } from "./MessageBubble";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

type Accent = "emerald" | "cyan" | "violet" | "amber";

const ACCENTS: Record<
  Accent,
  { text: string; bg: string; border: string; grad: string; glow: string }
> = {
  emerald: {
    text: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-400/30",
    grad: "from-emerald-400 to-emerald-600",
    glow: "rgba(16,185,129,0.4)",
  },
  cyan: {
    text: "text-cyan-300",
    bg: "bg-cyan-500/10",
    border: "border-cyan-400/30",
    grad: "from-cyan-400 to-cyan-600",
    glow: "rgba(34,211,238,0.4)",
  },
  violet: {
    text: "text-violet-300",
    bg: "bg-violet-500/10",
    border: "border-violet-400/30",
    grad: "from-violet-400 to-violet-600",
    glow: "rgba(167,139,250,0.4)",
  },
  amber: {
    text: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-400/30",
    grad: "from-amber-400 to-amber-600",
    glow: "rgba(245,158,11,0.4)",
  },
};

const QUICK_ACTIONS: {
  emoji: string;
  title: string;
  prompt: string;
  subject: string;
  accent: Accent;
}[] = [
  {
    emoji: "🧬",
    title: "ბიოლოგია",
    prompt: "ამიხსენი უჯრედის ორგანოიდები მარტივად.",
    subject: "ბიოლოგია",
    accent: "emerald",
  },
  {
    emoji: "📐",
    title: "ფორმულა",
    prompt: "მითხარი როგორ ვიყენებ კვადრატულ ფორმულას პრაქტიკაში.",
    subject: "მათემატიკა",
    accent: "cyan",
  },
  {
    emoji: "📚",
    title: "ლიტერატურა",
    prompt: "მოკლედ ამიხსენი 'ვეფხისტყაოსნის' მთავარი იდეა.",
    subject: "ქართული ლიტერატურა",
    accent: "violet",
  },
  {
    emoji: "🌍",
    title: "ისტორია",
    prompt: "ამიხსენი პირველი მსოფლიო ომის მიზეზები მარტივი ენით.",
    subject: "ისტორია",
    accent: "amber",
  },
];

function accentForSubject(subject: string): Accent {
  const match = QUICK_ACTIONS.find((action) => action.subject === subject);
  return match?.accent ?? "emerald";
}

/**
 * Persistent AI-teacher chat panel. Slides in on desktop (pushing dashboard
 * content aside — see SiteShell's md:mr-*) and takes over the full screen on
 * mobile where there's no room to split.
 */
export function AIChatSidePanel() {
  const { isOpen, close } = useAIChatPanel();

  const [subject, setSubject] = useState("ბიოლოგია");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [friendlyError, setFriendlyError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);
  const hasMessages = messages.length > 0;
  const accent = ACCENTS[accentForSubject(subject)];

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
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 320);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const sendMessage = async (rawMessage: string) => {
    const trimmed = rawMessage.trim();
    if (!trimmed || isLoading) return;

    setFriendlyError(null);
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: trimmed },
    ]);
    setInput("");

    const assistantId = crypto.randomUUID();
    setIsLoading(true);
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const text = await fetchAiTextStream(
        {
          pageType: "ai-teacher",
          payload: { subject, message: trimmed },
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
    setFriendlyError(null);
    setInput("");
    setIsLoading(false);
  };

  return (
    <div
      className={`fixed inset-0 z-[60] flex flex-col overflow-hidden bg-[#0A0A0F] transition-transform duration-300 ease-in-out will-change-transform md:inset-y-0 md:left-auto md:right-0 md:top-12 md:z-30 md:w-[420px] md:border-l md:border-white/[0.06] md:shadow-[-8px_0_40px_rgba(0,0,0,0.35)] ${
        isOpen
          ? "translate-x-0"
          : "pointer-events-none -translate-x-full md:translate-x-full"
      }`}
      style={{ width: `min(100%, ${AI_PANEL_WIDTH_PX}px)` }}
      aria-hidden={!isOpen}
    >
      {/* ambient glow, purely decorative */}
      <div
        className="pointer-events-none absolute -right-16 -top-10 h-56 w-56 rounded-full bg-emerald-500/10 blur-[80px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 top-1/3 h-48 w-48 rounded-full bg-cyan-500/[0.06] blur-[80px]"
        aria-hidden
      />

      <div className="relative z-[1] flex shrink-0 items-center justify-between gap-2 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="animate-icon-glow relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-[#0A0A0F]"
            style={{ "--icon-glow-color": "rgba(45,212,191,0.55)" } as CSSProperties}
          >
            <Sparkles className="h-4 w-4" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-100">AI მასწავლებელი</p>
            <span
              className={`mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${accent.border} ${accent.bg} ${accent.text}`}
            >
              {subject}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={startNewChat}
            aria-label="ახალი ჩატი"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/[0.06] hover:text-emerald-300"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={close}
            aria-label="დახურვა"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-100"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
      <div className="relative z-[1] h-px shrink-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div
        ref={feedRef}
        className="scrollbar-thin relative z-[1] min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-5"
      >
        {!hasMessages ? (
          <div className="flex h-full flex-col justify-center px-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-500/20">
              <Sparkles className="h-5 w-5 text-emerald-300" strokeWidth={1.75} />
            </div>
            <h2 className="headline bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-xl font-bold text-transparent">
              გამარჯობა, რით დაგეხმარო?
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              აირჩიე თემა ან დაწერე შენი კითხვა ქვემოთ
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              {QUICK_ACTIONS.map((action) => {
                const a = ACCENTS[action.accent];
                return (
                  <button
                    key={action.title}
                    type="button"
                    onClick={() => {
                      setSubject(action.subject);
                      void sendMessage(action.prompt);
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12]"
                    onMouseEnter={(event) => {
                      event.currentTarget.style.boxShadow = `0 8px 24px -8px ${a.glow}`;
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <span
                      className={`mb-2 flex h-8 w-8 items-center justify-center rounded-xl border text-base ${a.border} ${a.bg}`}
                    >
                      {action.emoji}
                    </span>
                    <span className="block text-[13px] font-semibold text-zinc-100">
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
            {messages.map((message) => (
              <MessageBubble key={message.id} role={message.role} content={message.content} />
            ))}
          </div>
        )}
      </div>

      <div className="relative z-[1] shrink-0 bg-[#0A0A0F] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        {friendlyError ? (
          <div className="mb-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {friendlyError}
          </div>
        ) : null}
        <form onSubmit={handleSubmit}>
          <div
            className={`rounded-full p-[1.5px] transition-shadow duration-300 ${
              inputFocused
                ? "bg-gradient-to-r from-emerald-400/80 via-teal-400/80 to-cyan-400/80 shadow-[0_0_22px_rgba(45,212,191,0.2)]"
                : "bg-white/[0.08]"
            }`}
          >
            <div className="flex items-end gap-1.5 rounded-full bg-[#12121A] py-1.5 pl-4 pr-1.5">
              <textarea
                ref={textareaRef}
                value={input}
                rows={1}
                onChange={(event) => setInput(event.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="დაწერე შენი კითხვა..."
                className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent py-1.5 text-sm leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-500"
              />
              <button
                type="submit"
                disabled={!canSend}
                aria-label="გაგზავნა"
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                  canSend
                    ? "bg-gradient-to-br from-emerald-400 to-cyan-500 text-[#0A0A0F] shadow-[0_0_14px_rgba(45,212,191,0.35)] hover:brightness-110 active:scale-95"
                    : "bg-white/[0.06] text-zinc-600"
                }`}
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </form>
        <p className="mt-2 text-center text-[10px] text-zinc-600">
          Enter — გაგზავნა · Shift+Enter — ახალი ხაზი
        </p>
      </div>
    </div>
  );
}
