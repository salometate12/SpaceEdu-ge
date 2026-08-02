"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Film,
  ImageIcon,
  Link2,
  Mic,
  Sparkles,
  Upload,
  Video,
} from "lucide-react";
import { ka } from "@/lib/i18n";
import { createDeckFromGenerated, saveCustomDeck } from "@/lib/custom-decks";
import type { UploadedData } from "@/lib/generation-input";
import { buildGenerationFormData } from "@/lib/build-generation-form-data";
import { streamAiText } from "@/lib/assistant-stream-client";
import {
  parseFlashcardsIncremental,
  parseGeneratedFlashcardsJson,
  type FlashcardDraft,
} from "@/lib/ai/parse-flashcards-json";
import { setPendingSummaryGeneration } from "@/lib/pending-generation";
import type { InputType } from "@/lib/ai/process-input";
import {
  GenerationChoiceModal,
  type GenerationType,
} from "./GenerationChoiceModal";

type TabId = InputType;

export type { UploadedData };

const TABS: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: "file", label: ka.generator.tabs.file, icon: ImageIcon },
  { id: "audio", label: ka.generator.tabs.audio, icon: Mic },
  { id: "video", label: ka.generator.tabs.video, icon: Film },
  { id: "youtube", label: ka.generator.tabs.youtube, icon: Video },
  { id: "text", label: ka.generator.tabs.text, icon: FileText },
];

const FILE_ACCEPT: Record<TabId, string> = {
  file: ".png,.jpg,.jpeg,.webp,.pdf,.docx,.txt,image/*,application/pdf",
  audio: ".mp3,.wav,.m4a,audio/*",
  video: ".mp4,.webm,video/*",
  youtube: "",
  text: "",
};

export function CardGenerator() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabId>("file");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [cardCount, setCardCount] = useState(12);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploadedData, setUploadedData] = useState<UploadedData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generationType, setGenerationType] = useState<GenerationType | null>(
    null,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [streamPreview, setStreamPreview] = useState("");
  const [streamingCards, setStreamingCards] = useState<FlashcardDraft[]>([]);

  const handleFile = useCallback((f: File | null) => {
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) {
      setError("ფაილი ძალიან დიდია (მაქს. 20MB)");
      return;
    }
    setFile(f);
    setError(null);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile],
  );

  const validate = (): boolean => {
    if (activeTab === "text" && !text.trim()) {
      setError(ka.generator.enterText);
      return false;
    }
    if (activeTab === "youtube" && !youtubeUrl.trim()) {
      setError(ka.generator.enterYoutube);
      return false;
    }
    if (
      (activeTab === "file" || activeTab === "audio" || activeTab === "video") &&
      !file
    ) {
      setError(ka.generator.selectFile);
      return false;
    }
    return true;
  };

  const captureUpload = (): UploadedData => ({
    inputType: activeTab,
    file,
    text,
    youtubeUrl,
    topic,
    cardCount,
  });

  const handleContinue = () => {
    if (!validate()) return;
    setUploadedData(captureUpload());
    setIsModalOpen(true);
    setGenerationType(null);
    setModalError(null);
    setError(null);
  };

  const closeModal = () => {
    if (isGenerating) return;
    setIsModalOpen(false);
    setGenerationType(null);
    setModalError(null);
  };

  const runFlashcardGeneration = async (data: UploadedData) => {
    setStreamPreview("");
    setStreamingCards([]);
    const formData = buildGenerationFormData(data);

    const handleChunk = (partial: string) => {
      setStreamPreview(partial);
      const incremental = parseFlashcardsIncremental(partial);
      if (incremental.cards.length > 0) {
        setStreamingCards(incremental.cards);
      }
    };

    const fullText = await streamAiText("/api/generate-cards", formData, {
      fallbackError: ka.generator.error,
      onChunk: handleChunk,
    });

    const parsed = parseGeneratedFlashcardsJson(fullText);
    const deck = createDeckFromGenerated(parsed);
    saveCustomDeck(deck);
    setIsModalOpen(false);
    setStreamPreview("");
    setStreamingCards([]);
    router.push(`/deck/${deck.id}`);
  };

  const startSummaryStreaming = (data: UploadedData) => {
    setPendingSummaryGeneration(data);
    setIsModalOpen(false);
    setGenerationType(null);
    setModalError(null);
    setIsGenerating(false);
    router.push("/conspectus/stream");
  };

  const handleGenerationChoice = async (type: GenerationType) => {
    if (!uploadedData) return;

    if (type === "summary") {
      startSummaryStreaming(uploadedData);
      return;
    }

    setGenerationType(type);
    setIsGenerating(true);
    setModalError(null);
    setStreamPreview("");
    setStreamingCards([]);

    try {
      await runFlashcardGeneration(uploadedData);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : ka.generator.error);
      setGenerationType(null);
      setStreamPreview("");
      setStreamingCards([]);
      setStreamingCards([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const dropzoneLabel =
    activeTab === "audio"
      ? ka.generator.dropzoneAudio
      : activeTab === "video"
        ? ka.generator.dropzoneVideo
        : ka.generator.dropzone;

  return (
    <>
      <GenerationChoiceModal
        isOpen={isModalOpen}
        isLoading={isGenerating}
        generationType={generationType}
        error={modalError}
        streamPreview={streamPreview}
        streamingCards={streamingCards}
        onSelect={handleGenerationChoice}
        onClose={closeModal}
      />

      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            {ka.generator.title}
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            {ka.generator.subtitle}
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveTab(id);
                setFile(null);
                setError(null);
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-violet-600 text-white shadow-sm"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-violet-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {ka.generator.topicLabel}
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={ka.generator.topicPlaceholder}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-violet-900/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {ka.generator.cardCountLabel}
              </label>
              <input
                type="number"
                min={5}
                max={25}
                value={cardCount}
                onChange={(e) => setCardCount(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-violet-900/30"
              />
            </div>
          </div>

          {activeTab === "text" && (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={ka.generator.textPlaceholder}
              rows={8}
              className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-relaxed outline-none transition-colors focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-violet-900/30"
            />
          )}

          {activeTab === "youtube" && (
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder={ka.generator.youtubePlaceholder}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-violet-900/30"
              />
            </div>
          )}

          {(activeTab === "file" ||
            activeTab === "audio" ||
            activeTab === "video") && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={FILE_ACCEPT[activeTab]}
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              <div
                role="button"
                tabIndex={0}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    fileInputRef.current?.click();
                  }
                }}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 transition-all ${
                  isDragging
                    ? "border-violet-400 bg-violet-50 dark:bg-violet-950/20"
                    : "border-zinc-200 hover:border-violet-300 dark:border-zinc-700"
                }`}
              >
                <Upload className="mb-3 h-8 w-8 text-violet-500" />
                <p className="text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {dropzoneLabel}
                </p>
                {activeTab === "file" && (
                  <p className="mt-1 text-xs text-zinc-400">
                    {ka.generator.supportedFile}
                  </p>
                )}
                {file && (
                  <p className="mt-3 rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                    {file.name}
                  </p>
                )}
              </div>
            </>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleContinue}
            disabled={isModalOpen && isGenerating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]"
          >
            <Sparkles className="h-4 w-4" />
            {ka.generator.continue}
          </button>
        </div>
      </div>
    </>
  );
}
