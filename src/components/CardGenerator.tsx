"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AudioLines,
  Check,
  FileText,
  Film,
  Minus,
  Plus,
  Presentation,
  Sparkles,
  Type,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { FieldError } from "@/components/ui/Alert";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { takeHandoff } from "@/lib/tool-handoff";
import { createDeckFromGenerated, saveCustomDeck } from "@/lib/custom-decks";
import type { UploadedData } from "@/lib/generation-input";
import { generateFlashcards, GENERATION_ERROR } from "@/lib/generate-flashcards";
import { setPendingSummaryGeneration } from "@/lib/pending-generation";
import type { InputType } from "@/lib/ai/process-input";
import {
  CARD_COUNT_DEFAULT,
  CARD_COUNT_MAX,
  CARD_COUNT_MIN,
  CARD_COUNT_PRESETS,
  clampCardCount,
  DIFFICULTIES,
  formatClock,
  parseClock,
  type Difficulty,
} from "@/lib/generation-options";
import { loadPresentation } from "@/lib/presentation-store";
import { savedPresentationText } from "@/lib/pptx/saved-presentation-text";
import { AudioRecorder } from "./generate/AudioRecorder";
import { GenerationProgress } from "./generate/GenerationProgress";
import { PresentationSource, type PresentationMode } from "./generate/PresentationSource";
import { useYouTubePreview, YouTubeSource, type YouTubeMode } from "./generate/YouTubeSource";
import "./generate/generate.css";

export type { UploadedData };

type GenerationKind = "flashcards" | "summary";
type FileSource = "file" | "audio" | "video";

const SOURCES: { id: InputType; label: string; icon: LucideIcon; tile: string; isNew?: boolean }[] = [
  { id: "file", label: "ფაილი", icon: FileText, tile: "tile-file" },
  { id: "audio", label: "აუდიო", icon: AudioLines, tile: "tile-audio" },
  { id: "video", label: "ვიდეო", icon: Film, tile: "tile-video" },
  { id: "youtube", label: "YouTube", icon: Video, tile: "tile-youtube" },
  // „ახალი“ until the presentation source has been out a while; drop the flag then.
  { id: "presentation", label: "პრეზენტაცია", icon: Presentation, tile: "tile-presentation", isNew: true },
  { id: "text", label: "ტექსტი", icon: Type, tile: "tile-text" },
];

const FILE_RULES: Record<FileSource, { accept: string; hint: string; label: string }> = {
  file: {
    accept: ".png,.jpg,.jpeg,.webp,.pdf,.docx,.txt,image/*,application/pdf",
    hint: "PDF, DOCX, TXT, JPG, PNG · მაქს. 20 MB",
    label: "ჩააგდე ფაილი აქ ან აირჩიე",
  },
  audio: { accept: ".mp3,.wav,.m4a,audio/*", hint: "MP3, M4A, WAV · მაქს. 20 MB", label: "ატვირთე აუდიო ფაილი" },
  video: { accept: ".mp4,.webm,video/*", hint: "MP4, WebM · მაქს. 20 MB", label: "ატვირთე ვიდეო" },
};

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const TEXT_MAX = 50_000;
const DASHBOARD_HREF = "/dashboard-student";

function sizeLabel(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** A recording's player, its object URL freed when the file goes. */
function AudioPreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const next = URL.createObjectURL(file);
    void Promise.resolve().then(() => setUrl(next));
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url ? <audio controls src={url} className="h-10 w-full" aria-label="ჩანაწერის მოსმენა" /> : null;
}

