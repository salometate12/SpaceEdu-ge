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
import { ArrowUp, Plus, Sparkles, X } from "lucide-react";
import { fetchAiTextStream } from "@/lib/ai/fetch-ai";
import { AI_PANEL_WIDTH_PX, useAIChatPanel } from "@/contexts/AIChatPanelContext";
import { MessageBubble } from "./MessageBubble";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_ACTIONS = [
  {
    title: "🧬 ბიოლოგია",
    prompt: "ამიხსენი უჯრედის ორგანოიდები მარტივად.",
    subject: "ბიოლოგია",
  },
  {
    title: "📐 ფორმულა",
    prompt: "მითხარი როგორ ვიყენებ კვადრატულ ფორმულას პრაქტიკაში.",
    subject: "მათემატიკა",
  },
  {
    title: "📚 ლიტერატურა",
    prompt: "მოკლედ ამიხსენი 'ვეფხისტყაოსნის' მთავარი იდეა.",
    subject: "ქართული ლიტერატურა",
  },
  {
    title: "🌍 ისტორია",
    prompt: "ამიხსენი პირველი მსოფლიო ომის მიზეზები მარტივი ენით.",
    subject: "ისტორია",
  },
];

/**
 * Persistent AI-teacher chat panel. Slides in as a left column that pushes
 * dashboard content to the right on desktop (see SiteShell's md:ml-*), and
 * takes over the full screen on mobile where there's no room to split.
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
      className={`fixed inset-0 z-[60] flex flex-col overflow-hidden bg-[#0A0A0F] transition-transform duration-300 ease-in-out will-change-transform md:inset-y-0 md:right-auto md:top-12 md:z-30 md:w-[420px] md:border-r md:border-white/[0.06] md:shadow-[8px_0_40px_rgba(0,0,0,0.35)] ${
        isOpen ? "translate-x-0" : "pointer-events-none -translate-x-full"
      }`}
      style={{ width: `min(100%, ${AI_PANEL_WIDTH_PX}px)` }}
      aria-hidden={!isOpen}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/10 text-emerald-300">
            <Sparkles className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-100">AI მასწავლებელი</p>
            <p className="truncate text-[11px] text-zinc-500">საგანი: {subject}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={startNewChat}
            aria-label="ახალი ჩატი"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-emerald-300 transition hover:bg-white/[0.05]"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={close}
            aria-label="დახურვა"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition hover:bg-white/[0.05] hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={feedRef}
        className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4"
      >
        {!hasMessages ? (
          <div className="flex h-full flex-col justify-center px-1 text-center">
            <h2 className="headline text-lg font-semibold text-zinc-100">
              გამარჯობა, რით დაგეხმარო?
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              აირჩიე თემა ან დაწერე შენი კითხვა ქვემოთ.
            </p>
            <div className="mt-5 grid gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.title}
                  type="button"
                  onClick={() => {
                    setSubject(action.subject);
                    void sendMessage(action.prompt);
                  }}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-left text-sm text-zinc-200 transition hover:border-emerald-400/40 hover:bg-white/[0.06]"
                >
                  <span className="block font-medium">{action.title}</span>
                  <span className="mt-0.5 block text-[11px] text-zinc-500">
                    {action.subject}
                  </span>
                </button>
              ))}
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

      <div className="shrink-0 border-t border-white/[0.06] bg-[#0A0A0F] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        {friendlyError ? (
          <div className="mb-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {friendlyError}
          </div>
        ) : null}
        <form onSubmit={handleSubmit}>
          <div
            className={`rounded-2xl p-[1px] transition-shadow duration-300 ${
              inputFocused
                ? "bg-gradient-to-r from-emerald-400/80 via-teal-400/80 to-cyan-400/80 shadow-[0_0_20px_rgba(45,212,191,0.16)]"
                : "bg-white/10"
            }`}
          >
            <div className="flex items-end gap-2 rounded-[15px] bg-[#12121A] px-3 py-2">
              <textarea
                ref={textareaRef}
                value={input}
                rows={1}
                onChange={(event) => setInput(event.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="დაწერე შენი კითხვა..."
                className="max-h-36 min-h-[40px] flex-1 resize-none bg-transparent py-2 text-sm leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-500"
              />
              <button
                type="submit"
                disabled={!canSend}
                aria-label="გაგზავნა"
                className={`mb-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                  canSend
                    ? "bg-gradient-to-br from-emerald-400 to-cyan-500 text-[#0A0A0F] shadow-[0_0_14px_rgba(45,212,191,0.35)] hover:brightness-110"
                    : "bg-white/[0.06] text-zinc-600"
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
