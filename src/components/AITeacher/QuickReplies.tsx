"use client";

import { CopyButton } from "@/components/CodeBlock";

/** The follow-ups under the last answer; each continues the same topic. */
export const QUICK_REPLIES = [
  { label: "უფრო მოკლედ", prompt: "უფრო მოკლედ.", tone: "green" },
  { label: "მაგალითი", prompt: "მაგალითი მომეცი.", tone: "yellow" },
  { label: "ქვიზი", prompt: "ქვიზი გამიკეთე ამ თემაზე.", tone: "pink" },
] as const;

const TONE: Record<(typeof QUICK_REPLIES)[number]["tone"], string> = {
  green: "border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] text-[var(--tint-green-text)]",
  yellow: "border-[var(--tint-yellow-border)] bg-[var(--tint-yellow-bg)] text-[var(--tint-yellow-text)]",
  pink: "border-[var(--tint-pink-border)] bg-[var(--tint-pink-bg)] text-[var(--tint-pink-text)]",
};

/**
 * „უფრო მოკლედ“ · „მაგალითი“ · „ქვიზი“ and a copy button: under the last
 * answer on desktop, above the input on phones (the chat's `.ai-chat` tokens).
 */
export function QuickReplies({
  onSend,
  copyText,
  className = "",
}: {
  onSend: (prompt: string) => void;
  /** The answer to copy; no copy button without it. */
  copyText?: string;
  className?: string;
}) {
  return (
    <div data-quick-replies className={`flex items-center gap-1.5 overflow-x-auto sm:gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}>
      {QUICK_REPLIES.map((reply) => (
        <button
          key={reply.label}
          type="button"
          onClick={() => onSend(reply.prompt)}
          className={`inline-flex h-[34px] shrink-0 items-center rounded-full border px-3 text-[13px] sm:px-3.5 font-semibold transition-[filter] hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${TONE[reply.tone]}`}
        >
          {reply.label}
        </button>
      ))}
      {copyText ? (
        <CopyButton
          text={copyText}
          iconOnly
          className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-[var(--chat-border)] text-[var(--chat-text-muted)] transition-colors hover:text-[var(--chat-text-strong)]"
        />
      ) : null}
    </div>
  );
}
