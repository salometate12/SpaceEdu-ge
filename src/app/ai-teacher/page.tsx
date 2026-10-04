import { ChatInterface } from "@/components/AITeacher/ChatInterface";

/** The student's AI teacher (university courses). The abiturient one is
 * /ai-teacher/abit. */
export default function AITeacherPage() {
  // Exactly one screen: the header floats over the top (under-site-header
  // pads it back), the sidebar runs to the bottom and only the chat feed
  // scrolls. On phones --site-header-h is 0 and the dock floats over the
  // input's own bottom padding.
  return (
    <main className="ai-teacher-surface under-site-header h-dvh w-full overflow-hidden">
      <ChatInterface space="student" />
    </main>
  );
}
