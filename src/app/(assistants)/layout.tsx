import { AssistantPlatformShell } from "@/components/layout/AssistantPlatformShell";

export default function AssistantsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[var(--bg-primary)]">
      <AssistantPlatformShell>{children}</AssistantPlatformShell>
    </div>
  );
}
