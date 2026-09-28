"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { FileText, Info, Plus, Trash2, Upload } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import {
  DOCUMENTS_UPDATED_EVENT,
  MAX_DOCUMENTS,
  MAX_DOCUMENT_BYTES,
  addDocument,
  deleteDocument,
  documentKind,
  documentObjectUrl,
  formatDocumentSize,
  loadDocuments,
  type DocumentMeta,
} from "@/lib/important-documents";

const ERROR_TEXT: Record<string, string> = {
  full: `მაქსიმუმ ${MAX_DOCUMENTS} დოკუმენტია — ჯერ წაშალე ერთ-ერთი.`,
  "too-large": `ფაილი ძალიან დიდია — ${Math.round(MAX_DOCUMENT_BYTES / (1024 * 1024))} MB-მდე.`,
  failed: "ფაილის შენახვა ვერ მოხერხდა. სცადე თავიდან.",
};

/**
 * Three important documents, kept on the dashboard.
 *
 * A shelf rather than an upload: the files stay in this browser, so the
 * syllabus, the reading and the deck a student needs every week are one
 * click away without going through mail or a drive.
 */
export function ImportantDocuments() {
  const [docs, setDocs] = useState<DocumentMeta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    const sync = () => {
      void loadDocuments().then((list) => {
        if (active) setDocs(list);
      });
    };
    sync();
    window.addEventListener(DOCUMENTS_UPDATED_EVENT, sync);
    return () => {
      active = false;
      window.removeEventListener(DOCUMENTS_UPDATED_EVENT, sync);
    };
  }, []);

  const take = useCallback(async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    const result = await addDocument(file);
    if (!result.ok) setError(ERROR_TEXT[result.reason] ?? ERROR_TEXT.failed);
  }, []);

  const open = async (doc: DocumentMeta) => {
    const url = await documentObjectUrl(doc.id);
    if (!url) return;
    window.open(url, "_blank", "noopener");
    // The tab has the blob by now; the URL itself can go.
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const full = docs.length >= MAX_DOCUMENTS;
  const empty = docs.length === 0;

  const dropHandlers = {
    onDragOver: (event: DragEvent) => {
      event.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      setDragging(false);
      void take(event.dataTransfer.files);
    },
  };

  return (
    <DashboardCard
      icon={FileText}
      title="მნიშვნელოვანი დოკუმენტები"
      subtitle={`სილაბუსი, კონსპექტი ან პრეზენტაცია · მაქს. ${MAX_DOCUMENTS}`}
      meta={`${docs.length}/${MAX_DOCUMENTS}`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          void take(event.target.files);
          event.target.value = "";
        }}
      />

      {empty ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          {...dropHandlers}
          className={`mt-4 flex h-16 w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50 ${
            dragging
              ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 text-[var(--accent-primary)]"
              : "border-[var(--border-hover)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
          }`}
        >
          {dragging ? (
            <Upload className="h-4 w-4" strokeWidth={2} aria-hidden />
          ) : (
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
          )}
          <span className="font-medium">დაამატე დოკუმენტი</span>
          <span className="hidden text-[var(--text-muted)] sm:inline">· PDF, Word, პრეზენტაცია</span>
        </button>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="group relative flex h-14 items-center gap-3 rounded-xl border border-[var(--border)] px-3 transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--bg-secondary)]"
            >
              <span
                className="flex h-8 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-[10px] font-semibold tracking-wide text-[var(--text-secondary)] group-hover:bg-[var(--bg-card)]"
                aria-hidden
              >
                {documentKind(doc).slice(0, 4)}
              </span>
              <button
                type="button"
                onClick={() => void open(doc)}
                className="min-w-0 flex-1 text-left after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[var(--accent-primary)]/50"
              >
                <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
                  {doc.name}
                </span>
                <span className="block text-xs text-[var(--text-muted)]">
                  {formatDocumentSize(doc.size)} · {addedLabel(doc.addedAt)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => void deleteDocument(doc.id)}
                aria-label={`წაშალე ${doc.name}`}
                title="წაშლა"
                className="relative z-10 rounded-lg p-1.5 text-[var(--text-muted)] opacity-100 transition hover:bg-rose-500/10 hover:text-rose-600 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </button>
            </li>
          ))}

          {!full && (
            <li>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                {...dropHandlers}
                className={`flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-dashed text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50 ${
                  dragging
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 text-[var(--accent-primary)]"
                    : "border-[var(--border-hover)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                }`}
              >
                <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
                <span className="font-medium">კიდევ ერთი</span>
              </button>
            </li>
          )}
        </ul>
      )}

      {error && (
        <p className="mt-3 text-xs font-medium text-rose-600 dark:text-rose-300" role="alert">
          {error}
        </p>
      )}

      <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <Info className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
        ფაილები რჩება ამ ბრაუზერში
      </p>
    </DashboardCard>
  );
}

/** "დღეს" or "28.09" — when the file went on the shelf. */
function addedLabel(at: number): string {
  const then = new Date(at);
  if (then.toDateString() === new Date().toDateString()) return "დღეს";
  return `${String(then.getDate()).padStart(2, "0")}.${String(then.getMonth() + 1).padStart(2, "0")}`;
}
