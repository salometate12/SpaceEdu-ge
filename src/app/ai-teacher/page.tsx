import { ChatInterface } from "@/components/AITeacher/ChatInterface";

export default function AITeacherPage() {
  return (
    <main className="h-[calc(100dvh-7rem)] w-full overflow-hidden bg-[#0A0A0F] md:h-[calc(100vh-3rem)]">
      <ChatInterface />
    </main>
  );
}
