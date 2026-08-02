"use client";

import { Suspense, useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import { SpaceBackLink } from "@/components/layout/SpaceBackLink";
import { AiSkeletonLoader } from "@/components/ui/AiSkeletonLoader";
import { fetchAiJson, fetchAiMultipartJson } from "@/lib/ai/fetch-ai";
import type { ResearchResponse } from "@/lib/ai/research-platform-schema";

type AnalysisTab = "summary" | "sources" | "quotes";
type ToggleKey = "theses" | "methodology" | "literature";

interface ToggleOption {
  key: ToggleKey;
  label: string;
}

const TOGGLES: ToggleOption[] = [
  { key: "theses", label: "გამოყავი ძირითადი თეზისები" },
  { key: "methodology", label: "მეთოდოლოგიის ანალიზი" },
  { key: "literature", label: "ლიტერატურის მიმოხილვა" },
];

const TAB_LABELS: Record<AnalysisTab, string> = {
  summary: "რეზიუმე",
  sources: "წყაროები",
  quotes: "ციტატები",
};

const TEXT_EXTENSIONS = [".txt", ".md"];

function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

function isTextFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return (
    file.type.startsWith("text/") ||
    TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext))
  );
}

export function ResearchPlatform() {
  const [fileName, setFileName] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    theses: true,
    methodology: false,
    literature: false,
  });
  const [activeTab, setActiveTab] = useState<AnalysisTab>("summary");
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [result, setResult] = useState<ResearchResponse | null>(null);

  const selectedCount = useMemo(
    () => Object.values(toggles).filter(Boolean).length,
    [toggles],
  );

  const handleFile = (file: File) => {
    if (!isPdfFile(file) && !isTextFile(file)) {
      setError("მხარდაჭერა: PDF, TXT ან MD ფაილები.");
      return;
    }

    setError(null);
    setFileName(file.name);
    setDocumentFile(file);
    setAnalysisStarted(false);
    setResult(null);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const startAnalysis = async () => {
    if (!documentFile) {
      setError("გთხოვ, ჯერ ატვირთე დოკუმენტი.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisStarted(true);
    setResult(null);

    try {
      const data = isPdfFile(documentFile)
        ? await fetchAiMultipartJson<ResearchResponse>({
            pageType: "research-platform-abit",
            file: documentFile,
            fields: { toggles: JSON.stringify(toggles) },
          })
        : await fetchAiJson<ResearchResponse>({
            pageType: "research-platform-abit",
            responseMode: "json",
            payload: {
              fileName: documentFile.name,
              textBody: (await documentFile.text()).slice(0, 120_000),
              toggles,
            },
          });

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "AI ამჟამად მიუწვდომელია. სცადე კიდევ ერთხელ.",
      );
      setAnalysisStarted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const isPdf = documentFile ? isPdfFile(documentFile) : false;

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start gap-3">
        <Suspense fallback={null}>
          <SpaceBackLink className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-white" />
        </Suspense>
        <div className="min-w-0 flex-1">
          <h1 className="headline text-2xl font-bold text-slate-900 sm:text-3xl dark:text-zinc-100">
            კვლევის პლატფორმა
          </h1>
          <p className="mt-1 max-w-4xl text-sm text-slate-600 dark:text-zinc-400">
            ატვირთე სამეცნიერო ნაშრომი ან PDF და გამოიყენე AI ღრმა ანალიზისთვის.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <aside className="space-y-4 lg:col-span-1">
          <div className="dashboard-section p-5 backdrop-blur-md">
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-4 py-12 text-center transition-all ${
                isDragging
                  ? "border-violet-400/60 bg-violet-50 dark:border-purple-500/40 dark:bg-purple-500/10"
                  : "border-slate-200 hover:border-violet-400/60 dark:border-white/10 dark:hover:border-purple-500/30"
              }`}
            >
              <input
                type="file"
                accept=".pdf,.txt,.md"
                className="hidden"
                onChange={onFileChange}
              />
              <p className="text-sm text-slate-800 dark:text-zinc-200">
                ჩააგდე ფაილი ან დააწკაპუნე ატვირთვისთვის
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-500">PDF / TXT / MD</p>
            </label>

            {fileName && (
              <div className="mt-3 rounded-xl border border-violet-300/50 bg-violet-50 px-3 py-2 text-xs text-violet-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                ატვირთულია: {fileName}
              </div>
            )}

            <div className="mt-5 space-y-2">
              {TOGGLES.map((item) => (
                <label
                  key={item.key}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-zinc-300 dark:hover:border-purple-500/25 dark:hover:text-white"
                >
                  <input
                    type="checkbox"
                    checked={toggles[item.key]}
                    onChange={(event) =>
                      setToggles((prev) => ({
                        ...prev,
                        [item.key]: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-purple-500"
                  />
                  {item.label}
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void startAnalysis()}
              disabled={isLoading}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-purple-500/10 transition-all hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/20 active:scale-[0.98] disabled:opacity-60"
            >
              {isLoading
                ? isPdf
                  ? "PDF-ის დამუშავება მიმდინარეობა..."
                  : "იტვირთება..."
                : "ანალიზის დაწყება"}
            </button>
          </div>
        </aside>

        <section className="dashboard-section p-6 backdrop-blur-md lg:col-span-2">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-300/50 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          )}
          {!analysisStarted ? (
            <div className="flex min-h-[420px] items-center justify-center text-center">
              <p className="text-sm text-slate-500 dark:text-gray-500">
                მკვლევრის სივრცე მზად არის. ატვირთე დოკუმენტი მარცხენა პანელიდან.
              </p>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {isPdf && (
                <p className="text-sm text-violet-600 dark:text-purple-300/90">
                  PDF-ის დამუშავება მიმდინარეობა...
                </p>
              )}
              <AiSkeletonLoader rows={4} />
            </div>
          ) : result ? (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TAB_LABELS) as AnalysisTab[]).map((tab) => {
                  const active = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-full px-3 py-1.5 text-xs transition ${
                        active
                          ? "border border-violet-400/50 bg-violet-50 text-violet-700 dark:border-purple-500/35 dark:bg-purple-500/10 dark:text-purple-300"
                          : "border border-slate-200 bg-white text-slate-600 hover:text-violet-700 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-zinc-400 dark:hover:text-white"
                      }`}
                    >
                      {TAB_LABELS[tab]}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-violet-50/30 p-5 dark:border-white/[0.06] dark:bg-[#101114]/55">
                <p className="text-xs text-slate-500 dark:text-zinc-500">
                  ანალიზის პროფილი • აქტიური ოპციები: {selectedCount}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-zinc-100">
                  {TAB_LABELS[activeTab]}
                </h2>

                {activeTab === "summary" && (
                  <div className="mt-3 space-y-4 text-sm leading-7 text-slate-700 dark:text-zinc-300">
                    <p className="whitespace-pre-wrap">{result.summary}</p>
                    {toggles.theses && result.theses && result.theses.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-violet-600 dark:text-purple-300/80">
                          ძირითადი თეზისები
                        </p>
                        <ul className="list-disc space-y-1 pl-5">
                          {result.theses.map((thesis) => (
                            <li key={thesis}>{thesis}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {toggles.methodology && result.methodology && (
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-violet-600 dark:text-purple-300/80">
                          მეთოდოლოგია
                        </p>
                        <p className="whitespace-pre-wrap">{result.methodology}</p>
                      </div>
                    )}
                    {toggles.literature && result.literatureReview && (
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-violet-600 dark:text-purple-300/80">
                          ლიტერატურის მიმოხილვა
                        </p>
                        <p className="whitespace-pre-wrap">{result.literatureReview}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "sources" && (
                  <ul className="mt-3 space-y-4">
                    {result.sources.map((source, index) => (
                      <li
                        key={`${source.citation}-${index}`}
                        className="rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-white/[0.06] dark:bg-white/[0.02]"
                      >
                        <p className="font-medium text-slate-900 dark:text-zinc-100">{source.citation}</p>
                        <p className="mt-2 leading-6 text-slate-600 dark:text-zinc-400">{source.relevance}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {activeTab === "quotes" && (
                  <ul className="mt-3 space-y-4">
                    {result.quotes.map((item, index) => (
                      <li
                        key={`${item.quote.slice(0, 24)}-${index}`}
                        className="rounded-xl border border-violet-200/80 bg-violet-50/40 p-4 text-sm dark:border-purple-500/15 dark:bg-purple-500/[0.03]"
                      >
                        <p className="italic leading-7 text-slate-800 dark:text-zinc-200">
                          &ldquo;{item.quote}&rdquo;
                        </p>
                        <p className="mt-2 text-slate-600 dark:text-zinc-400">{item.context}</p>
                        {item.location && (
                          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">{item.location}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
