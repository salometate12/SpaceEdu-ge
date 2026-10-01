import { ChatInterface } from "@/components/AITeacher/ChatInterface";

/** The student's AI teacher (university courses). The abiturient one is
 * /ai-teacher/abit. */
export default function AITeacherPage() {
  return (
    <main className="ai-teacher-surface under-site-header h-[calc(100dvh-7rem)] w-full overflow-hidden md:h-screen">
      <ChatInterface space="student" />
    </main>
  );
}
