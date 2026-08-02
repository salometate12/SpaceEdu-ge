"use client";

import {
  useMemo,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { useCompletion } from "@ai-sdk/react";
import {
  ClipboardCopy,
  Download,
  FileText,
  Loader2,
  Printer,
  UploadCloud,
} from "lucide-react";
import type { Deck } from "@/lib/types";
import { DeckCard } from "../DeckCard";

interface SchoolSpaceWorkspaceProps {
  decks: Deck[];
  progressMap: Record<string, number>;
}

export function SchoolSpaceWorkspace({
  decks,
  progressMap,
}: SchoolSpaceWorkspaceProps) {
  const [promptInput, setPromptInput] = useState("");
  const quickSuggestions = [
    "დამეხმარე საშინაო დავალებაში",
    "ამიხსენი რთული ფიზიკის კანონი",
    "მომიყევი ისტორიული ამბავი ზღაპრად",
  ];

  const {
    completion,
    complete,
    error,
    isLoading,
    stop,
  } = useCompletion({
    api: "/api/space-assistant",
  });

  const projects = [
    "საბუნებისმეტყველო პრეზენტაცია — ვადა: პარასკევი",
    "ინგლისურის ლექსიკური დავალება — ვადა: ხვალ",
    "მათემატიკის პრაქტიკული ტესტი — კვირის ბოლოს",
  ];

  const submitPrompt = async (value: string) => {
    const message = value.trim();
    if (!message) return;
    setPromptInput(message);
    await complete(message, {
      body: {
        space: "school",
      },
    });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitPrompt(promptInput);
  };

  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <article className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-900/60">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            💡 ამიხსენი 5 წლის ბავშვივით (ELI5)
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            რთული თემების მარტივი, მეგობრული და გასაგები ახსნა.
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {quickSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => submitPrompt(suggestion)}
              className="rounded-full border border-zinc-200/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-all hover:border-violet-200 hover:text-violet-700 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:border-violet-700"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mb-4 flex gap-2">
          <input
            value={promptInput}
            onChange={(event) => setPromptInput(event.target.value)}
            placeholder="შეიყვანე კითხვა ან თემა..."
            className="h-11 flex-1 rounded-xl border border-zinc-200 bg-white/90 px-3 text-sm text-zinc-800 outline-none ring-violet-500/30 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
          >
            გაგზავნა
          </button>
          {isLoading && (
            <button
              type="button"
              onClick={stop}
              className="rounded-xl border border-zinc-300 px-3 text-sm font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
            >
              გაჩერება
            </button>
          )}
        </form>

        <div className="min-h-[220px] rounded-xl border border-dashed border-zinc-200/90 bg-zinc-50/80 p-4 text-sm leading-7 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-200">
          {isLoading && (
            <div className="mb-2 inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              AI ამზადებს მარტივ ახსნას...
            </div>
          )}
          {completion ? completion : "აქ გამოჩნდება ELI5 პასუხი."}
          {error && (
            <p className="mt-3 text-sm text-rose-500">
              {error.message || "პასუხის მიღება ვერ მოხერხდა"}
            </p>
          )}
        </div>
      </article>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-900/60">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            🎒 მიმდინარე სასკოლო პროექტები
          </h3>
          <ul className="mt-3 space-y-2">
            {projects.map((project) => (
              <li
                key={project}
                className="rounded-lg border border-zinc-200/80 bg-white/70 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300"
              >
                {project}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-900/60">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            სწრაფი დღიური ვიქტორინა
          </h3>
          {decks.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              სწრაფი კოლოფები არ მოიძებნა.
            </p>
          ) : (
            <div className="grid gap-3">
              {decks.slice(0, 2).map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  learnedCount={progressMap[deck.id] ?? 0}
                />
              ))}
            </div>
          )}
        </div>
      </aside>
    </section>
  );
}

interface UniversitySpaceWorkspaceProps {
  decks: Deck[];
  progressMap: Record<string, number>;
}

type UniversityMode = "code-assistant" | "medical-dictionary";

