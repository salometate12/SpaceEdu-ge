"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Menu, Plus, X } from "lucide-react";
import { fetchAiTextStream } from "@/lib/ai/fetch-ai";
import { MessageBubble } from "./MessageBubble";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const MOCK_SESSIONS = [
  "🧬 ბიოლოგია: უჯრედები",
  "📐 მათემატიკა: ინტეგრალები",
  "📚 ქართული ლიტერატურა",
  "⚛️ ფიზიკა: კვანტური მოდელი",
];

const QUICK_ACTIONS = [
  {
    title: "🧬 დამეხმარე ბიოლოგიაში",
    prompt: "ამიხსენი უჯრედის ორგანოიდები მარტივად.",
    subject: "ბიოლოგია",
  },
  {
    title: "📐 ამიხსენი ფორმულა",
    prompt: "მითხარი როგორ ვიყენებ კვადრატულ ფორმულას პრაქტიკაში.",
    subject: "მათემატიკა",
  },
  {
    title: "📚 ქართული ლიტერატურა",
    prompt: "მოკლედ ამიხსენი 'ვეფხისტყაოსნის' მთავარი იდეა.",
    subject: "ქართული ლიტერატურა",
  },
  {
    title: "🌍 ისტორიის დახმარება",
    prompt: "ამიხსენი პირველი მსოფლიო ომის მიზეზები მარტივი ენით.",
    subject: "ისტორია",
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

  const sidebarContent = (
    <>
      <button
        type="button"
        onClick={startNewChat}
        className="w-full rounded-xl border border-emerald-400/25 bg-[#12121A] px-3 py-2.5 text-sm font-semibold text-zinc-100 shadow-[inset_0_0_0_1px_rgba(45,212,191,0.08)] transition hover:border-cyan-400/40 hover:shadow-[0_0_14px_rgba(45,212,191,0.12)]"
      >
        <span className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4 text-emerald-300" strokeWidth={2} />
          ახალი ჩატი
        </span>
      </button>

      <div className="mt-6 flex items-center justify-between px-1">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">ისტორია</p>
        <span className="text-xs text-zinc-600">{MOCK_SESSIONS.length}</span>
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
                const hint = session.split(":")[0]?.replace(/[^\p{L}\p{N}\s]/gu, "") ?? "";
                if (hint) setSubject(hint.trim());
                setSidebarOpen(false);
              }}
              className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${
                isActive
                  ? "bg-white/10 text-white backdrop-blur-sm"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
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
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/95 to-transparent px-4 pb-5 pt-10">
      <div className="pointer-events-auto w-full max-w-3xl">
        {friendlyError ? (
          <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {friendlyError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div
            className={`rounded-2xl p-[1px] transition-shadow duration-300 ${
              inputFocused
                ? "bg-gradient-to-r from-emerald-400/80 via-teal-400/80 to-cyan-400/80 shadow-[0_0_24px_rgba(45,212,191,0.18)]"
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
                className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-sm leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-500"
              />
              <button
                type="submit"
                disabled={!canSend}
                aria-label="გაგზავნა"
                className={`mb-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                  canSend
                    ? "bg-gradient-to-br from-emerald-400 to-cyan-500 text-[#0A0A0F] shadow-[0_0_16px_rgba(45,212,191,0.35)] hover:brightness-110"
                    : "bg-white/[0.06] text-zinc-600"
                }`}
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-zinc-600">
            Enter — გაგზავნა · Shift+Enter — ახალი ხაზი
          </p>
        </form>
      </div>
    </div>
  );

  return (
    <section className="relative flex h-full w-full overflow-hidden bg-[#0A0A0F]">
      {/* Desktop sidebar */}
      <aside className="hidden w-[280px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0A0A0F] px-3 py-4 md:flex">
        <div className="mb-4 flex items-center gap-2 px-1">
          <Link
            href="/dashboard-student"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/[0.05] hover:text-zinc-200"
            aria-label="Dashboard"
          >
            ←
          </Link>
          <span className="text-sm font-medium text-zinc-300">AI მასწავლებელი</span>
        </div>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar drawer */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex h-full w-[280px] flex-col border-r border-white/[0.06] bg-[#0A0A0F] px-3 py-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between px-1">
              <span className="text-sm font-medium text-zinc-300">საუბრების ისტორია</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.05]"
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
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-zinc-300"
            aria-label="Open history"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1 truncate text-sm text-zinc-400">
            საგანი: <span className="text-zinc-200">{subject}</span>
          </div>
          <button
            type="button"
            onClick={startNewChat}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-emerald-300"
            aria-label="New chat"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Desktop subject chip */}
        <div className="hidden border-b border-white/[0.06] px-6 py-3 md:block">
          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
            აქტიური საგანი: <span className="ml-1 text-zinc-200">{subject}</span>
          </span>
        </div>

        <div
          ref={feedRef}
          className={`scrollbar-thin flex-1 overflow-y-auto px-4 sm:px-6 ${
            hasMessages ? "pb-44 pt-6" : "pb-44"
          }`}
        >
          {!hasMessages ? (
            <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center px-2 text-center">
              <h1 className="headline bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-400 bg-clip-text text-2xl font-semibold tracking-tight text-transparent sm:text-4xl md:text-5xl">
                გამარჯობა, რით დაგეხმარო?
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-500">
                აირჩიე ერთ-ერთი შეთავაზება ან დაწერე კითხვა ქვემოთ. პასუხი იქნება მარტივი,
                სტრუქტურირებული და შენს საგანზე მორგებული.
              </p>

              <div className="mt-10 grid w-full gap-3 sm:grid-cols-2">
                {QUICK_ACTIONS.map((action) => (
                  <div
                    key={action.title}
                    className="rounded-2xl bg-white/10 p-px transition-all duration-300 hover:bg-gradient-to-r hover:from-emerald-400/70 hover:to-cyan-400/70 hover:shadow-[0_0_15px_rgba(45,212,191,0.2)]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSubject(action.subject);
                        void sendMessage(action.prompt);
                      }}
                      className="h-full w-full rounded-[15px] border border-white/10 bg-white/5 p-4 text-left backdrop-blur-md transition hover:bg-white/[0.07]"
                    >
                      <span className="block text-sm font-medium text-zinc-100">{action.title}</span>
                      <span className="mt-1 block text-xs text-zinc-500">{action.subject}</span>
                    </button>
                  </div>
                ))}
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
