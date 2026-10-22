import type { Viewport } from "next";
import type { ReactNode } from "react";

// Android: the keyboard shrinks the layout itself, so the chat's input sits
// right above it (iOS ignores this; useMobileChatViewport covers it there).
export const viewport: Viewport = {
  interactiveWidget: "resizes-content",
};

export default function AITeacherLayout({ children }: { children: ReactNode }) {
  return children;
}
