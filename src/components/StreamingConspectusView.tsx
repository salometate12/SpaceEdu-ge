"use client";

import { GenerationProgress } from "@/components/generate/GenerationProgress";
import "@/components/generate/generate.css";
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
import { AiRequestError, streamAiText } from "@/lib/assistant-stream-client";
import { decodeSkippedFiles, isNoContentAnswer, mightBeNoContent, NO_TEXT_CODE, SKIPPED_FILES_HEADER } from "@/lib/conspectus-empty";
import { NoTextScreen, SkippedFilesChip } from "@/components/conspectus/NoTextNotice";
import { STORED_NAMES } from "@/lib/stored-file";
import { buildGenerationFormData } from "@/lib/build-generation-form-data";
import { stageUploads } from "@/lib/stage-uploads";
import { ConspectusViewer } from "@/components/conspectus/ConspectusViewer";

interface StreamingConspectusViewProps {
  initialPending?: UploadedData;
}

interface PendingPayload {
  formData: FormData;
  topic: string;
  data?: UploadedData;
}

function saveAndRedirect(
  router: ReturnType<typeof useRouter>,
  pending: PendingPayload,
  body: string,
  savedRef: React.MutableRefObject<boolean>,
  skippedFiles: string[] = [],
) {
  const topic = pending.topic;
  const inputType = pending.formData.get("inputType");
  const sourceLabel = pending.formData.get("sourceLabel");
  const subjectId = pending.formData.get("subjectId");
  const topicId = pending.formData.get("topicId");
  if (savedRef.current || !body.trim()) return false;

  savedRef.current = true;
  const id = createConspectusId();
  const title = topic.trim() || extractTitleFromMarkdown(body);

  saveConspectus({
    id,
    title,
    content: body.trim(),
    createdAt: Date.now(),
    status: "ready",
    ...(typeof inputType === "string" && inputType ? { sourceType: inputType } : {}),
    ...(typeof sourceLabel === "string" && sourceLabel ? { sourceLabel } : {}),
    ...(typeof subjectId === "string" && typeof topicId === "string" && subjectId && topicId ? { subjectId, topicId } : {}),
    ...(skippedFiles.length > 0 ? { skippedFiles } : {}),
  });

  router.replace(`/conspectus/${id}`);
  return true;
}

/** The names of the files sent: dropped ones, and those in storage (sent as paths with their names). */
function fileNames(formData: FormData): string[] {
  const names = formData.getAll(STORED_NAMES).map(String).filter(Boolean);
  for (const value of [...formData.getAll("files"), ...formData.getAll("file")]) {
    if (typeof value !== "string" && value.name) names.push(value.name);
  }
  const label = formData.get("sourceLabel");
  return names.length > 0 ? names : typeof label === "string" && label ? [label] : [];
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
  // No text in the material: which files (nothing is saved).
  const [noText, setNoText] = useState<string[] | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);
  const skippedRef = useRef<string[]>([]);

  const updateContent = useCallback((value: string) => {
    contentRef.current = value;
    setContent(value);
  }, []);

  const runStream = useCallback(
    async (pending: PendingPayload, controller: AbortController) => {
      setError(null);
      setStreamWarning(null);
      setNoText(null);
      setSkipped([]);
      skippedRef.current = [];
      setIsLoading(true);
      updateContent("");

      try {
        // Dropped files go to storage first, so the request carries only their paths;
        // a retry reuses them.
        if (pending.data) {
          const staged = await stageUploads(pending.data);
          pending.data = staged;
          pending.formData = buildGenerationFormData(staged);
        }
        const finalText = await streamAiText("/api/generate-summary", pending.formData, {
          signal: controller.signal,
          fallbackError: ka.generator.error,
          sanitizeMarkdown: true,
          onResponse: (response) => {
            skippedRef.current = decodeSkippedFiles(response.headers.get(SKIPPED_FILES_HEADER));
            setSkipped(skippedRef.current);
          },
          // While the answer could still be „[[NO_CONTENT]]“, nothing is shown.
          onChunk: (partial) => {
            if (mightBeNoContent(partial)) return;
            updateContent(partial);
          },
        });

        if (controller.signal.aborted) return;

        // The AI found nothing to make a conspectus from: nothing is saved.
        if (isNoContentAnswer(finalText)) {
          updateContent("");
          setNoText(fileNames(pending.formData));
          setIsLoading(false);
          return;
        }

        const body = finalText.trim() || contentRef.current.trim();
        if (!body) {
          throw new Error(ka.generator.error);
        }

        saveAndRedirect(router, pending, body, savedRef, skippedRef.current);
      } catch (err) {
        if (controller.signal.aborted) return;

        // The server found no text in the files and didn't ask the AI.
        if (err instanceof AiRequestError && err.code === NO_TEXT_CODE) {
          const files = err.json<{ files: string[] }>().files;
          setNoText(Array.isArray(files) && files.length > 0 ? files : fileNames(pending.formData));
          setIsLoading(false);
          return;
        }

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
    saveAndRedirect(router, pending, contentRef.current, savedRef, skippedRef.current);
  };

  const leftPanel = (
    <div className="space-y-4">
      <Link
        href="/generate"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-pink-600 dark:text-zinc-400"
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
        <p className="text-[11px] font-semibold uppercase tracking-wider text-pink-500">
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
              className="inline-flex items-center gap-1 rounded-full border border-pink-500/30 bg-pink-500/10 px-2.5 py-1 text-[11px] font-medium text-pink-200 hover:border-pink-400/50"
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
            className="inline-flex items-center gap-1 rounded-full border border-pink-500/30 bg-pink-500/10 px-2.5 py-1 text-[11px] font-medium text-pink-200"
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

  if (noText) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <NoTextScreen files={noText} />
      </div>
    );
  }

  // Before the first words arrive: the generator's loader, with sheets.
  if (isSearchingPhase || (error && content.length === 0)) {
    return (
      <GenerationProgress
        kind="summary"
        total={0}
        ready={0}
        error={error}
        onRetry={retryStream}
        onBack={() => router.push("/generate")}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ConspectusViewer
        content={content}
        leftPanel={leftPanel}
        isLoading={isSearchingPhase}
        loadingBanner={
          <>
          <SkippedFilesChip files={skipped} />
          {isWritingPhase ? (
            <div className="flex shrink-0 items-center gap-2 border-b border-pink-200/50 bg-pink-50/50 px-4 py-2 text-xs font-medium text-pink-800 dark:border-pink-900/30 dark:bg-pink-950/20 dark:text-pink-200 lg:px-8">
              <Cpu className="h-3.5 w-3.5 animate-pulse stroke-[1.5]" />
              {ka.generator.modal.loadingSummary}
            </div>
          ) : isSearchingPhase ? (
            <div className="flex shrink-0 items-center gap-2 border-b border-pink-200/50 bg-pink-50/50 px-4 py-2 text-xs font-medium text-pink-800 dark:border-pink-900/30 dark:bg-pink-950/20 dark:text-pink-200 lg:px-8">
              <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[1.5]" />
              {ka.generator.modal.loadingSummary}
            </div>
          ) : null}
          </>
        }
        showCursor={isWritingPhase}
        downloadFilename={topicRef.current || "conspectus"}
        accent="violet"
      />
    </div>
  );
}
