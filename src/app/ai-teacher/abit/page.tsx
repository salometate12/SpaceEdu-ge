import { ChatInterface } from "@/components/AITeacher/ChatInterface";

/** The abiturient's AI teacher (national-exam prep). Same page as the
 * student's /ai-teacher, with its own texts and history. */
export default function AbiturientAITeacherPage() {
  return (
    <main className="ai-teacher-surface under-site-header h-[calc(100dvh-7rem)] w-full overflow-hidden md:h-screen">
      <ChatInterface space="abiturient" />
    </main>
  );
}
