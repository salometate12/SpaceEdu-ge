"use client";

import { Suspense, useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import {
  AudioLines,
  BookMarked,
  CheckCircle2,
  FileText,
  FlaskConical,
  Image as ImageIcon,
  Lightbulb,
  ListChecks,
  Scale,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { SpaceBackLink } from "@/components/layout/SpaceBackLink";
import { fetchAiJson, fetchAiMultipartJson } from "@/lib/ai/fetch-ai";
import type { ResearchResponse } from "@/lib/ai/research-platform-schema";
import { ResearchThinkingLoader } from "./ResearchThinkingLoader";

type AnalysisTab = "summary" | "sources" | "quotes";
type ToggleKey =
  | "theses"
  | "methodology"
  | "literature"
  | "criticalAnalysis"
  | "conclusions";

interface ToggleOption {
  key: ToggleKey;
  label: string;
  description: string;
  icon: typeof ListChecks;
}

const TOGGLES: ToggleOption[] = [
  {
    key: "theses",
    label: "ძირითადი თეზისები",
    description: "ტექსტის მთავარი აზრები, გამოკვეთილად.",
    icon: ListChecks,
  },
  {
    key: "methodology",
    label: "მეთოდოლოგიის ანალიზი",
    description: "როგორ არის აგებული კვლევა/მსჯელობა.",
    icon: FlaskConical,
  },
  {
    key: "literature",
    label: "ლიტერატურის მიმოხილვა",
    description: "წყაროებთან და კონტექსტთან კავშირი.",
    icon: BookMarked,
  },
  {
    key: "criticalAnalysis",
    label: "კრიტიკული ანალიზი",
    description: "ძლიერი და სუსტი მხარეები.",
    icon: Scale,
  },
  {
    key: "conclusions",
    label: "დასკვნები და რჩევები",
    description: "პრაქტიკული დასკვნა და შემდეგი ნაბიჯები.",
    icon: Lightbulb,
  },
];

const TAB_LABELS: Record<AnalysisTab, string> = {
  summary: "რეზიუმე",
  sources: "წყაროები",
  quotes: "ციტატები",
};

const TEXT_EXTENSIONS = [".txt", ".md"];
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".heic", ".heif"];
const AUDIO_EXTENSIONS = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".webm", ".flac"];

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isTextFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return file.type.startsWith("text/") || TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function isImageFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return file.type.startsWith("image/") || IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function isAudioFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return file.type.startsWith("audio/") || AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function fileKindLabel(file: File): { label: string; icon: typeof FileText } {
  if (isPdfFile(file)) return { label: "PDF დოკუმენტი", icon: FileText };
  if (isImageFile(file)) return { label: "ფოტო", icon: ImageIcon };
  if (isAudioFile(file)) return { label: "აუდიო", icon: AudioLines };
  return { label: "ტექსტური ფაილი", icon: FileText };
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
    criticalAnalysis: false,
    conclusions: false,
  });
  const [activeTab, setActiveTab] = useState<AnalysisTab>("summary");
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [result, setResult] = useState<ResearchResponse | null>(null);

  const selectedCount = useMemo(
    () => Object.values(toggles).filter(Boolean).length,
    [toggles],
  );

  const handleFile = (file: File) => {
    if (!isPdfFile(file) && !isTextFile(file) && !isImageFile(file) && !isAudioFile(file)) {
      setError("მხარდაჭერა: PDF, TXT, MD, ფოტო (JPG / PNG / WEBP) ან აუდიო (MP3 / WAV / M4A).");
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
      setError("გთხოვ, ჯერ ატვირთე მასალა.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisStarted(true);
    setResult(null);

    const usesMultipart =
      isPdfFile(documentFile) || isImageFile(documentFile) || isAudioFile(documentFile);

    try {
      const data = usesMultipart
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
  const isImage = documentFile ? isImageFile(documentFile) : false;
  const isAudio = documentFile ? isAudioFile(documentFile) : false;
  const uploadedKind = documentFile ? fileKindLabel(documentFile) : null;

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start gap-3">
        <Suspense fallback={null}>
          <SpaceBackLink className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-white" />
        </Suspense>
        <div className="min-w-0 flex-1">
          <h1 className="headline flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-zinc-100">
            <Sparkles className="h-6 w-6 text-violet-500 dark:text-purple-300" strokeWidth={1.75} />
            კვლევის პლატფორმა
          </h1>
          <p className="mt-1 max-w-4xl text-sm text-slate-600 dark:text-zinc-400">
            ჩააგდე PDF, ფოტო, ტექსტი ან აუდიო — მონიშნე რა გამოვყოთ, AI დანარჩენს გააკეთებს.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <aside className="space-y-4 lg:col-span-1">
          <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-white/[0.07] dark:bg-[#121214]/60">
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`group relative flex cursor-pointer flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-dashed px-4 py-10 text-center transition-all duration-300 ${
                isDragging
                  ? "scale-[1.01] border-violet-400/70 bg-violet-50 dark:border-purple-400/50 dark:bg-purple-500/10"
                  : "border-slate-200 hover:border-violet-400/50 hover:bg-violet-50/40 dark:border-white/10 dark:hover:border-purple-500/30 dark:hover:bg-purple-500/[0.04]"
              }`}
            >
              <input
                type="file"
                accept=".pdf,.txt,.md,image/png,image/jpeg,image/webp,image/heic,image/heif,audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/ogg,audio/webm,audio/flac,.mp3,.wav,.m4a,.aac,.ogg,.flac"
                className="hidden"
                onChange={onFileChange}
              />
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 ${
                  isDragging
                    ? "border-violet-400/60 bg-violet-100 dark:border-purple-400/50 dark:bg-purple-500/20"
                    : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"
                }`}
              >
                <UploadCloud
                  className="h-5 w-5 text-violet-500 transition-transform duration-300 group-hover:-translate-y-0.5 dark:text-purple-300"
                  strokeWidth={1.75}
                />
              </span>
              <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">
                ჩააგდე ფაილი ან დააწკაპუნე
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-500">
                PDF · TXT · MD · ფოტო · აუდიო
              </p>
            </label>

            {fileName && uploadedKind && (
              <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-violet-300/50 bg-violet-50 px-3 py-2.5 text-xs text-violet-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                <uploadedKind.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span className="min-w-0 flex-1 truncate">{fileName}</span>
                <span className="shrink-0 rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:bg-black/20 dark:text-purple-200">
                  {uploadedKind.label}
                </span>
              </div>
            )}

            <div className="mt-5 space-y-2">
              <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-500">
                რა გამოვყოთ?
              </p>
              {TOGGLES.map((item) => {
                const active = toggles[item.key];
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      setToggles((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                    }
                    aria-pressed={active}
                    className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all duration-200 active:scale-[0.98] ${
                      active
                        ? "border-violet-400/60 bg-violet-50 shadow-[0_0_0_1px_rgba(139,92,246,0.15)] dark:border-purple-500/40 dark:bg-purple-500/[0.08]"
                        : "border-slate-200 bg-white hover:border-violet-300 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-purple-500/25"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${
                        active
                          ? "bg-violet-500 text-white dark:bg-purple-500"
                          : "bg-slate-100 text-slate-500 group-hover:text-violet-500 dark:bg-white/[0.05] dark:text-zinc-500 dark:group-hover:text-purple-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm font-medium transition-colors ${
                          active
                            ? "text-violet-800 dark:text-purple-200"
                            : "text-slate-700 dark:text-zinc-300"
                        }`}
                      >
                        {item.label}
                      </span>
                      <span className="block truncate text-[11px] text-slate-500 dark:text-zinc-500">
                        {item.description}
                      </span>
                    </span>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                        active
                          ? "scale-100 border-violet-500 bg-violet-500 text-white opacity-100 dark:border-purple-400 dark:bg-purple-500"
                          : "scale-90 border-slate-300 bg-transparent text-transparent opacity-0 group-hover:scale-100 group-hover:opacity-100 dark:border-white/15"
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => void startAnalysis()}
              disabled={isLoading}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-purple-500/10 transition-all hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/20 active:scale-[0.98] disabled:opacity-60"
            >
              {isLoading
                ? isPdf
                  ? "PDF-ის დამუშავება მიმდინარეობა..."
                  : isImage
                    ? "ფოტოს წაკითხვა მიმდინარეობა..."
                    : isAudio
                      ? "აუდიოს გადაწერა მიმდინარეობა..."
                      : "იტვირთება..."
                : "ანალიზის დაწყება"}
            </button>
          </div>
        </aside>

        <section className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-white/[0.07] dark:bg-[#121214]/60 lg:col-span-2">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-300/50 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          )}
          {!analysisStarted ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-violet-400 dark:bg-purple-500/10 dark:text-purple-300/70">
                <Sparkles className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <p className="max-w-xs text-sm text-slate-500 dark:text-gray-500">
                მკვლევრის სივრცე მზად არის. ატვირთე მასალა მარცხენა პანელიდან.
              </p>
            </div>
          ) : isLoading ? (
            <ResearchThinkingLoader
              hint={
                isPdf
                  ? "PDF-ის დამუშავება მიმდინარეობა..."
                  : isImage
                    ? "ფოტოზე ტექსტის ამოცნობა მიმდინარეობა..."
                    : isAudio
                      ? "აუდიოს გადაწერა მიმდინარეობა, შეიძლება ცოტა ხანს გასტანოს..."
                      : undefined
              }
            />
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

              <div className="rounded-2xl border-2 border-violet-300/70 bg-gradient-to-br from-white to-violet-50/30 p-5 shadow-[0_0_24px_rgba(139,92,246,0.08)] dark:border-purple-500/45 dark:bg-none dark:bg-[#121018] dark:shadow-[0_0_28px_rgba(139,92,246,0.12)]">
                <p className="text-xs text-slate-500 dark:text-zinc-500">
                  ანალიზის პროფილი • აქტიური ოპციები: {selectedCount}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-zinc-100">
                  {TAB_LABELS[activeTab]}
                </h2>

                {activeTab === "summary" && (
                  <div className="mt-3 space-y-4 text-base leading-8 text-slate-700 dark:text-zinc-200">
                    <p className="whitespace-pre-wrap">{result.summary}</p>
                    {toggles.theses && result.theses && result.theses.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-violet-600 dark:text-purple-300/80">
                          ძირითადი თეზისები
                        </p>
                        <ul className="list-disc space-y-1.5 pl-5">
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
                    {toggles.criticalAnalysis && result.criticalAnalysis && (
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-violet-600 dark:text-purple-300/80">
                          კრიტიკული ანალიზი
                        </p>
                        <p className="whitespace-pre-wrap">{result.criticalAnalysis}</p>
                      </div>
                    )}
                    {toggles.conclusions && result.conclusions && (
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-violet-600 dark:text-purple-300/80">
                          დასკვნები და რჩევები
                        </p>
                        <p className="whitespace-pre-wrap">{result.conclusions}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "sources" && (
                  <ul className="mt-3 space-y-4">
                    {result.sources.map((source, index) => (
                      <li
                        key={`${source.citation}-${index}`}
                        className="rounded-xl border border-violet-200 bg-white p-4 text-base dark:border-purple-500/25 dark:bg-white/[0.02]"
                      >
                        <p className="font-medium text-slate-900 dark:text-zinc-100">{source.citation}</p>
                        <p className="mt-2 leading-7 text-slate-600 dark:text-zinc-300">{source.relevance}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {activeTab === "quotes" && (
                  <ul className="mt-3 space-y-4">
                    {result.quotes.map((item, index) => (
                      <li
                        key={`${item.quote.slice(0, 24)}-${index}`}
                        className="rounded-xl border border-violet-200/80 bg-violet-50/40 p-4 text-base dark:border-purple-500/25 dark:bg-purple-500/[0.05]"
                      >
                        <p className="italic leading-8 text-slate-800 dark:text-zinc-200">
                          &ldquo;{item.quote}&rdquo;
                        </p>
                        <p className="mt-2 text-slate-600 dark:text-zinc-300">{item.context}</p>
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
