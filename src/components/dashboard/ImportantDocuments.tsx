"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Trash2, Upload } from "lucide-react";
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

  return (
    <section className="dashboard-tool-card dashboard-tool-card--tinted dashboard-tool-card--sky rounded-[32px] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300">
            <FileText className="h-5 w-5 stroke-[1.75]" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              მნიშვნელოვანი დოკუმენტები
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
              შეინახე სილაბუსი, კონსპექტი ან პრეზენტაცია — მაქსიმუმ {MAX_DOCUMENTS}.
              ფაილები რჩება ამ ბრაუზერში.
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-zinc-300">
          {docs.length}/{MAX_DOCUMENTS}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          void take(event.target.files);
          event.target.value = "";
        }}
      />

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map((doc, index) => (
          <motion.article
            key={doc.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.28 }}
            className="group relative"
          >
            {/* The stacked-paper look: two sheets peeking out behind the card. */}
            <span
              className="pointer-events-none absolute inset-x-3 -top-2 h-6 rounded-t-2xl border border-slate-200/80 bg-white/70 dark:border-white/10 dark:bg-white/[0.05]"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute inset-x-1.5 -top-1 h-6 rounded-t-2xl border border-slate-200/90 bg-white/85 dark:border-white/10 dark:bg-white/[0.07]"
              aria-hidden
            />
            <div className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.5)] dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold tracking-wide text-slate-600 dark:bg-white/10 dark:text-zinc-200">
                  {documentKind(doc)}
                </span>
                <button
                  type="button"
                  onClick={() => void deleteDocument(doc.id)}
                  aria-label={`წაშალე ${doc.name}`}
                  className="rounded-full p-1.5 text-slate-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5 stroke-[2]" aria-hidden />
                </button>
              </div>

              <button
                type="button"
                onClick={() => void open(doc)}
                className="mt-3 block w-full text-left"
              >
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {doc.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                  {formatDocumentSize(doc.size)} · გახსნა
                </p>
              </button>
            </div>
          </motion.article>
        ))}

        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              void take(event.dataTransfer.files);
            }}
            className={`flex min-h-[112px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-center transition ${
              dragging
                ? "border-sky-400 bg-sky-50 dark:border-sky-400/50 dark:bg-sky-400/10"
                : "border-slate-300 text-slate-500 hover:border-sky-400 hover:text-sky-600 dark:border-white/15 dark:text-zinc-400 dark:hover:border-sky-400/50"
            }`}
          >
            {dragging ? (
              <Upload className="h-5 w-5 stroke-[1.75]" aria-hidden />
            ) : (
              <Plus className="h-5 w-5 stroke-[1.75]" aria-hidden />
            )}
            <span className="text-xs font-semibold">
              {docs.length === 0 ? "დაამატე დოკუმენტი" : "კიდევ ერთი"}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500">
              PDF, Word, პრეზენტაცია
            </span>
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 text-xs font-semibold text-rose-600 dark:text-rose-300" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
