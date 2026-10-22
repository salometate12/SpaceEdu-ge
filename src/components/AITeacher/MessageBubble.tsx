import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { CopyButton } from "@/components/CodeBlock";
import { markdownToPlainText } from "@/lib/markdown-blocks";
import type { AiTeacherSpace } from "@/lib/ai-teacher-content";
import { QuickReplies } from "./QuickReplies";
import { ThinkingIndicator } from "./ThinkingIndicator";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  /** While the answer is empty: "full" waiting card (page) or stages only. */
  waitingVariant?: "full" | "compact";
  space?: AiTeacherSpace;
  /** "sheet": the phone chat sheet — the same look, a little smaller. */
  appearance?: "default" | "sheet";
  /** The answer has finished streaming: show its copy buttons. */
  complete?: boolean;
  /** The last answer on the page: the quick follow-ups go under it. */
  onQuickReply?: (prompt: string) => void;
}

export function MessageBubble({
  role,
  content,
  waitingVariant = "compact",
  space,
  appearance = "default",
  complete = false,
  onQuickReply,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const sheet = appearance === "sheet";

  if (isUser) {
    return (
      <div data-chat-message="user" className="group flex items-start justify-end gap-1.5">
        {sheet ? null : (
          <CopyButton
            text={content}
            iconOnly
            className="mt-2.5 p-1 text-[var(--chat-text-muted)] opacity-0 hover:text-[var(--chat-text-strong)] focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:hidden"
          />
        )}
        {/* Neutral and soft; the page bubble has a tucked-in corner. */}
        <div
          className={
            sheet
              ? "max-w-[75%] rounded-[24px] bg-[#f4f4f5] px-4 py-2.5 text-[16px] font-medium leading-[1.5] text-[#18181b] dark:bg-[#1f1f22] dark:text-[#f4f4f5]"
              : "max-w-[78%] rounded-[20px_20px_6px_20px] bg-[var(--chat-user-bg)] px-4 py-2.5 text-[16px] leading-[1.55] text-[var(--chat-user-text)]"
          }
        >
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  const showContent = content.trim().length > 0;

  return (
    // The page starts an answer straight with its text; the phone sheet keeps a small AI mark.
    <div data-chat-message="assistant" className={`flex justify-start ${sheet ? "gap-2.5" : ""}`}>
      {sheet ? (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]" aria-hidden>
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
        </div>
      ) : null}
      <div className={`relative min-w-0 flex-1 ${sheet ? "pt-0.5" : "max-w-3xl"}`}>
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
        {showContent ? (
          // Structure from size and weight, bold as a marker stroke — see
          // .ai-answer in globals.css and chat-theme.css.
          <div className={`ai-message-reveal ai-answer ${sheet ? "ai-answer--compact" : ""}`}>
            <MarkdownContent content={content} markBold={!sheet} />
          </div>
        ) : null}
        {complete && showContent && !sheet && onQuickReply ? (
          // Phones show these above the input instead.
          <QuickReplies onSend={onQuickReply} copyText={content} className="mt-3 max-md:hidden" />
        ) : null}
        {complete && showContent && !sheet && !onQuickReply ? (
          <div className="mt-1.5 flex items-center gap-1 opacity-70 transition-opacity hover:opacity-100 [@media(hover:none)]:opacity-100">
            <CopyButton
              text={content}
              className="px-2 py-1 text-[var(--chat-text-muted)] hover:bg-[var(--chat-hover)] hover:text-[var(--chat-text-strong)]"
            />
            <CopyButton
              text={markdownToPlainText(content)}
              label="ტექსტად"
              className="px-2 py-1 text-[var(--chat-text-muted)] hover:bg-[var(--chat-hover)] hover:text-[var(--chat-text-strong)]"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
