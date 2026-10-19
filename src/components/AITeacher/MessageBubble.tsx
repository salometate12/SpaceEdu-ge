import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import type { AiTeacherSpace } from "@/lib/ai-teacher-content";
import { ThinkingIndicator } from "./ThinkingIndicator";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  /** While the answer is empty: "full" waiting card (page) or stages only. */
  waitingVariant?: "full" | "compact";
  space?: AiTeacherSpace;
  /** "sheet": the phone chat sheet's neutral look — a dark user bubble and
   * the AI's answer as plain text beside a small mark. */
  appearance?: "default" | "sheet";
}

export function MessageBubble({
  role,
  content,
  waitingVariant = "compact",
  space,
  appearance = "default",
}: MessageBubbleProps) {
  const isUser = role === "user";
  const sheet = appearance === "sheet";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className={
            sheet
              ? "max-w-[85%] rounded-[18px_18px_6px_18px] bg-[#18181b] px-4 py-2.5 text-[14px] leading-[1.55] text-[#f4f4f5] dark:bg-[#f4f4f5] dark:text-[#18181b]"
              : "max-w-[85%] rounded-2xl rounded-br-md bg-[var(--accent-primary)] px-4 py-3 text-sm leading-relaxed text-white shadow-sm"
          }
        >
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  const showContent = content.trim().length > 0;

  return (
    <div className={`flex justify-start ${sheet ? "gap-2.5" : "gap-3"}`}>
      <div
        className={
          sheet
            ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-[#fdf2f8] text-[var(--accent-primary)] dark:bg-[rgba(216,24,120,0.15)]"
            : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--accent-primary)]/25 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
        }
        aria-hidden
      >
        <Sparkles className={sheet ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={1.75} />
      </div>
      <div className={`relative min-w-0 ${sheet ? "flex-1 pt-0.5" : "max-w-[88%] pt-1"}`}>
        <AnimatePresence initial={false}>
          {!showContent ? (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <ThinkingIndicator variant={waitingVariant} space={space} />
            </motion.div>
          ) : null}
        </AnimatePresence>
        {showContent && sheet ? (
          <div className="ai-message-reveal text-[14px] leading-[1.65] text-[#18181b] dark:text-[#f4f4f5]">
            <MarkdownContent
              content={content}
              className="[&_h1]:mb-2 [&_h1]:mt-1 [&_h1]:text-base [&_h1]:font-semibold
                [&_h2]:mb-1.5 [&_h2]:mt-3 [&_h2]:border-none [&_h2]:pb-0 [&_h2]:text-[15px] [&_h2]:font-semibold
                [&_h3]:mb-1 [&_h3]:mt-2.5 [&_h3]:text-[14px] [&_h3]:font-semibold
                [&_p]:my-2 [&_p]:text-[14px] [&_p]:leading-[1.65] [&_p]:!text-[#3f3f46] dark:[&_p]:!text-[#d4d4d8]
                [&_ul]:my-2 [&_ul]:space-y-1.5 [&_ol]:my-2 [&_ol]:space-y-1.5
                [&_li]:text-[14px] [&_li]:leading-[1.6] [&_li]:!text-[#3f3f46] dark:[&_li]:!text-[#d4d4d8]
                [&_strong]:font-semibold"
            />
          </div>
        ) : showContent ? (
          <div className="ai-message-reveal text-[15px] leading-[1.75] text-[var(--text-primary)]">
            <MarkdownContent
              content={content}
              className="[&_h1]:mb-2.5 [&_h1]:mt-1 [&_h1]:!text-[var(--accent-primary)] [&_h1]:text-lg [&_h1]:font-bold
                [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:border-none [&_h2]:pb-0 [&_h2]:!text-[var(--accent-primary)] [&_h2]:text-base [&_h2]:font-semibold
                [&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3]:!text-[var(--accent-secondary)] [&_h3]:text-[15px] [&_h3]:font-semibold
                [&_p]:my-2.5 [&_p]:leading-[1.75] [&_p]:text-[var(--text-secondary)]
                [&_ul]:my-2.5 [&_ul]:space-y-2 [&_ol]:my-2.5 [&_ol]:space-y-2
                [&_li]:leading-[1.7] [&_li]:text-[var(--text-secondary)]
                [&_strong]:!text-[var(--accent-amber)] [&_strong]:!bg-[var(--accent-amber)]/10 [&_strong]:rounded [&_strong]:px-1 [&_strong]:py-0.5 [&_strong]:font-semibold"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
