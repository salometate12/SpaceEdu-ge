import { ChatInterface } from "@/components/AITeacher/ChatInterface";

export default function AITeacherPage() {
  return (
    <main className="h-[calc(100dvh-7rem)] w-full overflow-hidden bg-[var(--bg-primary)] md:h-[calc(100vh-3rem)]">
      <ChatInterface />
    </main>
  );
}
