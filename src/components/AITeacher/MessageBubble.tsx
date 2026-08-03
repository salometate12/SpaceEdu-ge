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
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#1A1A24] px-4 py-3 text-sm leading-relaxed text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  const showContent = content.trim().length > 0;

  return (
    <div className="flex justify-start gap-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/10 text-emerald-300 shadow-[0_0_18px_rgba(45,212,191,0.25)]"
        aria-hidden
      >
        <Sparkles className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="relative min-w-0 max-w-[88%] pt-1">
        <GeneratingIndicator visible={!showContent} />
        {showContent ? (
          <div className="ai-message-reveal text-[15px] leading-[1.75] text-zinc-100">
            <MarkdownContent
              content={content}
              className="[&_h1]:mb-2.5 [&_h1]:mt-1 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-white
                [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:border-none [&_h2]:pb-0 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white
                [&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-zinc-100
                [&_p]:my-2.5 [&_p]:leading-[1.75] [&_p]:text-zinc-200
                [&_ul]:my-2.5 [&_ul]:space-y-2 [&_ol]:my-2.5 [&_ol]:space-y-2
                [&_li]:leading-[1.7] [&_li]:text-zinc-200
                [&_strong]:font-semibold [&_strong]:text-white"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
