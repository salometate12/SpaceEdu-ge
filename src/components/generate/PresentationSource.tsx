"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, Presentation, Search, X } from "lucide-react";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { listPresentations, type SavedPresentation } from "@/lib/presentation-store";
import { MONTH_LONG } from "@/lib/study-day";
import { SUMMARY_MAX_FILES } from "@/lib/summary-files";
import { SummaryCounter, SummaryFiles } from "./SummaryFiles";

const PPTX_ACCEPT = ".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation";

export type PresentationMode = "saved" | "pptx";

const SEARCH_FROM = 6;

function savedDate(at: number): string {
  const date = new Date(at);
  return `${date.getDate()} ${MONTH_LONG[date.getMonth()]}`;
}

/** The generated presentations on this account (drafts have no slides to learn from). */
function useSavedPresentations(): SavedPresentation[] | null {
  const [items, setItems] = useState<SavedPresentation[] | null>(null);
  useEffect(() => {
    let active = true;
    listPresentations()
      .then((all) => {
        if (active) setItems(all.filter((item) => item.slides && item.slides.length > 0).sort((a, b) => b.updatedAt - a.updatedAt));
      })
      .catch(() => active && setItems([]));
    return () => {
      active = false;
    };
  }, []);
  return items;
}

/**
 * A presentation as material: the user's own (their slides become the text)
 * or an uploaded .pptx (read on the server). A flashcard deck takes one; a
 * conspectus (`multiple`) up to five, from both tabs together.
 */
export function PresentationSource({
  mode,
  onMode,
  selected,
  onSelect,
  files,
  onAddFiles,
  onRemoveFile,
  multiple,
}: {
  mode: PresentationMode;
  onMode: (mode: PresentationMode) => void;
  /** The chosen saved presentations; `size` is what its text weighs. */
  selected: { id: string; name: string; size: number }[];
  /** Chooses it (or, with `multiple`, takes it off when already chosen). */
  onSelect: (presentation: SavedPresentation) => void;
  files: File[];
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  multiple: boolean;
}) {
  const items = useSavedPresentations();
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter((item) => !q || item.title.toLowerCase().includes(q));
  }, [items, query]);
  const count = selected.length + files.length;
  const file = files[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div role="radiogroup" aria-label="პრეზენტაციის წყარო" className="grid h-11 grid-cols-2 rounded-full bg-[var(--gen-soft)] p-1">
        {(
          [
            ["saved", "ჩემი პრეზენტაციები"],
            ["pptx", "PPTX ფაილი"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={mode === id}
            onClick={() => onMode(id)}
            className={`gen-focus rounded-full text-[14px] font-semibold transition-colors ${
              mode === id ? "bg-[var(--gen-card)] text-[var(--gen-title)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "text-[var(--gen-muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "saved" ? (
        items === null ? (
          <div className="h-[120px] animate-pulse rounded-[16px] bg-[var(--gen-soft)]" aria-hidden />
        ) : items.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-[var(--gen-field-border)] px-4 py-6 text-center">
            <p className="text-[15px] font-semibold text-[var(--gen-title)]">პრეზენტაციები ჯერ არ გაქვს</p>
            <Link href="/presentation" className="gen-focus mt-1 inline-block rounded-sm text-[14px] font-semibold text-[#be185d] hover:underline dark:text-[#f9a8d4]">
              შექმენი პრეზენტაცია →
            </Link>
          </div>
        ) : (
          <>
            {items.length > SEARCH_FROM ? (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gen-faint)]" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="მოძებნე პრეზენტაცია"
                  aria-label="მოძებნე პრეზენტაცია"
                  className="gen-field !h-11 !pl-10"
                />
              </div>
            ) : null}
            {multiple && count > 0 ? <SummaryCounter sources={[...selected, ...files]} /> : null}
            <div role={multiple ? "group" : "radiogroup"} aria-label="ჩემი პრეზენტაციები" className="flex max-h-[264px] flex-col gap-2 overflow-y-auto pr-1">
              {shown.map((item) => {
                const chosen = selected.some((pick) => pick.id === item.id);
                return (
                <button
                  key={item.id}
                  type="button"
                  role={multiple ? "checkbox" : "radio"}
                  aria-checked={chosen}
                  // Five in all: another comes in once one is taken off.
                  disabled={multiple && !chosen && count >= SUMMARY_MAX_FILES}
                  onClick={() => onSelect(item)}
                  className="gen-option gen-focus flex items-center gap-3 rounded-[14px] p-2.5 text-left disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {multiple ? (
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 ${chosen ? "border-[#e11d74] bg-[#e11d74] text-white" : "border-[var(--gen-field-border)]"}`} aria-hidden>
                      {chosen ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                    </span>
                  ) : null}
                  <span className="flex h-10 w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#fff7ed] text-[#c2410c] dark:bg-[rgba(249,115,22,0.14)] dark:text-[#fdba74]">
                    {item.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element -- a stored data URL
                      <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Presentation className="h-4 w-4" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-semibold text-[var(--gen-title)]">{item.title}</span>
                    <span className="block text-[13px] text-[var(--gen-muted)]">
                      {item.slides?.length ?? 0} სლაიდი · {savedDate(item.updatedAt)}
                    </span>
                  </span>
                </button>
                );
              })}
              {shown.length === 0 ? <p className="px-1 py-3 text-[14px] text-[var(--gen-muted)]">ასეთი პრეზენტაცია ვერ ვიპოვე.</p> : null}
            </div>
          </>
        )
      ) : multiple ? (
        <SummaryFiles
          files={files}
          beside={selected}
          onAdd={onAddFiles}
          onRemove={onRemoveFile}
          accept={PPTX_ACCEPT}
          label="ჩააგდე .pptx ფაილები აქ ან აირჩიე"
          hint={`.pptx · მაქს. ${SUMMARY_MAX_FILES} ფაილი`}
        />
      ) : file ? (
        <div className="flex items-center gap-3 rounded-[14px] border border-[var(--gen-border)] p-3">
          <span className="flex h-10 w-[72px] shrink-0 items-center justify-center rounded-[8px] bg-[#fff7ed] text-[#c2410c] dark:bg-[rgba(249,115,22,0.14)] dark:text-[#fdba74]">
            <Presentation className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14.5px] font-semibold text-[var(--gen-title)]">{file.name}</span>
            <span className="block text-[13px] text-[var(--gen-muted)]">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
          </span>
          <button type="button" onClick={() => onRemoveFile(0)} aria-label="ფაილის მოშორება" className="gen-focus flex h-9 w-9 items-center justify-center rounded-full text-[var(--gen-muted)] hover:bg-[var(--gen-hover)]">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : (
        <UploadDropzone
          accept={PPTX_ACCEPT}
          onFiles={(picked) => onAddFiles(picked.slice(0, 1))}
          label="ჩააგდე .pptx ფაილი აქ ან აირჩიე"
          hint=".pptx · მაქს. 20 MB"
          className="min-h-[170px]"
        />
      )}

      <p className="text-[13px] text-[var(--gen-muted)]">ვიყენებთ სლაიდების ტექსტს და შენიშვნებს.</p>
    </div>
  );
}
