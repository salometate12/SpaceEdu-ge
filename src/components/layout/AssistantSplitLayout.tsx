import type { ReactNode } from "react";

interface AssistantSplitLayoutProps {
  leftPanel: ReactNode;
  children: ReactNode;
  emptyState?: ReactNode;
  showEmpty?: boolean;
}

export function AssistantSplitLayout({
  leftPanel,
  children,
  emptyState,
  showEmpty = false,
}: AssistantSplitLayoutProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden lg:flex-row">
      <aside className="flex max-h-[min(50dvh,28rem)] w-full shrink-0 flex-col overflow-hidden border-b border-zinc-200/80 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/50 lg:max-h-none lg:w-[min(100%,20rem)] lg:border-b-0 lg:border-r">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-5">
          {leftPanel}
        </div>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--background)]">
        {showEmpty && emptyState ? (
          <div className="flex flex-1 items-center justify-center p-6">
            {emptyState}
          </div>
        ) : (
          children
        )}
      </section>
    </div>
  );
}
