"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  Loader2,
} from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { FieldError } from "@/components/ui/Alert";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { hasHandoff, takeHandoff } from "@/lib/tool-handoff";
import type { UploadedData } from "@/lib/generation-input";
import { GENERATION_ERROR } from "@/lib/generate-flashcards";
import { followProgress, isGeneratingHere, startDeckGeneration, watchGeneration } from "@/lib/library/generation";
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
import { KeepOneFileDialog, SummaryFiles } from "./generate/SummaryFiles";
import { addFiles, addFilesBeside, presentationAsFile, SUMMARY_MAX_FILES, TOO_MANY_FILES } from "@/lib/summary-files";
import { topicFileSource, topicSources } from "@/lib/subject-actions";
import { retrySubjectFileUpload } from "@/lib/subject-files-client";
import { noteSource } from "@/lib/subject-notes";
import { getFile, SUBJECTS_UPDATED_EVENT } from "@/lib/subject-store";
import { fileTitle, type SubjectFile } from "@/lib/subjects";
import { PresentationSource, type PresentationMode } from "./generate/PresentationSource";
import type { SavedPresentation } from "@/lib/presentation-store";
import { useYouTubePreview, YouTubeSource, type YouTubeMode } from "./generate/YouTubeSource";
import { MaterialsList, ResumeStrip } from "./library/MaterialsList";
import { ToolTabs, useToolTab } from "./library/ToolTabs";
import { useMaterials } from "./library/useMaterials";
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

/** A saved presentation chosen as material: `name` and `size` as a file's, for the list and the limits. */
interface SavedPick {
  id: string;
  title: string;
  text: string;
  name: string;
  size: number;
}

const savedPick = (id: string, title: string, text: string): SavedPick => ({ id, title, text, name: title, size: new Blob([text]).size });

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

