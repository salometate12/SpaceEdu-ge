import { Sparkles } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { GeneratingIndicator } from "./GeneratingIndicator";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[var(--accent-primary)] px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  const showContent = content.trim().length > 0;

  return (
    <div className="flex justify-start gap-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--accent-primary)]/25 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
        aria-hidden
      >
        <Sparkles className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="relative min-w-0 max-w-[88%] pt-1">
        <GeneratingIndicator visible={!showContent} />
        {showContent ? (
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
