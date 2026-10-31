"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FileText, Image as ImageIcon, Plus, Presentation, X } from "lucide-react";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { SUMMARY_MAX_FILES, SUMMARY_MAX_TOTAL_BYTES, totalBytes } from "@/lib/summary-files";

export const SUMMARY_ACCEPT = ".pdf,.docx,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp,application/pdf,image/*";

const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);
/** One file's size: KB under a megabyte, so a small file doesn't read „0.0 MB“. */
const size = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${mb(bytes)} MB`);

function iconFor(name: string) {
  const lower = name.toLowerCase();
  if (/\.(png|jpe?g|webp)$/.test(lower)) return ImageIcon;
  if (lower.endsWith(".pptx")) return Presentation;
  return FileText;
}

/**
 * The conspectus's files: a dropzone for up to five, then the list (48px
 * rows: icon, name, size, ✕), what's used of 5 files and 50 MB, and
 * „+ კიდევ ფაილი“ until there are five.
 */
export function SummaryFiles({
  files,
  onAdd,
  onRemove,
}: {
  files: File[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
}) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);

  if (files.length === 0) {
    return (
      <UploadDropzone
        accept={SUMMARY_ACCEPT}
        multiple
        onFiles={onAdd}
        label="ჩააგდე ფაილები აქ ან აირჩიე"
        hint="PDF, DOCX, PPTX, JPG, PNG · მაქს. 5 ფაილი"
        className="min-h-[200px]"
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-medium tabular-nums text-[var(--gen-muted)]">
        {files.length} / {SUMMARY_MAX_FILES} · {mb(totalBytes(files))} MB / {mb(SUMMARY_MAX_TOTAL_BYTES).replace(/\.0$/, "")} MB
      </p>
      <ul className="flex flex-col gap-2">
        {files.map((file, index) => {
          const Icon = iconFor(file.name);
          return (
            <li key={`${file.name}-${file.size}-${index}`} className="flex h-12 items-center gap-3 rounded-[12px] border border-[var(--gen-border)] pl-2 pr-1">
              <span className="tile-file flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[var(--tile-bg)] text-[var(--tile)]" aria-hidden>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-[var(--gen-title)]">{file.name}</span>
              <span className="shrink-0 text-[13px] tabular-nums text-[var(--gen-muted)]">{size(file.size)}</span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`${file.name}: მოშორება`}
                className="gen-focus flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--gen-muted)] hover:bg-[var(--gen-hover)]"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
      {files.length < SUMMARY_MAX_FILES ? (
        <>
          <input
            ref={input}
            id={inputId}
            type="file"
            multiple
            accept={SUMMARY_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              const picked = Array.from(event.target.files ?? []);
              event.target.value = "";
              if (picked.length > 0) onAdd(picked);
            }}
          />
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="gen-focus flex h-12 items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-dashed border-[var(--gen-field-border)] text-[14.5px] font-semibold text-[var(--gen-title)] hover:bg-[var(--gen-hover)]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            კიდევ ფაილი
          </button>
        </>
      ) : null}
    </div>
  );
}

/** Flashcards take one file: which of the conspectus's files stays. „გაუქმება“ keeps the conspectus. */
export function KeepOneFileDialog({ files, onKeep, onCancel }: { files: File[]; onKeep: (index: number) => void; onCancel: () => void }) {
  const [picked, setPicked] = useState(0);
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panel.current?.querySelector<HTMLElement>("[role=radio]")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onCancel}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="gen-card w-full max-w-md !rounded-[24px] p-5 pb-[calc(20px+env(safe-area-inset-bottom))] sm:p-6"
      >
        <h2 id={titleId} className="text-[17px] font-bold leading-snug text-[var(--gen-title)]">
          ფლეშბარათებისთვის 1 ფაილი გამოიყენება. რომელი დავტოვოთ?
        </h2>
        <div role="radiogroup" aria-labelledby={titleId} className="mt-4 flex flex-col gap-2">
          {files.map((file, index) => (
            <button
              key={`${file.name}-${index}`}
              type="button"
              role="radio"
              aria-checked={picked === index}
              onClick={() => setPicked(index)}
              className="gen-option gen-focus flex min-h-12 items-center gap-3 rounded-[12px] px-3 text-left"
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  picked === index ? "border-[#e11d74]" : "border-[var(--gen-field-border)]"
                }`}
                aria-hidden
              >
                {picked === index ? <span className="h-2.5 w-2.5 rounded-full bg-[#e11d74]" /> : null}
              </span>
              <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-[var(--gen-title)]">{file.name}</span>
              <span className="shrink-0 text-[13px] text-[var(--gen-muted)]">{size(file.size)}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 flex gap-2 max-sm:[&>*]:flex-1 sm:justify-end">
          <button type="button" onClick={onCancel} className="gen-secondary h-11 px-5 text-[14.5px]">
            გაუქმება
          </button>
          <button type="button" onClick={() => onKeep(picked)} className="gen-primary h-11 px-5 text-[14.5px]">
            დატოვება
          </button>
        </div>
      </div>
    </div>
  );
}
