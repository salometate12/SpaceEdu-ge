import { ChatInterface } from "@/components/AITeacher/ChatInterface";

export default function AITeacherPage() {
  return (
    <main className="ai-teacher-surface under-site-header h-[calc(100dvh-7rem)] w-full overflow-hidden md:h-screen">
      <ChatInterface />
    </main>
  );
}
