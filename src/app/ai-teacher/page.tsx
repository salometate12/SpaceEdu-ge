import { ChatInterface } from "@/components/AITeacher/ChatInterface";

export default function AITeacherPage() {
  return (
    <main className="ai-teacher-surface h-[100dvh] w-full overflow-hidden md:h-[calc(100vh-3rem)]">
      <ChatInterface />
    </main>
  );
}
