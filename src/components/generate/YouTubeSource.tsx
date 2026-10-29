"use client";

import { useEffect, useState } from "react";
import { Check, Link2, Loader2, TriangleAlert } from "lucide-react";
import { extractYouTubeVideoId } from "@/lib/ai/youtube-id";
import { formatClock } from "@/lib/generation-options";
import type { YouTubePreview } from "@/app/api/youtube-preview/route";

export type YouTubeMode = "whole" | "segment";

export type PreviewState =
  | { status: "idle" }
  | { status: "loading"; videoId: string }
  | { status: "ready"; preview: YouTubePreview }
  | { status: "error"; message: string };

/** The preview of the pasted video, fetched once the link holds a video id. */
export function useYouTubePreview(url: string): PreviewState {
  const videoId = extractYouTubeVideoId(url.trim());
  const [state, setState] = useState<PreviewState>({ status: "idle" });

  useEffect(() => {
    if (!videoId) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setState({ status: "loading", videoId });
      fetch(`/api/youtube-preview?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`)
        .then(async (response) => {
          const body = (await response.json()) as YouTubePreview & { error?: string };
          if (!active) return;
          if (!response.ok) setState({ status: "error", message: body.error ?? "ვიდეო ვერ ვიპოვე." });
          else setState({ status: "ready", preview: body });
        })
        .catch(() => active && setState({ status: "error", message: "ვიდეოს შემოწმება ვერ მოხერხდა. სცადე თავიდან." }));
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [videoId]);

  if (!videoId) return { status: "idle" };
  if (state.status === "ready" && state.preview.videoId !== videoId) return { status: "loading", videoId };
  return state;
}

export function YouTubeSource({
  url,
  onUrl,
  preview,
  mode,
  onMode,
  start,
  end,
  onStart,
  onEnd,
  rangeError,
}: {
  url: string;
  onUrl: (url: string) => void;
  preview: PreviewState;
  mode: YouTubeMode;
  onMode: (mode: YouTubeMode) => void;
  start: string;
  end: string;
  onStart: (value: string) => void;
  onEnd: (value: string) => void;
  rangeError: string | null;
}) {
  const ready = preview.status === "ready" ? preview.preview : null;
  // A segment needs timed captions; without them the chips stay hidden.
  const canSegment = Boolean(ready?.hasCaptions && ready.duration);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Link2 className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--gen-faint)]" aria-hidden />
        <input
          type="url"
          inputMode="url"
          value={url}
          onChange={(event) => onUrl(event.target.value)}
          placeholder="ჩასვი YouTube ბმული"
          aria-label="YouTube ბმული"
          className="gen-field !pl-11"
        />
      </div>

      {preview.status === "loading" ? (
        <div className="flex items-center gap-2 text-[14px] text-[var(--gen-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ვამოწმებთ ვიდეოს…
        </div>
      ) : null}
      {preview.status === "error" ? <p className="text-[14px] font-medium text-rose-600 dark:text-rose-400">{preview.message}</p> : null}

      {ready ? (
        <div className="flex flex-col gap-4 rounded-[18px] border border-[var(--gen-border)] p-3 sm:flex-row">
          <span className="relative block aspect-video w-full shrink-0 overflow-hidden rounded-[12px] bg-black sm:h-[112px] sm:w-[200px]">
            {/* eslint-disable-next-line @next/next/no-img-element -- YouTube's own thumbnail */}
            <img src={ready.thumbnail} alt="" className="h-full w-full object-cover" />
            {ready.duration ? (
              <span className="absolute bottom-1.5 right-1.5 rounded-[6px] bg-black/80 px-1.5 py-0.5 text-[12px] font-semibold tabular-nums text-white">
                {formatClock(ready.duration)}
              </span>
            ) : null}
          </span>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-[15px] font-semibold text-[var(--gen-title)]">{ready.title}</p>
            <p className="mt-0.5 truncate text-[13px] text-[var(--gen-muted)]">{ready.channel}</p>
            {ready.hasCaptions ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#15803d] dark:text-[#86efac]">
                <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                სუბტიტრები ნაპოვნია
              </p>
            ) : (
              <p className="mt-2 inline-flex items-start gap-1.5 text-[13px] font-semibold text-[#b45309] dark:text-[#fcd34d]">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                სუბტიტრები ვერ ვიპოვე. ბარათებს სუბტიტრებიდან ვქმნით, ამიტომ სცადე სხვა ვიდეო.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {canSegment ? (
        <div className="flex flex-col gap-3">
          <div role="radiogroup" aria-label="ვიდეოს ნაწილი" className="flex gap-2">
            {(
              [
                ["whole", "მთელი ვიდეო"],
                ["segment", "მონაკვეთი"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" role="radio" aria-checked={mode === id} onClick={() => onMode(id)} className="gen-chip">
                {label}
              </button>
            ))}
          </div>
          {mode === "segment" ? (
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-[var(--gen-muted)]">დასაწყისი</span>
                <input value={start} onChange={(e) => onStart(e.target.value)} placeholder="0:00" inputMode="numeric" className="gen-field !h-11 !w-28 text-center tabular-nums" aria-invalid={Boolean(rangeError)} />
              </label>
              <span className="pb-3 text-[var(--gen-muted)]" aria-hidden>
                →
              </span>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-[var(--gen-muted)]">დასასრული</span>
                <input value={end} onChange={(e) => onEnd(e.target.value)} placeholder={ready?.duration ? formatClock(ready.duration) : "10:00"} inputMode="numeric" className="gen-field !h-11 !w-28 text-center tabular-nums" aria-invalid={Boolean(rangeError)} />
              </label>
            </div>
          ) : null}
        </div>
      ) : null}
      {rangeError ? <p className="text-[13px] font-medium text-rose-600 dark:text-rose-400">{rangeError}</p> : null}
    </div>
  );
}
