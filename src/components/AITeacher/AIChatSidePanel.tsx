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
import { ArrowLeft, ArrowUp, Maximize2, Minimize2, Plus, Sparkles, X } from "lucide-react";
import { fetchAiTextStream } from "@/lib/ai/fetch-ai";
import { AI_PANEL_WIDTH_PX, useAIChatPanel } from "@/contexts/AIChatPanelContext";
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
  subject: string;
  accent: Accent;
  greeting: string;
  suggestions: SuggestionOption[];
}[] = [
  {
    emoji: "🧬",
    title: "ბიოლოგია",
    subject: "ბიოლოგია",
    accent: "emerald",
    greeting: "გისმენთ! მზად ვარ დაგეხმაროთ ბიოლოგიაში 🧬 რომელი თემა გაინტერესებთ?",
    suggestions: [
      { label: "უჯრედის აგებულება", prompt: "ამიხსენი უჯრედის აგებულება და ორგანოიდები." },
      { label: "გენეტიკის საფუძვლები", prompt: "ამიხსენი გენეტიკის ძირითადი პრინციპები მარტივად." },
    ],
  },
  {
    emoji: "📐",
    title: "ფორმულა",
    subject: "მათემატიკა",
    accent: "cyan",
    greeting: "გისმენთ! დაგეხმარებით მათემატიკაში 📐 საიდან დავიწყოთ?",
    suggestions: [
      { label: "კვადრატული განტოლება", prompt: "ამიხსენი კვადრატული განტოლების ამოხსნის წესი მაგალითით." },
      { label: "წარმოებულები", prompt: "ამიხსენი წარმოებულის ცნება და მისი გამოთვლის წესები." },
    ],
  },
  {
    emoji: "📚",
    title: "ლიტერატურა",
    subject: "ქართული ენა და ლიტერატურა",
    accent: "violet",
    greeting: "გისმენთ! დაგეხმარებით ქართულ ენასა და ლიტერატურაში 📚 რა გაინტერესებთ?",
    suggestions: [
      { label: "ლიტერატურული ანალიზი", prompt: "დამეხმარე ვეფხისტყაოსნის მთავარი გმირების ანალიზში." },
      { label: "გრამატიკის წესები", prompt: "ამიხსენი ქართული ენის სინტაქსური წესები მაგალითებით." },
    ],
  },
  {
    emoji: "🌍",
    title: "ისტორია",
    subject: "ისტორია",
    accent: "amber",
    greeting: "გისმენთ! დაგეხმარებით ისტორიაში 🌍 რომელი პერიოდი გაინტერესებთ?",
    suggestions: [
      { label: "საქართველოს ისტორია", prompt: "ამიხსენი საქართველოს გაერთიანების ისტორია მოკლედ." },
      { label: "მსოფლიო ისტორია", prompt: "ამიხსენი პირველი მსოფლიო ომის მთავარი მიზეზები." },
    ],
  },
];

type View = "home" | "chat";

/**
 * Persistent AI-teacher chat panel. Slides in on desktop (pushing dashboard
 * content aside — see SiteShell's md:mr-*) and takes over the full screen on
 * mobile where there's no room to split.
 *
 * The AI itself is never gated behind a subject: typing a question straight
 * away answers it directly. Clicking a subject card only shows a friendly
 * greeting + two one-tap follow-ups — nothing is sent to the model until the
 * user actually picks or types something. "Home" (back arrow) just switches
 * which screen is showing — it never clears the conversation, only "+" does.
 */
export function AIChatSidePanel() {
  const { isOpen, close, isExpanded, toggleExpanded } = useAIChatPanel();

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

  const sendMessage = async (rawMessage: string) => {
    const trimmed = rawMessage.trim();
    if (!trimmed || isLoading) return;

    setView("chat");
    setPendingSuggestions(null);
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
          // No subject = the model just answers the question directly,
          // instead of being artificially framed around an unrelated topic.
          payload: subject ? { subject, message: trimmed } : { message: trimmed },
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

  const pickSubject = (action: (typeof QUICK_ACTIONS)[number]) => {
    setSubject(action.subject);
    setSubjectAccent(action.accent);
    setFriendlyError(null);
    setView("chat");
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "assistant", content: action.greeting },
    ]);
    setPendingSuggestions({ accent: action.accent, items: action.suggestions });
  };

  const activeAccent = ACCENTS[subjectAccent];

  return (
    <div
      className={`fixed inset-0 z-[60] flex flex-col overflow-hidden bg-[#0A0A0F] transition-transform duration-300 ease-in-out will-change-transform md:inset-y-0 md:left-auto md:right-0 md:top-12 md:z-[45] md:border-l md:border-white/[0.06] md:shadow-[-8px_0_40px_rgba(0,0,0,0.35)] ${
        isOpen
          ? "translate-x-0"
          : "pointer-events-none -translate-x-full md:translate-x-full"
      }`}
      style={{ width: isExpanded ? "100%" : `min(100%, ${AI_PANEL_WIDTH_PX}px)` }}
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
          {!showHome && hasMessages ? (
            <button
              type="button"
              onClick={goHome}
              aria-label="მთავარ გვერდზე დაბრუნება"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-100"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            </button>
          ) : null}
          <span
            className="animate-icon-glow relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-[#0A0A0F]"
            style={{ "--icon-glow-color": "rgba(45,212,191,0.55)" } as CSSProperties}
          >
            <Sparkles className="h-4 w-4" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-100">AI მასწავლებელი</p>
            {subject ? (
              <span
                className={`mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${activeAccent.border} ${activeAccent.bg} ${activeAccent.text}`}
              >
                {subject}
              </span>
            ) : (
              <p className="truncate text-[11px] text-zinc-500">ნებისმიერ თემაზე მკითხე</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={toggleExpanded}
            aria-label={isExpanded ? "დავიწროება" : "მთელ ეკრანზე გაშლა"}
            className="hidden h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-100 md:inline-flex"
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
        className="scrollbar-thin relative z-[1] mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto px-4 pb-4 pt-5"
      >
        {showHome ? (
          <div className="flex h-full flex-col justify-center px-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-500/20">
              <Sparkles className="h-5 w-5 text-emerald-300" strokeWidth={1.75} />
            </div>
            <h2 className="headline bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-xl font-bold text-transparent">
              გამარჯობა, რით დაგეხმარო?
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              დამისვი ნებისმიერი კითხვა პირდაპირ, ან აირჩიე თემა სწრაფი დასაწყისისთვის
            </p>

            {hasMessages ? (
              <button
                type="button"
                onClick={() => setView("chat")}
                className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-medium text-zinc-300 transition hover:border-emerald-400/30 hover:bg-white/[0.07] hover:text-emerald-200"
              >
                <ArrowLeft className="h-3.5 w-3.5 rotate-180" strokeWidth={2} />
                გააგრძელე წინა საუბარი
              </button>
            ) : null}

            <div className="mt-6 grid grid-cols-2 gap-2.5">
              {QUICK_ACTIONS.map((action) => {
                const a = ACCENTS[action.accent];
                return (
                  <button
                    key={action.title}
                    type="button"
                    onClick={() => pickSubject(action)}
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

      <div className="relative z-[1] mx-auto w-full max-w-2xl shrink-0 bg-[#0A0A0F] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
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
