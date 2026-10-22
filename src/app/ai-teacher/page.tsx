import { ChatInterface } from "@/components/AITeacher/ChatInterface";

/** The student's AI teacher (university courses). The abiturient one is
 * /ai-teacher/abit. */
export default function AITeacherPage() {
  // Exactly one screen: the header floats over the top (under-site-header
  // pads it back), the sidebar runs to the bottom and only the chat feed
  // scrolls. On phones it's a full-screen chat with no dock: pinned to the
  // visible viewport (--vv-h / --vv-top, see useMobileChatViewport), so the
  // input rides on top of the keyboard and the page itself never scrolls.
  return (
    <main className="ai-teacher-surface under-site-header h-dvh w-full overflow-hidden max-md:fixed max-md:inset-x-0 max-md:top-[var(--vv-top,0px)] max-md:z-40 max-md:h-[var(--vv-h,100dvh)]">
      <ChatInterface space="student" />
    </main>
  );
}
