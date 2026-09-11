"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Dna,
  Globe2,
  Maximize2,
  Minimize2,
  Plus,
  Sigma,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
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
    text: "text-violet-700 dark:text-violet-300",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30 dark:border-violet-400/30",
    glow: "rgba(167,139,250,0.4)",
  },
  amber: {
    text: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30 dark:border-amber-400/30",
    glow: "rgba(245,158,11,0.4)",
  },
};

const QUICK_ACTIONS: {
  icon: LucideIcon;
  title: string;
  subject: string;
  accent: Accent;
  greeting: string;
  suggestions: SuggestionOption[];
}[] = [
  {
    icon: Dna,
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
    icon: Sigma,
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
    icon: BookOpen,
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
    icon: Globe2,
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
      className={`ai-teacher-surface fixed inset-0 z-[60] flex flex-col overflow-hidden transition-transform duration-300 ease-in-out will-change-transform md:inset-y-0 md:left-auto md:right-0 md:top-20 md:z-[45] md:border-l md:border-white/60 md:shadow-[-8px_0_40px_rgba(15,23,42,0.16)] md:dark:border-white/[0.06] md:dark:shadow-[-8px_0_40px_rgba(0,0,0,0.35)] ${
        isOpen
          ? "translate-x-0"
          : "pointer-events-none -translate-x-full md:translate-x-full"
      }`}
      style={{ width: isExpanded ? "100%" : `min(100%, ${AI_PANEL_WIDTH_PX}px)` }}
      aria-hidden={!isOpen}
    >

      <div className="relative z-[1] flex shrink-0 items-center justify-between gap-2 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          {!showHome && hasMessages ? (
            <button
              type="button"
              onClick={goHome}
              aria-label="მთავარ გვერდზე დაბრუნება"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-black/[0.05] hover:text-[var(--text-primary)] dark:hover:bg-white/[0.08]"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            </button>
          ) : null}
          <span
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[#6366f1] text-white shadow-[0_6px_18px_-6px_rgba(99,102,241,0.7)]"
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
              <p className="truncate text-[11px] text-[var(--text-muted)]">ნებისმიერ თემაზე მკითხე</p>
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
              {QUICK_ACTIONS.map((action) => {
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

      <div className="relative z-[1] mx-auto w-full max-w-2xl shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
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
                    ? "bg-gradient-to-br from-[var(--accent-primary)] to-[#6366f1] text-white shadow-[0_6px_18px_-4px_rgba(99,102,241,0.6)] hover:opacity-90 active:scale-95"
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
