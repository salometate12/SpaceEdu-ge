"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Cpu, Loader2, RotateCcw, Square } from "lucide-react";
import { ka } from "@/lib/i18n";
import {
  consumePendingSummaryGeneration,
  setPendingSummaryGeneration,
} from "@/lib/pending-generation";
import type { UploadedData } from "@/lib/generation-input";
import {
  createConspectusId,
  extractTitleFromMarkdown,
  saveConspectus,
} from "@/lib/conspectus-storage";
import { streamAiText } from "@/lib/assistant-stream-client";
import { ConspectusViewer } from "@/components/conspectus/ConspectusViewer";

interface StreamingConspectusViewProps {
  initialPending?: UploadedData;
}

interface PendingPayload {
  formData: FormData;
  topic: string;
}

function saveAndRedirect(
  router: ReturnType<typeof useRouter>,
  topic: string,
  body: string,
  savedRef: React.MutableRefObject<boolean>,
) {
  if (savedRef.current || !body.trim()) return false;

  savedRef.current = true;
  const id = createConspectusId();
  const title = topic.trim() || extractTitleFromMarkdown(body);

  saveConspectus({
    id,
    title,
    content: body.trim(),
    createdAt: Date.now(),
  });

  router.replace(`/conspectus/${id}`);
  return true;
}

export function StreamingConspectusView({
  initialPending,
}: StreamingConspectusViewProps) {
  const router = useRouter();
  const topicRef = useRef("");
  const savedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const pendingRef = useRef<PendingPayload | null>(null);
  const contentRef = useRef("");

  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamWarning, setStreamWarning] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const updateContent = useCallback((value: string) => {
    contentRef.current = value;
    setContent(value);
  }, []);

  const runStream = useCallback(
    async (pending: PendingPayload, controller: AbortController) => {
      setError(null);
      setStreamWarning(null);
      setIsLoading(true);
      updateContent("");

      try {
        const finalText = await streamAiText("/api/generate-summary", pending.formData, {
          signal: controller.signal,
          fallbackError: ka.generator.error,
          sanitizeMarkdown: true,
          onChunk: updateContent,
        });

        if (controller.signal.aborted) return;

        const body = finalText.trim() || contentRef.current.trim();
        if (!body) {
          throw new Error(ka.generator.error);
        }

        saveAndRedirect(router, pending.topic, body, savedRef);
      } catch (err) {
        if (controller.signal.aborted) return;

        const partial = contentRef.current.trim();
        if (partial.length > 120) {
          setStreamWarning(ka.conspectus.streamInterrupted);
          setIsLoading(false);
          return;
        }

        setError(err instanceof Error ? err.message : ka.generator.error);
        setIsLoading(false);
      } finally {
        if (!controller.signal.aborted && !contentRef.current.trim()) {
          setIsLoading(false);
        }
      }
    },
    [router, updateContent],
  );

  useEffect(() => {
    if (savedRef.current) return;

    let pending = pendingRef.current;
    if (!pending) {
      pending = consumePendingSummaryGeneration();
      if (!pending && initialPending) {
        setPendingSummaryGeneration(initialPending);
        pending = consumePendingSummaryGeneration();
      }
    }

    if (!pending) {
      router.replace("/generate");
      return;
    }

    pendingRef.current = pending;
    topicRef.current = pending.topic;

    const controller = new AbortController();
    abortRef.current = controller;

    void runStream(pending, controller);

    return () => {
      controller.abort();
      abortRef.current = null;
    };
  }, [initialPending, retryToken, router, runStream]);

  const stop = () => {
    abortRef.current?.abort();
    setIsLoading(false);
  };

  const retryStream = () => {
    if (!pendingRef.current) return;
    savedRef.current = false;
    setRetryToken((value) => value + 1);
  };

  const savePartial = () => {
    const pending = pendingRef.current;
    if (!pending) return;
    saveAndRedirect(router, pending.topic, contentRef.current, savedRef);
  };

  const leftPanel = (
    <div className="space-y-4">
      <Link
        href="/generate"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-violet-600 dark:text-zinc-400"
        onClick={(e) => {
          if (isLoading) {
            e.preventDefault();
            stop();
          }
        }}
      >
        <ArrowLeft className="h-4 w-4 stroke-[1.5]" />
        {ka.conspectus.back}
      </Link>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-500">
          AI კონსპექტი
        </p>
        <h1 className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {topicRef.current || ka.generator.modal.summaryTitle}
        </h1>
      </div>
      {isLoading && (
        <button
          type="button"
          onClick={stop}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
        >
          <Square className="h-3 w-3 stroke-[1.5]" />
          {ka.conspectus.stop}
        </button>
      )}
      {streamWarning && (
        <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <p className="text-xs text-amber-200/90">{streamWarning}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={retryStream}
              className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-medium text-purple-200 hover:border-purple-400/50"
            >
              <RotateCcw className="h-3 w-3 stroke-[1.5]" />
              {ka.conspectus.retry}
            </button>
            <button
              type="button"
              onClick={savePartial}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-gray-300 hover:text-white"
            >
              {ka.conspectus.savePartial}
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="space-y-2 rounded-lg bg-red-50 px-3 py-2 dark:bg-red-950/30">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={retryStream}
            className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-medium text-purple-200"
          >
            <RotateCcw className="h-3 w-3 stroke-[1.5]" />
            {ka.conspectus.retry}
          </button>
        </div>
      )}
    </div>
  );

  const isSearchingPhase = isLoading && content.length === 0;
  const isWritingPhase = isLoading && content.length > 0;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ConspectusViewer
        content={content}
        leftPanel={leftPanel}
        isLoading={isSearchingPhase}
        loadingBanner={
          isWritingPhase ? (
            <div className="flex shrink-0 items-center gap-2 border-b border-violet-200/50 bg-violet-50/50 px-4 py-2 text-xs font-medium text-violet-800 dark:border-violet-900/30 dark:bg-violet-950/20 dark:text-violet-200 lg:px-8">
              <Cpu className="h-3.5 w-3.5 animate-pulse stroke-[1.5]" />
              {ka.generator.modal.loadingSummary}
            </div>
          ) : isSearchingPhase ? (
            <div className="flex shrink-0 items-center gap-2 border-b border-violet-200/50 bg-violet-50/50 px-4 py-2 text-xs font-medium text-violet-800 dark:border-violet-900/30 dark:bg-violet-950/20 dark:text-violet-200 lg:px-8">
              <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[1.5]" />
              {ka.generator.modal.loadingSummary}
            </div>
          ) : undefined
        }
        showCursor={isWritingPhase}
        downloadFilename={topicRef.current || "conspectus"}
        accent="violet"
      />
    </div>
  );
}
