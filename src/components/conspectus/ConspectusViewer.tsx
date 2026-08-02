"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowUp, Check, Copy, Download, Printer } from "lucide-react";
import { AssistantSplitLayout } from "@/components/layout/AssistantSplitLayout";
import { conspectusViewUi } from "@/lib/conspectus-view-ui";
import { extractMarkdownHeadings } from "@/lib/markdown-headings";
import { MarkdownContent } from "@/components/MarkdownContent";
import { TocPopover } from "./TocPopover";

export type ConspectusAccent = "amber" | "violet" | "sky" | "emerald";

interface ConspectusViewerProps {
  content: string;
  leftPanel?: ReactNode;
  emptyState?: ReactNode;
  isLoading?: boolean;
  loadingBanner?: ReactNode;
  showCursor?: boolean;
  downloadFilename?: string;
  accent?: ConspectusAccent;
  rightHeader?: ReactNode;
  toolbarExtra?: ReactNode;
  showUtilityBar?: boolean;
  premiumScrollRoot?: boolean;
}

const accentSpinner: Record<ConspectusAccent, string> = {
  amber: "border-t-amber-600",
  violet: "border-t-violet-600",
  sky: "border-t-sky-600",
  emerald: "border-t-emerald-600",
};

const accentCursor: Record<ConspectusAccent, string> = {
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  sky: "bg-sky-500",
  emerald: "bg-emerald-500",
};

function ConspectusContentArea({
  scrollRef,
  content,
  isLoading,
  showCursor,
  accent,
  headings,
  scrollToHeading,
  premiumScrollRoot = false,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  content: string;
  isLoading: boolean;
  showCursor: boolean;
  accent: ConspectusAccent;
  headings: ReturnType<typeof extractMarkdownHeadings>;
  scrollToHeading: (id: string) => void;
  premiumScrollRoot?: boolean;
}) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const hasContent = content.trim().length > 0;
  const scrollThreshold = premiumScrollRoot ? 300 : 320;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => setShowScrollTop(el.scrollTop > scrollThreshold);
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [hasContent, scrollRef, scrollThreshold]);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [scrollRef]);

  return (
    <div
      ref={scrollRef}
      data-assistant-scroll-root={premiumScrollRoot ? "" : undefined}
      className="scrollbar-thin relative min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 lg:p-8"
    >
      {hasContent ? (
        <div className="relative mx-auto w-full max-w-4xl">
          <TocPopover headings={headings} onSelect={scrollToHeading} />
          <article className="rounded-2xl border border-zinc-200/40 bg-white/60 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800/40 dark:bg-zinc-950/40 lg:rounded-3xl lg:p-10">
            <MarkdownContent content={content} withAnchors />
            {showCursor && (
              <span
                className={`ml-0.5 inline-block h-5 w-0.5 animate-pulse align-middle ${accentCursor[accent]}`}
                aria-hidden
              />
            )}
          </article>
        </div>
      ) : isLoading ? (
        <div className="mx-auto flex h-full min-h-[240px] w-full max-w-4xl items-center justify-center rounded-3xl border border-dashed border-zinc-200/80 dark:border-zinc-800">
          <div
            className={`h-9 w-9 animate-spin rounded-full border-2 border-zinc-200 ${accentSpinner[accent]}`}
          />
        </div>
      ) : null}

      {showScrollTop && !premiumScrollRoot && (
        <button
          type="button"
          onClick={scrollToTop}
          title={conspectusViewUi.scrollTop}
          className="absolute bottom-20 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200/80 bg-white/95 text-zinc-700 shadow-lg backdrop-blur-md transition-all hover:scale-105 dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-200 lg:bottom-8 lg:right-8 lg:h-11 lg:w-11"
          aria-label={conspectusViewUi.scrollTop}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function ConspectusViewer({
  content,
  leftPanel,
  emptyState,
  isLoading = false,
  loadingBanner,
  showCursor = false,
  downloadFilename = "conspectus",
  accent = "violet",
  rightHeader,
  toolbarExtra,
  showUtilityBar = true,
  premiumScrollRoot = false,
}: ConspectusViewerProps) {
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const hasContent = content.trim().length > 0;
  const headings = useMemo(
    () => (hasContent ? extractMarkdownHeadings(content) : []),
    [content, hasContent],
  );

  const safeFilename =
    downloadFilename.replace(/[^\p{L}\p{N}\s-]/gu, "").trim() || "conspectus";

  const scrollToHeading = useCallback((id: string) => {
    const root = contentScrollRef.current;
    const target = root?.querySelector(`#${CSS.escape(id)}`);
    if (target && root) {
      const top =
        target.getBoundingClientRect().top -
        root.getBoundingClientRect().top +
        root.scrollTop -
        24;
      root.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  const handleCopy = useCallback(async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const downloadFile = (filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showEmpty = !hasContent && !isLoading && !!emptyState;

  const readerPanel = (
    <>
      {rightHeader && (
        <div className="shrink-0 border-b border-zinc-200/50 bg-white/50 px-6 py-3 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/50 sm:px-8">
          {rightHeader}
        </div>
      )}

      {loadingBanner}

      {hasContent && showUtilityBar && (
        <div className="shrink-0 border-b border-zinc-200/50 bg-white/50 px-4 py-2.5 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/50 lg:px-8 lg:py-3">
          <div className="flex flex-wrap items-center gap-1.5 lg:gap-2">
            {toolbarExtra}
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200/80 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 lg:gap-1.5 lg:px-3.5 lg:text-sm"
              title={copied ? conspectusViewUi.copied : conspectusViewUi.copy}
            >
              <span className="lg:hidden">{copied ? "✓" : "📋"}</span>
              <span className="hidden items-center gap-1.5 lg:inline-flex">
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? conspectusViewUi.copied : `📋 ${conspectusViewUi.copy}`}
              </span>
            </button>
            <button
              type="button"
              onClick={() =>
                downloadFile(`${safeFilename}.txt`, "text/plain;charset=utf-8")
              }
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200/80 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 lg:gap-1.5 lg:px-3.5 lg:text-sm"
              title={conspectusViewUi.download}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">📥 {conspectusViewUi.download}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200/80 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 lg:gap-1.5 lg:px-3.5 lg:text-sm"
              title={conspectusViewUi.downloadPdf}
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{conspectusViewUi.downloadPdf}</span>
            </button>
          </div>
        </div>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col">
        <ConspectusContentArea
          scrollRef={contentScrollRef}
          content={content}
          isLoading={isLoading}
          showCursor={showCursor}
          accent={accent}
          headings={headings}
          scrollToHeading={scrollToHeading}
          premiumScrollRoot={premiumScrollRoot}
        />
      </div>
    </>
  );

  if (leftPanel) {
    return (
      <AssistantSplitLayout
        leftPanel={leftPanel}
        emptyState={emptyState}
        showEmpty={showEmpty}
      >
        {readerPanel}
      </AssistantSplitLayout>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      {showEmpty && emptyState ? (
        <div className="flex flex-1 items-center justify-center p-6 lg:p-10">{emptyState}</div>
      ) : (
        readerPanel
      )}
    </section>
  );
}