/** The chosen file, with a way to take it back. */
function FileRow({ file, onClear, kind }: { file: File; onClear: () => void; kind: FileSource }) {
  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-[var(--gen-border)] p-3">
      <div className="flex items-center gap-3">
        {kind === "video" ? (
          <span className="flex h-10 w-[72px] shrink-0 items-center justify-center rounded-[8px] bg-[#0f0f14] text-[14px] text-white" aria-hidden>
            ▶
          </span>
        ) : (
          <span className={`tile-${kind} flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--tile-bg)] text-[var(--tile)]`} aria-hidden>
            {kind === "audio" ? <AudioLines className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-semibold text-[var(--gen-title)]">{file.name}</span>
          <span className="block text-[13px] text-[var(--gen-muted)]">{sizeLabel(file.size)}</span>
        </span>
        <button type="button" onClick={onClear} aria-label="ფაილის მოშორება" className="gen-focus flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--gen-muted)] hover:bg-[var(--gen-hover)]">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {kind === "audio" ? <AudioPreview file={file} /> : null}
    </div>
  );
}

/**
 * The AI generator: pick the material (six sources), what to make from it
 * and how many cards, then go. One screen, no modal.
 */
export function CardGenerator() {
  const router = useRouter();
  const params = useSearchParams();

  const [source, setSource] = useState<InputType>("file");
  const [files, setFiles] = useState<Record<FileSource, File | null>>({ file: null, audio: null, video: null });
  const [fileError, setFileError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [ytMode, setYtMode] = useState<YouTubeMode>("whole");
  const [ytStart, setYtStart] = useState("");
  const [ytEnd, setYtEnd] = useState("");
  const [presentationMode, setPresentationMode] = useState<PresentationMode>("saved");
  const [presentation, setPresentation] = useState<{ id: string; title: string; text: string } | null>(null);
  const [pptxFile, setPptxFile] = useState<File | null>(null);
  const [topic, setTopic] = useState("");
  const [kind, setKind] = useState<GenerationKind>("flashcards");
  const [count, setCount] = useState(CARD_COUNT_DEFAULT);
  const [countDraft, setCountDraft] = useState(String(CARD_COUNT_DEFAULT));
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  const [running, setRunning] = useState<UploadedData | null>(null);
  const [readyCards, setReadyCards] = useState(0);
  const [runError, setRunError] = useState<string | null>(null);

  const ytPreview = useYouTubePreview(youtubeUrl);

  // Opened from a journal entry („გადააქციე ბარათებად“): its text, ready to go.
  useEffect(() => {
    void Promise.resolve().then(() => {
      const handed = takeHandoff("cards");
      if (!handed) return;
      setSource("text");
      setText(handed.text);
      if (handed.title) setTopic(handed.title);
    });
  }, []);

  // „ფლეშბარათების შექმნა“ from a presentation's menu: that presentation, picked.
  const presetId = params.get("source") === "presentation" ? params.get("id") : null;
  useEffect(() => {
    if (!presetId) return;
    let active = true;
    void Promise.resolve().then(() => {
      setSource("presentation");
      setPresentationMode("saved");
    });
    loadPresentation(presetId)
      .then((loaded) => {
        const record = loaded?.presentation;
        if (!active || !record?.slides?.length) return;
        setPresentation({ id: record.id, title: record.title, text: savedPresentationText(record.slides) });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [presetId]);

  const setCountValue = (value: number) => {
    const next = clampCardCount(value);
    setCount(next);
    setCountDraft(String(next));
  };

  const pickFile = (kindOf: FileSource, file: File | null) => {
    if (file && file.size > MAX_FILE_BYTES) {
      setFileError("ფაილი ძალიან დიდია. მაქსიმუმ 20 MB.");
      return;
    }
    setFileError(null);
    setFiles((current) => ({ ...current, [kindOf]: file }));
  };

  const pickPptx = (file: File | null) => {
    if (file && !file.name.toLowerCase().endsWith(".pptx")) {
      setFileError("აქ მხოლოდ .pptx ფაილი იტვირთება.");
      return;
    }
    if (file && file.size > MAX_FILE_BYTES) {
      setFileError("ფაილი ძალიან დიდია. მაქსიმუმ 20 MB.");
      return;
    }
    setFileError(null);
    setPptxFile(file);
  };

  // The YouTube segment, in seconds, or a problem with it.
  const ytDuration = ytPreview.status === "ready" ? ytPreview.preview.duration : null;
  const segment = (() => {
    if (source !== "youtube" || ytMode !== "segment") return { range: null, error: null };
    const start = parseClock(ytStart || "0:00");
    const end = parseClock(ytEnd || "");
    if (start === null || end === null) return { range: null, error: "ჩაწერე დრო ასე: 12:30" };
    if (end <= start) return { range: null, error: "დასასრული დასაწყისის შემდეგ უნდა იყოს." };
    if (ytDuration && start >= ytDuration) return { range: null, error: "დასაწყისი ვიდეოს სიგრძეს სცდება." };
    return { range: { start, end }, error: null };
  })();

  /** What's still missing before anything can be made, or null. */
  const missing = (() => {
    if (source === "file" || source === "audio" || source === "video") {
      if (!files[source]) return source === "audio" ? "ჩაწერე ლექცია ან ატვირთე აუდიო." : "ატვირთე ფაილი.";
    }
    if (source === "text" && !text.trim()) return "ჩასვი ან ჩაწერე ტექსტი.";
    if (source === "youtube") {
      if (!youtubeUrl.trim()) return "ჩასვი YouTube ბმული.";
      if (ytPreview.status === "idle") return "ბმული YouTube-ის ვიდეოს არ ჰგავს.";
      if (ytPreview.status === "error") return ytPreview.message;
      if (ytPreview.status !== "ready") return "ვამოწმებთ ვიდეოს…";
      if (!ytPreview.preview.hasCaptions) return "ამ ვიდეოს სუბტიტრები არ აქვს.";
      if (segment.error) return segment.error;
    }
    if (source === "presentation") {
      if (presentationMode === "saved" && !presentation) return "აირჩიე პრეზენტაცია.";
      if (presentationMode === "pptx" && !pptxFile) return "ატვირთე .pptx ფაილი.";
    }
    return null;
  })();

  const sourceLabel = (): string | undefined => {
    if (source === "presentation") {
      const title = presentationMode === "saved" ? presentation?.title : pptxFile?.name.replace(/\.pptx$/i, "");
      return title ? `პრეზენტაცია: ${title}` : "პრეზენტაცია";
    }
    if (source === "youtube" && ytPreview.status === "ready") return `YouTube: ${ytPreview.preview.title}`;
    if (source === "file" || source === "audio" || source === "video") return files[source]?.name;
    return source === "text" ? "ტექსტი" : undefined;
  };

  const capture = (): UploadedData => ({
    inputType: source,
    file:
      source === "presentation"
        ? presentationMode === "pptx"
          ? pptxFile
          : null
        : source === "file" || source === "audio" || source === "video"
          ? files[source]
          : null,
    text: source === "presentation" ? (presentationMode === "saved" ? (presentation?.text ?? "") : "") : text,
    youtubeUrl,
    topic,
    cardCount: count,
    difficulty,
    youtubeRange: segment.range,
    sourceLabel: sourceLabel(),
  });

  const runFlashcards = async (data: UploadedData) => {
    setRunning(data);
    setReadyCards(0);
    setRunError(null);
    try {
      const parsed = await generateFlashcards(data, (ready) => setReadyCards(ready));
      const deck = createDeckFromGenerated(parsed, "georgian", data.sourceLabel);
      saveCustomDeck(deck);
      router.push(`/deck/${deck.id}`);
    } catch (error) {
      setRunError(error instanceof Error ? error.message : GENERATION_ERROR);
    }
  };

  const submit = () => {
    if (missing) return;
    const data = capture();
    if (kind === "summary") {
      setPendingSummaryGeneration(data);
      router.push("/conspectus/stream");
      return;
    }
    void runFlashcards(data);
  };

  if (running) {
    return (
      <GenerationProgress
        total={running.cardCount}
        ready={readyCards}
        sourceLabel={running.sourceLabel}
        error={runError}
        onRetry={() => void runFlashcards(running)}
        onBack={() => {
          setRunning(null);
          setRunError(null);
        }}
      />
    );
  }

  const fileSource = source === "file" || source === "audio" || source === "video" ? source : null;

  return (
    <div className="gen under-site-header min-h-dvh max-md:-mt-[var(--safe-top)] max-md:-mb-36 max-md:pb-36">
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-[230px] pt-[calc(var(--safe-top)+16px)] sm:px-6 md:pb-16 md:pt-10">
        <header className="flex items-start gap-3 sm:gap-4">
          <BackButton fallbackHref={DASHBOARD_HREF} />
          <div className="min-w-0 flex-1">
            <h1 className="text-[24px] font-bold leading-tight tracking-tight text-[var(--gen-title)] sm:text-[30px]">AI გენერატორი</h1>
            <p className="mt-1 text-[14.5px] text-[var(--gen-muted)] sm:text-[15.5px]">ატვირთე მასალა და მიიღე ფლეშბარათები ან კონსპექტი</p>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
          <section aria-label="მასალა" className="gen-card flex min-w-0 flex-col gap-6 p-4 sm:p-6">
            <div>
              <h2 className="gen-label">წყარო</h2>
              <div role="radiogroup" aria-label="მასალის წყარო" className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {SOURCES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={source === item.id}
                      onClick={() => {
                        setSource(item.id);
                        setFileError(null);
                      }}
                      className={`gen-option gen-source gen-focus relative flex min-w-0 items-center gap-1.5 rounded-full px-1 max-sm:h-10 max-sm:justify-center sm:h-[84px] sm:flex-col sm:justify-center sm:gap-2 sm:rounded-[18px] sm:px-1 ${item.tile}`}
                    >
                      {/* Below 440px the three pills only have room for the names. */}
                      <span className="gen-source-icon hidden h-5 w-5 shrink-0 items-center justify-center text-[var(--tile)] min-[440px]:flex sm:h-[34px] sm:w-[34px] sm:rounded-[10px] sm:bg-[var(--tile-bg)]">
                        <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2} aria-hidden />
                      </span>
                      <span className="min-w-0 max-w-full truncate text-[12px] font-semibold max-[380px]:text-[11.5px] min-[440px]:text-[13px] sm:text-[12.5px]">{item.label}</span>
                      {item.isNew ? (
                        <span className="absolute -right-1 -top-2 rounded-full bg-[#e11d74] px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">ახალი</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              {fileSource === "file" || fileSource === "video" ? (
                files[fileSource] ? (
                  <FileRow file={files[fileSource] as File} kind={fileSource} onClear={() => pickFile(fileSource, null)} />
                ) : (
                  <UploadDropzone
                    accept={FILE_RULES[fileSource].accept}
                    onFiles={(picked) => pickFile(fileSource, picked[0] ?? null)}
                    label={FILE_RULES[fileSource].label}
                    hint={FILE_RULES[fileSource].hint}
                    className="min-h-[200px]"
                  />
                )
              ) : null}
              {fileSource === "video" ? <p className="mt-3 text-[13px] text-[var(--gen-muted)]">ხმას ტექსტად ვაქცევთ და მერე ვქმნით ბარათებს.</p> : null}

              {source === "audio" ? (
                <div className="flex flex-col gap-4">
                  <AudioRecorder onRecorded={(file) => pickFile("audio", file)} onError={setFileError} />
                  <div className="flex items-center gap-3 text-[13px] font-semibold text-[var(--gen-faint)]" aria-hidden>
                    <span className="h-px flex-1 bg-[var(--gen-border)]" />
                    ან
                    <span className="h-px flex-1 bg-[var(--gen-border)]" />
                  </div>
                  {files.audio ? (
                    <FileRow file={files.audio} kind="audio" onClear={() => pickFile("audio", null)} />
                  ) : (
                    <UploadDropzone accept={FILE_RULES.audio.accept} onFiles={(picked) => pickFile("audio", picked[0] ?? null)} label={FILE_RULES.audio.label} hint={FILE_RULES.audio.hint} className="min-h-[140px]" />
                  )}
                </div>
              ) : null}

              {source === "youtube" ? (
                <YouTubeSource
                  url={youtubeUrl}
                  onUrl={setYoutubeUrl}
                  preview={ytPreview}
                  mode={ytMode}
                  onMode={(mode) => {
                    setYtMode(mode);
                    // A segment starts as the whole video, ready to be narrowed.
                    if (mode === "segment" && !ytEnd && ytDuration) {
                      setYtStart((value) => value || "0:00");
                      setYtEnd(formatClock(ytDuration));
                    }
                  }}
                  start={ytStart}
                  end={ytEnd}
                  onStart={setYtStart}
                  onEnd={setYtEnd}
                  rangeError={segment.error}
                />
              ) : null}

              {source === "presentation" ? (
                <PresentationSource
                  mode={presentationMode}
                  onMode={(mode) => {
                    setPresentationMode(mode);
                    setFileError(null);
                  }}
                  selectedId={presentation?.id ?? null}
                  onSelect={(item) => setPresentation({ id: item.id, title: item.title, text: savedPresentationText(item.slides ?? []) })}
                  file={pptxFile}
                  onFile={pickPptx}
                />
              ) : null}

              {source === "text" ? (
                <label className="flex flex-col gap-2">
                  <span className="sr-only">ტექსტი</span>
                  <textarea
                    value={text}
                    maxLength={TEXT_MAX}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="ჩასვი ლექციის, სახელმძღვანელოს ან ჩანაწერის ტექსტი"
                    className="gen-field min-h-[220px]"
                  />
                  <span className="self-end text-[12.5px] tabular-nums text-[var(--gen-faint)]">
                    {text.length.toLocaleString("en-US")} / {TEXT_MAX.toLocaleString("en-US")}
                  </span>
                </label>
              ) : null}

              <FieldError id="gen-file-error">{fileError}</FieldError>
            </div>

            <label className="flex flex-col gap-2">
              <span className="flex items-baseline gap-2">
                <span className="gen-label">თემა</span>
                <span className="text-[13px] text-[var(--gen-faint)]">არასავალდებულო</span>
              </span>
              <input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="მაგ. უჯრედის აღნაგობა" className="gen-field" />
            </label>
          </section>

          <section aria-label="პარამეტრები" className="gen-card flex min-w-0 flex-col gap-6 p-4 sm:p-6">
            <div>
              <h2 className="gen-label">რა შევქმნათ?</h2>
              <div role="radiogroup" aria-label="რა შევქმნათ" className="mt-3 grid grid-cols-2 gap-2.5">
                {(
                  [
                    ["flashcards", "ფლეშბარათები", "კითხვა და პასუხი, სწრაფი გამეორებისთვის"],
                    ["summary", "კონსპექტი", "მოკლე, სტრუქტურული შეჯამება"],
                  ] as const
                ).map(([id, label, sub]) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={kind === id}
                    onClick={() => setKind(id)}
                    className="gen-option gen-focus relative flex flex-col items-start gap-1 rounded-[18px] p-4 text-left max-sm:p-3"
                  >
                    <span className="pr-6 text-[15px] font-bold text-[var(--gen-title)]">{label}</span>
                    <span className="text-[13px] leading-snug text-[var(--gen-muted)] max-sm:hidden">{sub}</span>
                    {kind === id ? (
                      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gen-strong)] text-[var(--gen-on-strong)]" aria-hidden>
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            {kind === "flashcards" ? (
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="gen-label">ბარათების რაოდენობა</h2>
                  <span className="text-[13px] text-[var(--gen-faint)]">მაქსიმუმ {CARD_COUNT_MAX}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div role="radiogroup" aria-label="ბარათების რაოდენობა" className="grid min-w-0 flex-1 grid-cols-4 gap-2 sm:flex sm:flex-none">
                    {CARD_COUNT_PRESETS.map((preset) => (
                      <button key={preset} type="button" role="radio" aria-checked={count === preset} onClick={() => setCountValue(preset)} className="gen-chip tabular-nums">
                        {preset}
                      </button>
                    ))}
                  </div>
                  <div className="flex h-10 items-center rounded-full border border-[var(--gen-field-border)] max-sm:w-full max-sm:justify-between">
                    <button type="button" aria-label="ერთით ნაკლები" onClick={() => setCountValue(count - 1)} disabled={count <= CARD_COUNT_MIN} className="gen-focus flex h-10 w-10 items-center justify-center rounded-full text-[var(--gen-title)] disabled:opacity-40">
                      <Minus className="h-4 w-4" aria-hidden />
                    </button>
                    <input
                      value={countDraft}
                      inputMode="numeric"
                      aria-label={`ბარათების რაოდენობა, ${CARD_COUNT_MIN}-დან ${CARD_COUNT_MAX}-მდე`}
                      onChange={(event) => setCountDraft(event.target.value.replace(/\D/g, "").slice(0, 3))}
                      onBlur={() => setCountValue(Number(countDraft || CARD_COUNT_DEFAULT))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") setCountValue(Number(countDraft || CARD_COUNT_DEFAULT));
                      }}
                      className="w-10 bg-transparent text-center text-[15px] font-bold tabular-nums text-[var(--gen-title)] outline-none"
                    />
                    <button type="button" aria-label="ერთით მეტი" onClick={() => setCountValue(count + 1)} disabled={count >= CARD_COUNT_MAX} className="gen-focus flex h-10 w-10 items-center justify-center rounded-full text-[var(--gen-title)] disabled:opacity-40">
                      <Plus className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div>
              <h2 className="gen-label">სირთულე</h2>
              <div role="radiogroup" aria-label="სირთულე" className="mt-3 grid h-11 grid-cols-3 rounded-full bg-[var(--gen-soft)] p-1">
                {DIFFICULTIES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={difficulty === item.id}
                    onClick={() => setDifficulty(item.id)}
                    className={`gen-focus rounded-full text-[14px] font-semibold transition-colors ${
                      difficulty === item.id ? "bg-[var(--gen-card)] text-[var(--gen-title)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "text-[var(--gen-muted)]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Phones: the button stays above the dock and the home indicator. */}
            <div className="mt-auto max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:border-t max-md:border-[var(--gen-border)] max-md:bg-[var(--gen-bg)] max-md:px-4 max-md:pb-[calc(env(safe-area-inset-bottom)+96px)] max-md:pt-3">
              {missing ? (
                <p className="mb-2 text-center text-[13px] font-medium text-rose-600 md:hidden dark:text-rose-400">{missing}</p>
              ) : null}
              <button
                type="button"
                onClick={submit}
                disabled={Boolean(missing)}
                aria-describedby={missing ? "gen-missing" : undefined}
                className="gen-primary h-14 w-full text-[16px] max-md:shadow-[0_8px_24px_rgba(225,29,116,0.25)]"
              >
                <Sparkles className="h-5 w-5" aria-hidden />
                {kind === "flashcards" ? "ბარათების შექმნა" : "კონსპექტის შექმნა"}
              </button>
              <div className="max-md:sr-only">
                <FieldError id="gen-missing">{missing}</FieldError>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
