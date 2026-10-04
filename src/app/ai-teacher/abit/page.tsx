import { ChatInterface } from "@/components/AITeacher/ChatInterface";

/** The abiturient's AI teacher (national-exam prep). Same page as the
 * student's /ai-teacher, with its own texts and history. */
export default function AbiturientAITeacherPage() {
  // Exactly one screen: the header floats over the top (under-site-header
  // pads it back), the sidebar runs to the bottom and only the chat feed
  // scrolls. On phones --site-header-h is 0 and the dock floats over the
  // input's own bottom padding.
  return (
    <main className="ai-teacher-surface under-site-header h-dvh w-full overflow-hidden">
      <ChatInterface space="abiturient" />
    </main>
  );
}