/** A topic's file that couldn't be made ready: said so, never silently left out. */
function TopicFileProblem({ file, onRetry }: { file: SubjectFile; onRetry: (file: SubjectFile) => Promise<string | null> }) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  return (
    <li role="alert" className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13.5px] text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300">
      <span className="block truncate font-semibold">{fileTitle(file)}</span>
      <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5">
        ვერ აიტვირთა ·
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setProblem(await onRetry(file));
            setBusy(false);
          }}
          className="gen-focus inline-flex items-center gap-1 rounded font-bold underline disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : null}
          თავიდან ცდა
        </button>
      </span>
      {problem ? <span className="mt-1 block">{problem}</span> : null}
    </li>
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
  const [files, setFiles] = useState<Record<"audio" | "video", File | null>>({ audio: null, video: null });
  // The „ფაილი“ source: one file for flashcards, up to five for a conspectus.
  const [docs, setDocs] = useState<File[]>([]);
  // Switching to flashcards with several files: which one stays.
  const [keepOne, setKeepOne] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [ytMode, setYtMode] = useState<YouTubeMode>("whole");
  const [ytStart, setYtStart] = useState("");
  const [ytEnd, setYtEnd] = useState("");
  const [presentationMode, setPresentationMode] = useState<PresentationMode>("saved");
  // A deck takes one of these in all; a conspectus up to five, from both together.
  const [presentations, setPresentations] = useState<SavedPick[]>([]);
  const [pptxFiles, setPptxFiles] = useState<File[]>([]);
  const [topic, setTopic] = useState("");
  const [kind, setKind] = useState<GenerationKind>("flashcards");
  const [count, setCount] = useState(CARD_COUNT_DEFAULT);
  const [countDraft, setCountDraft] = useState(String(CARD_COUNT_DEFAULT));
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  const [running, setRunning] = useState<UploadedData | null>(null);
  const [readyCards, setReadyCards] = useState(0);
  const [latestQuestion, setLatestQuestion] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const ytPreview = useYouTubePreview(youtubeUrl);

  // „ახალი“ · „ჩემი მასალები“: the saved decks and conspectus, on this page.
  const materials = useMaterials();
  const libraryItems = useMemo(() => [...materials.decks, ...materials.conspectus], [materials]);
  const [handed] = useState(() => typeof window !== "undefined" && hasHandoff("cards"));

  // Opened from a journal entry („გადააქციე ბარათებად“): its text, ready to go.
  // „ჩემი საგნები“ (a topic, or a study session's hard parts): put on what's made.
  const [topicLink, setTopicLink] = useState<{ subjectId: string; topicId: string } | null>(null);
  useEffect(() => {
    void Promise.resolve().then(() => {
      const handed = takeHandoff("cards");
      if (!handed) return;
      setSource("text");
      setText(handed.text);
      if (handed.title) setTopic(handed.title);
      // From a study session: what's made goes with its subject and topic.
      if (handed.link) setTopicLink(handed.link);
    });
  }, []);

  // „ამ ჩანაწერიდან შექმენი“ (`?mode=cards|summary&noteId=`): the note's text, and its subject and topic.
  const noteId = params.get("noteId");
  const noteMode = params.get("mode");
  useEffect(() => {
    if (!noteId) return;
    let active = true;
    void Promise.resolve().then(() => {
      setSource("text");
      setKind(noteMode === "summary" ? "summary" : "flashcards");
    });
    void noteSource(noteId).then((found) => {
      if (!active || !found) return;
      setText(found.text);
      setTopic(found.title);
      if (found.link) setTopicLink(found.link);
    });
    return () => {
      active = false;
    };
  }, [noteId, noteMode]);

  // A link straight to a kind and source (`?mode=summary&source=text`, e.g. from
  // „კონსპექტი ვერ შეიქმნა“), when it isn't for a note or a topic.
  const plainSource = params.get("source");
  const plainLink = !noteId && !params.get("subject");
  useEffect(() => {
    if (!plainLink || (noteMode !== "summary" && noteMode !== "cards" && plainSource !== "text")) return;
    void Promise.resolve().then(() => {
      if (noteMode === "summary" || noteMode === "cards") setKind(noteMode === "summary" ? "summary" : "flashcards");
      if (plainSource === "text") setSource("text");
    });
  }, [plainLink, noteMode, plainSource]);

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
        setPresentations([savedPick(record.id, record.title, savedPresentationText(record.slides))]);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [presetId]);

  // Opened on a topic from „ჩემი საგნები“ (`?mode=cards|summary&subject=&topic=`):
  // its files picked (the first for cards, up to five for a conspectus), and
  // what's made tagged with the subject and topic.
  const linkSubject = params.get("subject");
  const linkTopic = params.get("topic");
  const linkMode = params.get("mode");
  const [topicChoices, setTopicChoices] = useState<File[]>([]);
  // „თემის ფაილებს ვამზადებთ…“ until they're here (nothing can be made meanwhile).
  const [topicPreparing, setTopicPreparing] = useState(Boolean(linkSubject && linkTopic));
  const [topicFailed, setTopicFailed] = useState<SubjectFile[]>([]);
  useEffect(() => {
    if (!linkSubject || !linkTopic) return;
    let active = true;
    let filled = false;
    // Right away, so the screen and its button already say what's being made.
    void Promise.resolve().then(() => {
      setSource("file");
      setKind(linkMode === "summary" ? "summary" : "flashcards");
    });
    const load = async () => {
      const sources = await topicSources(linkSubject, linkTopic);
      if (!active) return;
      setTopicPreparing(false);
      if (!sources) return;
      setTopicLink(sources.link);
      setTopic(sources.topic.title);
      setSource("file");
      setKind(linkMode === "summary" ? "summary" : "flashcards");
      setDocs(sources.files.slice(0, linkMode === "summary" ? SUMMARY_MAX_FILES : 1));
      setTopicChoices(sources.files);
      setTopicFailed(sources.failed);
      filled = sources.files.length + sources.failed.length > 0;
    };
    void load();
    // The account's list arriving later (a slow connection): filled in then.
    const late = () => {
      if (!filled) void load();
    };
    window.addEventListener(SUBJECTS_UPDATED_EVENT, late);
    return () => {
      active = false;
      window.removeEventListener(SUBJECTS_UPDATED_EVENT, late);
    };
  }, [linkSubject, linkTopic, linkMode]);

  /** „თავიდან ცდა“: up it goes and onto the list; otherwise the reason. */
  const retryTopicFile = async (file: SubjectFile): Promise<string | null> => {
    const problem = await retrySubjectFileUpload(file);
    if (problem) return problem;
    const record = getFile(file.id);
    const ready = record ? await topicFileSource(record) : null;
    if (!ready) return "ვერ აიტვირთა. სცადე ცოტა ხანში.";
    setTopicFailed((current) => current.filter((item) => item.id !== file.id));
    setTopicChoices((current) => [...current, ready]);
    setDocs((current) => (current.length < (kind === "summary" ? SUMMARY_MAX_FILES : 1) ? [...current, ready] : current));
    return null;
  };

  const [tab, setTab] = useToolTab({
    ready: materials.ready,
    hasItems: libraryItems.length > 0,
    // Opened with material to use: straight to „ახალი“.
    forceNew: handed || Boolean(presetId) || Boolean(linkTopic) || Boolean(noteId),
  });

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
    if (kindOf === "file") setDocs(file ? [file] : []);
    else setFiles((current) => ({ ...current, [kindOf]: file }));
  };

  const fileOf = (kindOf: FileSource): File | null => (kindOf === "file" ? (docs[0] ?? null) : files[kindOf]);

  /** Files for a conspectus: added up to five, 20 MB each, 50 MB in all. */
  const addDocs = (picked: File[]) => {
    const result = addFiles(docs, picked, SUMMARY_MAX_FILES);
    setDocs(result.files);
    setFileError(result.error);
  };

  const removeDoc = (index: number) => {
    setDocs((current) => current.filter((_, at) => at !== index));
    setFileError(null);
  };

  /** What a deck would have to choose from on this source. */
  const chosenOn = (on: InputType): { name: string; size: number }[] =>
    on === "file" ? docs : on === "presentation" ? [...presentations, ...pptxFiles] : [];

  const chooseKind = (next: GenerationKind) => {
    // Flashcards take one file: ask which, never drop the others silently.
    if (next === "flashcards" && chosenOn(source).length > 1) {
      setKeepOne(true);
      return;
    }
    setKind(next);
  };

  /** Back on a source holding several, while making a deck: the same question. */
  const chooseSource = (next: InputType) => {
    setSource(next);
    if (kind === "flashcards" && chosenOn(next).length > 1) setKeepOne(true);
  };

  const keepOneOf = (index: number) => {
    if (source === "presentation") {
      const keep = index < presentations.length;
      setPresentations(keep ? presentations.slice(index, index + 1) : []);
      setPptxFiles(keep ? [] : pptxFiles.slice(index - presentations.length, index - presentations.length + 1));
      setPresentationMode(keep ? "saved" : "pptx");
    } else {
      setDocs((current) => current.slice(index, index + 1));
    }
    setKeepOne(false);
    setKind("flashcards");
  };

  /** .pptx files: a deck's one replaces what's chosen, a conspectus's join it under the same limits. */
  const addPptx = (picked: File[]) => {
    const pptx = picked.filter((file) => file.name.toLowerCase().endsWith(".pptx"));
    const wrongType = pptx.length < picked.length ? "აქ მხოლოდ .pptx ფაილი იტვირთება." : null;
    if (kind === "flashcards") {
      const result = addFiles<File>([], pptx.slice(0, 1), 1);
      setFileError(result.error ?? wrongType);
      if (result.files.length > 0) {
        setPptxFiles(result.files);
        setPresentations([]);
      }
      return;
    }
    const result = addFilesBeside(presentations, pptxFiles, pptx, SUMMARY_MAX_FILES);
    setPptxFiles(result.files);
    setFileError(result.error ?? wrongType);
  };

  const removePptx = (index: number) => {
    setPptxFiles((current) => current.filter((_, at) => at !== index));
    setFileError(null);
  };

  const pickPresentation = (item: SavedPresentation) => {
    const pick = savedPick(item.id, item.title, savedPresentationText(item.slides ?? []));
    setFileError(null);
    if (kind === "flashcards") {
      setPresentations([pick]);
      setPptxFiles([]);
      return;
    }
    if (presentations.some((chosen) => chosen.id === item.id)) {
      setPresentations(presentations.filter((chosen) => chosen.id !== item.id));
    } else if (presentations.length + pptxFiles.length >= SUMMARY_MAX_FILES) {
      setFileError(TOO_MANY_FILES);
    } else {
      setPresentations([...presentations, pick]);
    }
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
    if (topicPreparing) return "თემის ფაილებს ვამზადებთ…";
    if (source === "file" || source === "audio" || source === "video") {
      if (!fileOf(source)) return source === "audio" ? "ჩაწერე ლექცია ან ატვირთე აუდიო." : "ატვირთე ფაილი.";
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
      if (presentations.length + pptxFiles.length === 0) return presentationMode === "saved" ? "აირჩიე პრეზენტაცია." : "ატვირთე .pptx ფაილი.";
    }
    return null;
  })();

  const sourceLabel = (): string | undefined => {
    if (source === "presentation") {
      const total = presentations.length + pptxFiles.length;
      if (total > 1) return `${total} პრეზენტაცია`;
      const title = presentations[0]?.title ?? pptxFiles[0]?.name.replace(/\.pptx$/i, "");
      return title ? `პრეზენტაცია: ${title}` : "პრეზენტაცია";
    }
    if (source === "youtube" && ytPreview.status === "ready") return `YouTube: ${ytPreview.preview.title}`;
    if (source === "file" && docs.length > 1) return `${docs.length} ფაილი`;
    if (source === "file" || source === "audio" || source === "video") return fileOf(source)?.name;
    return source === "text" ? "ტექსტი" : undefined;
  };

  const capture = (): UploadedData => ({
    inputType: source,
    file:
      source === "presentation"
        ? kind === "flashcards" && presentations.length === 0
          ? (pptxFiles[0] ?? null)
          : null
        : source === "file" && kind === "summary"
          ? null
          : source === "file" || source === "audio" || source === "video"
            ? fileOf(source)
            : null,
    // A conspectus: the saved presentations' text and the .pptx files, as one list of files.
    files: kind !== "summary" ? undefined : source === "file" ? docs : source === "presentation" ? [...presentations.map(presentationAsFile), ...pptxFiles] : undefined,
    text: source === "presentation" ? (kind === "flashcards" ? (presentations[0]?.text ?? "") : "") : text,
    youtubeUrl,
    topic,
    cardCount: count,
    difficulty,
    youtubeRange: segment.range,
    sourceLabel: sourceLabel(),
    ...(topicLink ? { link: topicLink } : {}),
  });

  // The deck being made, saved in „ჩემი მასალები“ from the start: leaving
  // this page doesn't stop it (lib/library/generation).
  const [deckId, setDeckId] = useState<string | null>(null);
  // Left before it finished: no redirect, and the notification says it's ready.
  const leave = useRef<(() => void) | null>(null);
  useEffect(() => () => leave.current?.(), []);

  const runFlashcards = async (data: UploadedData) => {
    setRunning(data);
    setReadyCards(0);
    setLatestQuestion(null);
    setRunError(null);
    // „თავიდან ცდა“ fills the same deck again.
    const again = deckId && !isGeneratingHere(deckId) ? deckId : undefined;
    const started = startDeckGeneration(data, again);
    setDeckId(started.deckId);
    const release = watchGeneration(started.deckId);
    const stopProgress = followProgress(started.deckId, (ready, latest) => {
      setReadyCards(ready);
      if (latest) setLatestQuestion(latest);
    });
    let here = true;
    leave.current = () => {
      here = false;
      stopProgress();
      release();
    };
    try {
      const deck = await started.done;
      if (here) router.push(`/deck/${deck.id}`);
    } catch (error) {
      if (here) setRunError(error instanceof Error ? error.message : GENERATION_ERROR);
    } finally {
      stopProgress();
      release();
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
        latestQuestion={latestQuestion}
        sourceLabel={running.sourceLabel}
        error={runError}
        keepsGoing
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
      <div className={`mx-auto w-full max-w-[1180px] px-4 pt-[calc(var(--safe-top)+16px)] sm:px-6 md:pb-16 md:pt-10 ${tab === "new" ? "pb-[230px]" : "pb-16"}`}>
        <header className="flex items-start gap-3 sm:gap-4">
          <BackButton fallbackHref={DASHBOARD_HREF} />
          <div className="min-w-0 flex-1">
            <h1 className="text-[24px] font-bold leading-tight tracking-tight text-[var(--gen-title)] sm:text-[30px]">AI გენერატორი</h1>
            <p className="mt-1 text-[14.5px] text-[var(--gen-muted)] sm:text-[15.5px]">ატვირთე მასალა და მიიღე ფლეშბარათები ან კონსპექტი</p>
          </div>
        </header>

        {tab ? <ToolTabs className="mt-5 sm:mt-6" tab={tab} count={libraryItems.length} onChange={setTab} /> : null}

        {tab === "library" ? (
          <div className="lib mt-5 flex flex-col gap-5">
            <ResumeStrip items={materials.decks} kind="deck" />
            <MaterialsList items={libraryItems} kind="deck" onCreate={() => setTab("new")} />
          </div>
        ) : null}

        {tab === "new" ? (
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
                        chooseSource(item.id);
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
              {topicPreparing ? (
                <p role="status" className="mb-3 flex items-center gap-2 rounded-[14px] bg-[var(--gen-soft)] px-4 py-3 text-[14.5px] font-semibold text-[var(--gen-title)]">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  თემის ფაილებს ვამზადებთ…
                </p>
              ) : null}
              {topicFailed.length > 0 && source === "file" ? (
                <ul className="mb-3 flex flex-col gap-2">
                  {topicFailed.map((file) => (
                    <TopicFileProblem key={file.id} file={file} onRetry={retryTopicFile} />
                  ))}
                </ul>
              ) : null}
              {topicPreparing ? null : fileSource === "file" && kind === "summary" ? (
                <SummaryFiles files={docs} onAdd={addDocs} onRemove={removeDoc} />
              ) : fileSource === "file" || fileSource === "video" ? (
                fileOf(fileSource) ? (
                  <FileRow file={fileOf(fileSource) as File} kind={fileSource} onClear={() => pickFile(fileSource, null)} />
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
              {fileSource === "file" && kind === "flashcards" && topicChoices.length > 1 ? (
                <div className="mt-3">
                  <p className="text-[13px] font-semibold text-[var(--gen-muted)]">თემის სხვა ფაილი:</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {topicChoices.map((choice) => (
                      <button
                        key={choice.name}
                        type="button"
                        aria-pressed={docs[0]?.name === choice.name}
                        onClick={() => setDocs([choice])}
                        className="gen-chip gen-focus max-w-full truncate"
                      >
                        {choice.name}
                      </button>
                    ))}
                  </div>
                </div>
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
                  selected={presentations}
                  onSelect={pickPresentation}
                  files={pptxFiles}
                  onAddFiles={addPptx}
                  onRemoveFile={removePptx}
                  multiple={kind === "summary"}
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
                    onClick={() => chooseKind(id)}
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
        ) : null}
      </div>
      {keepOne ? (
        <KeepOneFileDialog
          files={chosenOn(source)}
          onCancel={() => {
            // Several stay chosen, so it stays (or becomes) a conspectus.
            setKeepOne(false);
            setKind("summary");
          }}
          onKeep={keepOneOf}
        />
      ) : null}
    </div>
  );
}
