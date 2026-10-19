"use client";

import { usePathname } from "next/navigation";
import { Sparkles, X } from "lucide-react";
import { useAIChatPanel } from "@/contexts/AIChatPanelContext";
import { useFocusMode } from "@/contexts/FocusModeContext";
import { mobileDockHidden } from "@/lib/mobile-nav";

/**
 * The round AI-chat button in the bottom-right corner — desktop only: on a
 * phone the dock's raised centre button opens the chat instead. The chat window opens
 * out of this corner and, on desktop, the button stays under it as the close
 * control. On a phone the window covers the screen and has its own close
 * button, so the bubble steps aside while it's open.
 *
 * On phones it sits above the bottom dock rather than on top of it.
 */
export function AIChatBubble() {
  const pathname = usePathname();
  const { focusMode } = useFocusMode();
  const { available, isOpen, isExpanded, toggle } = useAIChatPanel();

  if (!available || focusMode) return null;

  const aboveDock = !mobileDockHidden(pathname);

  return (
    <button
      type="button"
      data-ai-chat-bubble
      onClick={toggle}
      aria-label={isOpen ? "AI ჩატის დახურვა" : "AI ჩატის გახსნა"}
      aria-expanded={isOpen}
      aria-controls="ai-chat-window"
      title={isOpen ? "დახურვა" : "AI მასწავლებელი"}
      className={`fixed right-4 z-[61] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-primary)] text-white shadow-[0_10px_24px_-8px_rgba(216,24,120,0.5)] transition-[transform,opacity,box-shadow] duration-200 max-md:hidden hover:scale-105 hover:shadow-[0_14px_30px_-8px_rgba(216,24,120,0.6)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-500/30 active:scale-95 md:bottom-6 md:right-6 ${
        aboveDock
          ? "bottom-[calc(6rem+env(safe-area-inset-bottom))]"
          : "bottom-[max(1rem,env(safe-area-inset-bottom))]"
      } ${isOpen ? "max-md:pointer-events-none max-md:scale-75 max-md:opacity-0" : ""} ${
        isExpanded ? "md:pointer-events-none md:scale-75 md:opacity-0" : ""
      }`}
    >
      {isOpen ? (
        <X className="h-6 w-6" strokeWidth={2} aria-hidden />
      ) : (
        <Sparkles className="h-6 w-6" strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}