export function UniversitySpaceWorkspace({
  decks,
  progressMap,
}: UniversitySpaceWorkspaceProps) {
  const [fileName, setFileName] = useState("");
  const [fileContext, setFileContext] = useState("");
  const [query, setQuery] = useState("");
  const [activeMode, setActiveMode] = useState<UniversityMode>("code-assistant");

  const {
    completion,
    complete,
    error,
    isLoading,
    stop,
  } = useCompletion({
    api: "/api/space-assistant",
  });

  const uploaded = Boolean(fileName);
  const modeLabel =
    activeMode === "code-assistant"
      ? "CS Code Assistant"
      : "Medical Dictionary";

  const parsedPreview = useMemo(() => {
    if (!fileContext) return "ფაილის კონტექსტი გამოჩნდება აქ.";
    return fileContext.slice(0, 1200);
  }, [fileContext]);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    try {
      const raw = await file.text();
      setFileContext(raw.trim().slice(0, 6000));
    } catch {
      setFileContext(
        `ფაილი მიღებულია: ${file.name}. ავტოპარსინგი ვერ შესრულდა. გამოიყენე დამატებითი ინსტრუქცია გენერატორში.`,
      );
    }
  };

  const onDrop = async (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) await handleFile(file);
  };

  const onUploadChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) await handleFile(file);
  };

  const onGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = query.trim();
    if (!prompt) return;
    await complete(prompt, {
      body: {
        space: "university",
        context: fileContext || fileName,
        mode: activeMode,
      },
    });
  };

  const copyText = async () => {
    if (!completion) return;
    await navigator.clipboard.writeText(completion);
  };

  const downloadText = () => {
    if (!completion) return;
    const blob = new Blob([completion], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "akademiuri-conspectus.md";
    link.click();
    URL.revokeObjectURL(url);
  };

  const printText = () => {
    if (!completion) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<pre style="white-space: pre-wrap; font-family: sans-serif;">${completion}</pre>`);
    win.document.close();
    win.print();
  };

  return (
    <section className="space-y-4">
      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-400/50 bg-zinc-50/50 px-5 py-10 text-center transition hover:border-violet-500/40 hover:bg-violet-50/30 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:border-violet-700 dark:hover:bg-violet-950/10"
      >
        <UploadCloud className="h-6 w-6 text-violet-500" />
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          📂 Syllabus Optimizer & PDF AI
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Drag & Drop ფაილი ან დააჭირე ასატვირთად
        </p>
        <input type="file" className="hidden" onChange={onUploadChange} />
      </label>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["code-assistant", "Code Assistant"],
            ["medical-dictionary", "Medical Dictionary"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveMode(id)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              activeMode === id
                ? "bg-violet-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {uploaded ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-900/60">
            <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              📘 PDF Reader & AI Context Parser
            </h3>
            <div className="mb-3 rounded-xl border border-zinc-200/70 bg-zinc-50/80 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-300">
              ფაილი: {fileName}
            </div>
            <div className="max-h-[380px] overflow-y-auto rounded-xl border border-dashed border-zinc-300 p-3 text-sm leading-6 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
              {parsedPreview}
            </div>
          </article>

          <article className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-900/60">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                📄 აკადემიური კონსპექტის გენერატორი
              </h3>
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {modeLabel}
              </span>
            </div>
            <form onSubmit={onGenerate} className="mb-3 space-y-2">
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="რა ტიპის კონსპექტი გჭირდება?"
                className="min-h-[96px] w-full rounded-xl border border-zinc-200 bg-white/90 px-3 py-2 text-sm text-zinc-800 outline-none ring-violet-500/30 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
                >
                  გენერაცია
                </button>
                {isLoading && (
                  <button
                    type="button"
                    onClick={stop}
                    className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    გაჩერება
                  </button>
                )}
              </div>
            </form>
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyText}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <ClipboardCopy className="h-3.5 w-3.5" />
                Copy
              </button>
              <button
                type="button"
                onClick={downloadText}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
              <button
                type="button"
                onClick={printText}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </button>
            </div>
            <div className="min-h-[250px] rounded-xl border border-dashed border-zinc-300 p-3 text-sm leading-7 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
              {isLoading && (
                <p className="mb-2 inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  აკადემიური კონსპექტი გენერირდება...
                </p>
              )}
              {completion || "გენერირებული აკადემიური კონსპექტი აქ გამოჩნდება."}
              {error && (
                <p className="mt-3 text-sm text-rose-500">
                  {error.message || "გენერაცია ვერ შესრულდა"}
                </p>
              )}
            </div>
          </article>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-900/60">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            უნივერსიტეტის სწრაფი კოლოფები
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {decks.slice(0, 2).map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                learnedCount={progressMap[deck.id] ?? 0}
              />
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200/80 bg-white/70 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1 font-semibold">
          <FileText className="h-3.5 w-3.5" /> კვლევითი რეჟიმი:
        </span>{" "}
        ატვირთე სილაბუსი/PDF და მოითხოვე სტრუქტურირებული აკადემიური ანალიზი.
      </div>
    </section>
  );
}
