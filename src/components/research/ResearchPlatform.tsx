"use client";

import { logActivity } from "@/lib/activity-log";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  AudioLines,
  Check,
  CloudUpload,
  FileText,
  Image as ImageIcon,
  ListChecks,
  Loader2,
  Plus,
  RotateCw,
  Sparkles,
  Type,
  X,
} from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { fetchAiJson, fetchAiMultipartJson } from "@/lib/ai/fetch-ai";
import {
  mergeResearchSections,
  RESEARCH_SECTION_KEYS,
  type ResearchResponse,
  type ResearchSectionKey,
} from "@/lib/ai/research-platform-schema";
import { exportElementToA4Pdf } from "@/lib/exportPdf";
import { createBlankLectureNote, loadLectureNotes, saveLectureNotes, upsertLectureNote } from "@/lib/lecture-notes";
import { relativeTimeShortKa } from "@/lib/relative-time-ka";
import {
  addResearchHistory,
  countPdfPages,
  formatBytes,
  isTooLarge,
  readResearchHistory,
  researchFileKind,
  researchHistoryItem,
  RESEARCH_MAX_BYTES,
  writeResearchHistory,
  type ResearchFileKind,
  type ResearchHistoryItem,
} from "@/lib/research-files";
import { getSpaceBackTarget, readSpaceeduSpace } from "@/lib/space-back-navigation";
import { RESEARCH_SECTIONS } from "./research-sections";
import { ResearchResult, researchToText, RP_SECONDARY } from "./ResearchResult";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rp-accent)]/40";
const CARD = "rounded-[22px] border border-[var(--rp-card-border)] bg-[var(--rp-card)]";
const ACCEPT = ".pdf,application/pdf,.txt,.md,text/plain,text/markdown,image/*,.heic,.heif,audio/*,.m4a";
const BUSY_ERROR = "AI ახლა გადატვირთულია, სცადე ცოტა ხანში.";
const MIN_TEXT = 50;

const KIND: Record<ResearchFileKind, { icon: typeof FileText; tile: string }> = {
  pdf: { icon: FileText, tile: "bg-[var(--rp-pdf-bg)] text-[var(--rp-pdf)]" },
  audio: { icon: AudioLines, tile: "bg-[var(--rp-audio-bg)] text-[var(--rp-audio)]" },
  image: { icon: ImageIcon, tile: "bg-[var(--rp-image-bg)] text-[var(--rp-image)]" },
  text: { icon: Type, tile: "bg-[var(--rp-text-bg)] text-[var(--rp-text-icon)]" },
};

/** ← back to where the student came from (`?from=student` → their dashboard). */
function BackButton() {
  const from = useSearchParams().get("from");
  const [href, setHref] = useState("/dashboard-student");
  useEffect(() => {
    void Promise.resolve().then(() => setHref(getSpaceBackTarget({ from, space: readSpaceeduSpace() }).href));
  }, [from]);
  return (
    <Link
      href={href}
      aria-label="უკან დაბრუნება"
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--rp-line)] bg-[var(--rp-card)] text-[var(--rp-strong)] transition-colors hover:border-[var(--rp-muted)] ${FOCUS}`}
    >
      <ArrowLeft className="h-[18px] w-[18px]" />
    </Link>
  );
}

/** One option of „რა გამოვყოთ?“: a coloured dot, title and line, a round check. */
function SectionOption({ sectionKey, selected, onToggle }: { sectionKey: ResearchSectionKey; selected: boolean; onToggle: () => void }) {
  const meta = RESEARCH_SECTIONS[sectionKey];
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`flex min-h-[50px] w-full items-center gap-3 rounded-[14px] bg-[var(--rp-card)] px-3.5 py-2.5 text-left transition-colors ${FOCUS} ${
        selected ? "border-[1.5px] border-[var(--rp-ink)]" : "border border-[var(--rp-line)] hover:border-[var(--rp-muted)]"
      }`}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: `var(--rp-${sectionKey})` }} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-semibold text-[var(--rp-strong)]">{meta.label}</span>
        <span className="block text-[12.5px] text-[var(--rp-muted)]">{meta.description}</span>
      </span>
      <span
        aria-hidden
        className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ${
          selected ? "bg-[var(--rp-ink)] text-[var(--rp-ink-text)]" : "border-[1.5px] border-[var(--rp-line-strong)]"
        }`}
      >
        {selected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
      </span>
    </button>
  );
}

const STEPS = ["ვკითხულობ მასალას", "ვარჩევ სექციებს", "ვწერ ანალიზს"];
const STEP_AT_MS = [3000, 9000];

function Analyzing() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = STEP_AT_MS.map((ms, index) => window.setTimeout(() => setStep(index + 1), ms));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);
  return (
    <div aria-busy>
      <p className="text-[18px] font-bold text-[var(--rp-strong)]">ვაანალიზებ მასალას</p>
      <ol className="mt-4 space-y-3" aria-live="polite">
        {STEPS.map((label, index) => {
          const state = index < step ? "done" : index === step ? "current" : "next";
          return (
            <li key={label} aria-current={state === "current" ? "step" : undefined} className={`flex items-center gap-3 ${state === "next" ? "opacity-50" : ""}`}>
              <span
                aria-hidden
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  state === "done" ? "bg-[var(--rp-ok)] text-white" : state === "current" ? "border-2 border-[var(--rp-strong)]" : "border-2 border-[var(--rp-line)]"
                }`}
              >
                {state === "done" ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : state === "current" ? (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--rp-accent)] motion-reduce:animate-none" />
                ) : null}
              </span>
              <span className={`text-[15px] ${state === "current" ? "font-semibold text-[var(--rp-strong)]" : "text-[var(--rp-text)]"}`}>
                {label}
                {state === "done" ? <span className="sr-only"> — მზადაა</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-6 space-y-5 border-t border-[var(--rp-card-border)] pt-5" aria-hidden>
        {[0, 1, 2].map((block) => (
          <div key={block} className="space-y-2.5">
            <div className="h-3.5 w-36 animate-pulse rounded bg-[var(--rp-soft)] motion-reduce:animate-none" />
            <div className="h-4 w-full animate-pulse rounded bg-[var(--rp-soft)] motion-reduce:animate-none" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--rp-soft)] motion-reduce:animate-none" />
          </div>
        ))}
      </div>
    </div>
  );
}

const HOW = [
  { icon: CloudUpload, n: 1, title: "ატვირთე", text: "სტატია, ლექცია, ფოტო ან აუდიო ჩანაწერი" },
  { icon: ListChecks, n: 2, title: "მონიშნე", text: "რა გაინტერესებს — თეზისები, მეთოდოლოგია, კრიტიკა…" },
  { icon: Sparkles, n: 3, title: "მიიღე ანალიზი", text: "გვერდის მითითებებით — შეინახე ჟურნალში ან გადმოწერე" },
];

/**
 * „მასალა → ანალიზი“: the material and what to pull out of it on the left;
 * on the right how it works and the last analyses, then the analysis —
 * section by section, with page references for PDFs. Below 900px, one
 * column. The last analyses stay on this device and reopen without the AI.
 */
export function ResearchPlatform() {
  const [mode, setMode] = useState<"file" | "text">("file");
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [pasted, setPasted] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [showCompressTips, setShowCompressTips] = useState(false);
  const [selected, setSelected] = useState<ResearchSectionKey[]>(["theses"]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResponse | null>(null);
  // What the shown analysis was made from (and which sections it has).
  const [shownFrom, setShownFrom] = useState<{ name: string; kind: ResearchFileKind; sections: ResearchSectionKey[]; id?: string } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [history, setHistory] = useState<ResearchHistoryItem[]>([]);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const rightRef = useRef<HTMLElement>(null);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    void Promise.resolve().then(() => setHistory(readResearchHistory()));
  }, []);

  const kind = file ? researchFileKind(file) : mode === "text" ? "text" : null;
  const tooLarge = file ? isTooLarge(file.size) : false;
  const hasInput = mode === "file" ? Boolean(file) && !tooLarge : pasted.trim().length >= MIN_TEXT;
  // Adding sections needs the material itself (not an analysis reopened from history).
  const canAdd = Boolean(result && shownFrom && (mode === "file" ? file && file.name === shownFrom.name && !tooLarge : pasted.trim().length >= MIN_TEXT));

  const pickFile = (next: File) => {
    const nextKind = researchFileKind(next);
    if (!nextKind) {
      setFileError("ეს ფორმატი არ გვაქვს: ატვირთე PDF, TXT, MD, ფოტო ან აუდიო.");
      return;
    }
    setFileError(null);
    setShowCompressTips(false);
    setFile(next);
    setPageCount(null);
    if (nextKind === "pdf" && !isTooLarge(next.size)) {
      void next.text().then((raw) => setPageCount(countPdfPages(raw)));
    }
  };

  const removeFile = () => {
    setFile(null);
    setPageCount(null);
    setShowCompressTips(false);
  };

  /** One column: the answer is below the form, so bring it into view. */
  const revealRight = () => {
    if (!window.matchMedia("(max-width: 900px)").matches) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => rightRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" }));
  };

  const callAi = async (keys: ResearchSectionKey[], addOnly: boolean): Promise<ResearchResponse> => {
    const toggles = Object.fromEntries(keys.map((key) => [key, true]));
    if (mode === "file" && file && kind !== "text") {
      return fetchAiMultipartJson<ResearchResponse>({
        pageType: "research-platform-abit",
        file,
        fields: { toggles: JSON.stringify(toggles), ...(addOnly ? { addOnly: "true" } : {}) },
      });
    }
    const textBody = mode === "file" && file ? await file.text() : pasted;
    return fetchAiJson<ResearchResponse>({
      pageType: "research-platform-abit",
      responseMode: "json",
      payload: {
        fileName: mode === "file" && file ? file.name : "ჩასმული ტექსტი",
        textBody: textBody.slice(0, 120_000),
        toggles,
        addOnly,
      },
    });
  };

  const failMessage = (err: unknown) => {
    const message = err instanceof Error ? err.message : "";
    return /[ა-ჿ]/.test(message) ? message : BUSY_ERROR;
  };

  const analyze = async () => {
    if (!hasInput || loading) return;
    const keys = RESEARCH_SECTION_KEYS.filter((key) => selected.includes(key));
    setLoading(true);
    setError(null);
    setResult(null);
    setSavedNoteId(null);
    setAddOpen(false);
    revealRight();
    try {
      const data = await callAi(keys, false);
      const name = mode === "file" && file ? file.name : "ჩასმული ტექსტი";
      const sourceKind: ResearchFileKind = mode === "file" && kind ? kind : "text";
      const item = researchHistoryItem({ name, kind: sourceKind, sections: keys, result: data });
      setResult(data);
      logActivity({ type: "material_analyzed", tool: "material_analysis", meta: { kind: sourceKind } });
      setShownFrom({ name, kind: sourceKind, sections: keys, id: item.id });
      setHistory((current) => {
        const next = addResearchHistory(current, item);
        writeResearchHistory(next);
        return next;
      });
    } catch (err) {
      setError(failMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /** „+ დამატება“: only the new section is written; the rest stays as it is. */
  const addSection = async (key: ResearchSectionKey) => {
    if (!result || !shownFrom || adding) return;
    setAddOpen(false);
    setAdding(true);
    setError(null);
    try {
      const data = await callAi([key], true);
      const merged = mergeResearchSections(result, data, [key]);
      const sections = RESEARCH_SECTION_KEYS.filter((item) => item === key || shownFrom.sections.includes(item));
      setResult(merged);
      setSelected(sections);
      setShownFrom({ ...shownFrom, sections });
      setSavedNoteId(null);
      setHistory((current) => {
        const next = current.map((entry) => (entry.id === shownFrom.id ? { ...entry, result: merged, sections } : entry));
        writeResearchHistory(next);
        return next;
      });
    } catch (err) {
      setError(failMessage(err));
    } finally {
      setAdding(false);
    }
  };

  const reopen = (item: ResearchHistoryItem) => {
    setResult(item.result);
    setShownFrom({ name: item.name, kind: item.kind, sections: item.sections, id: item.id });
    setSelected(item.sections);
    setSavedNoteId(null);
    setError(null);
    revealRight();
  };

  const saveToJournal = () => {
    if (!result || !shownFrom) return;
    const note = {
      ...createBlankLectureNote("ai-notes"),
      title: result.title.trim() || shownFrom.name,
      content: researchToText(result, shownFrom.sections, shownFrom.kind === "pdf"),
    };
    saveLectureNotes(upsertLectureNote(loadLectureNotes(), note));
    setSavedNoteId(note.id);
  };

  const exportPdf = async () => {
    if (!articleRef.current || !result) return;
    setExporting(true);
    try {
      const background = getComputedStyle(articleRef.current.closest(".rp-card") ?? articleRef.current).backgroundColor || "#ffffff";
      await exportElementToA4Pdf(articleRef.current, (result.title || "ანალიზი").slice(0, 80), background);
    } catch {
      setError("PDF ვერ შევქმენი. სცადე კიდევ ერთხელ.");
    } finally {
      setExporting(false);
    }
  };

  const toggleSection = (key: ResearchSectionKey) =>
    setSelected((current) => (current.includes(key) ? (current.length > 1 ? current.filter((item) => item !== key) : current) : [...current, key]));

  const FileIcon = kind ? KIND[kind].icon : FileText;
  const notAdded = shownFrom ? RESEARCH_SECTION_KEYS.filter((key) => !shownFrom.sections.includes(key)) : [];

  return (
    // Phones: the page colour also runs under the shell's dock padding.
    <div className="rp under-site-header min-h-dvh max-md:-mt-[var(--safe-top)] max-md:-mb-36 max-md:pb-36">
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-16 pt-[calc(var(--safe-top)+16px)] sm:px-6 md:pt-10">
        <header className="flex items-center gap-3">
          <Suspense fallback={<span className="h-10 w-10" />}>
            <BackButton />
          </Suspense>
          <div className="min-w-0">
            <h1 className="text-[24px] font-bold leading-tight text-[var(--rp-strong)] sm:text-[26px]">მასალა → ანალიზი</h1>
            <p className="text-[14px] text-[var(--rp-muted)]">ჩააგდე PDF, ფოტო, ტექსტი ან აუდიო — მონიშნე, რა გამოვყოთ</p>
          </div>
        </header>

        <div className="mt-6 flex flex-wrap items-start gap-5 sm:mt-8">
          {/* Left: the material and what to pull out. */}
          <section
            aria-label="მასალა"
            className={`${CARD} min-w-0 flex-[1_1_340px] p-5 max-[901px]:basis-full min-[901px]:sticky min-[901px]:top-[calc(var(--site-header-h)+16px)] min-[901px]:max-w-[400px]`}
          >
            {mode === "text" ? (
              <div>
                <label htmlFor="rp-text" className="text-[13px] font-semibold text-[var(--rp-muted)]">
                  ჩასვი ტექსტი
                </label>
                <textarea
                  id="rp-text"
                  value={pasted}
                  onChange={(event) => setPasted(event.target.value)}
                  rows={7}
                  placeholder="ჩასვი სტატიის ან ლექციის ტექსტი…"
                  className="mt-2 min-h-[150px] w-full resize-y rounded-[16px] border border-[var(--rp-line)] bg-[var(--rp-card)] px-4 py-3 text-[16px] leading-[1.6] text-[var(--rp-strong)] outline-none placeholder:text-[var(--rp-muted)] focus:border-[var(--rp-strong)] sm:text-[15px]"
                />
                {pasted.trim() && pasted.trim().length < MIN_TEXT ? (
                  <p className="mt-1 text-[12.5px] text-[var(--rp-muted)]">კიდევ ცოტა — მინიმუმ {MIN_TEXT} სიმბოლო.</p>
                ) : null}
                <button type="button" onClick={() => setMode("file")} className={`mt-2 rounded-full text-[13.5px] font-semibold text-[var(--rp-accent)] hover:underline ${FOCUS}`}>
                  დაბრუნება ფაილზე
                </button>
              </div>
            ) : file ? (
              <div>
                <div
                  className={`flex items-center gap-3 rounded-[14px] px-3.5 py-3 ${
                    tooLarge ? "border-[1.5px] border-dashed border-[var(--rp-bad-border)] bg-[var(--rp-bad-bg)]" : "border border-[var(--rp-line)] bg-[var(--rp-card)]"
                  }`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${kind ? KIND[kind].tile : ""}`} aria-hidden>
                    <FileIcon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-semibold text-[var(--rp-strong)]">{file.name}</span>
                    {tooLarge ? (
                      <span className="block text-[12.5px] font-semibold text-[var(--rp-bad-text)]">
                        {formatBytes(file.size)} · მაქს. {formatBytes(RESEARCH_MAX_BYTES)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[12.5px] font-medium text-[var(--rp-ok)]">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                        {pageCount ? `${pageCount} გვერდი · ` : ""}
                        {formatBytes(file.size)}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={removeFile}
                    aria-label="ფაილის მოშორება"
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--rp-muted)] transition-colors hover:bg-[var(--rp-soft)] hover:text-[var(--rp-strong)] ${FOCUS}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {tooLarge ? (
                  <Alert
                    tone="error"
                    className="mt-3"
                    title="ფაილი ძალიან დიდია"
                    action={
                      <>
                        <button type="button" onClick={removeFile} className={RP_SECONDARY}>
                          სხვა ფაილი
                        </button>
                        <button type="button" onClick={() => setShowCompressTips((open) => !open)} aria-expanded={showCompressTips} className={RP_SECONDARY}>
                          როგორ შევკუმშო?
                        </button>
                      </>
                    }
                  >
                    შეკუმშე PDF ან ატვირთე მხოლოდ საჭირო გვერდები.
                    {showCompressTips ? (
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px]">
                        <li>Mac: გახსენი Preview-ში → File → Export → Quartz Filter: „Reduce File Size“.</li>
                        <li>Windows: Microsoft Print to PDF-ით დაბეჭდე მხოლოდ საჭირო გვერდები.</li>
                        <li>ფოტოებიანი PDF-ის შემთხვევაში დაასკანერე უფრო დაბალ ხარისხზე.</li>
                      </ul>
                    ) : null}
                  </Alert>
                ) : null}
              </div>
            ) : (
              <div>
                <UploadDropzone
                  accept={ACCEPT}
                  onFiles={(files) => pickFile(files[0])}
                  label="ჩააგდე ფაილი ან დააწკაპუნე"
                  hint={`PDF · TXT · MD · ფოტო · აუდიო · მაქს. ${formatBytes(RESEARCH_MAX_BYTES)}`}
                  className="min-h-[150px]"
                />
                {fileError ? (
                  <Alert tone="error" className="mt-3">
                    {fileError}
                  </Alert>
                ) : null}
                <button type="button" onClick={() => setMode("text")} className={`mt-2.5 rounded-full text-[13.5px] font-semibold text-[var(--rp-accent)] hover:underline ${FOCUS}`}>
                  ან ჩასვი ტექსტი
                </button>
              </div>
            )}

            {result && shownFrom ? (
              <div className="mt-5">
                <p className="text-[13px] font-semibold text-[var(--rp-muted)]">გამოყოფილია</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {shownFrom.sections.map((key) => (
                    <span key={key} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--rp-ink)] px-3 text-[12.5px] font-semibold text-[var(--rp-ink-text)]">
                      <span className="h-2 w-2 rounded-full" style={{ background: `var(--rp-${key})` }} aria-hidden />
                      {RESEARCH_SECTIONS[key].short}
                    </span>
                  ))}
                  {notAdded.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setAddOpen((open) => !open)}
                      disabled={!canAdd || adding}
                      aria-expanded={addOpen}
                      title={canAdd ? undefined : "სექციის დასამატებლად მასალა ისევ ატვირთე"}
                      className={`inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-[var(--rp-line-strong)] px-3 text-[12.5px] font-semibold text-[var(--rp-strong)] transition-colors hover:border-[var(--rp-muted)] disabled:opacity-50 ${FOCUS}`}
                    >
                      {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
                      {adding ? "ვამატებ…" : "დამატება"}
                    </button>
                  ) : null}
                </div>
                {addOpen ? (
                  <div className="mt-3 space-y-1.5">
                    {notAdded.map((key) => (
                      <SectionOption key={key} sectionKey={key} selected={false} onToggle={() => void addSection(key)} />
                    ))}
                  </div>
                ) : null}
                <button type="button" onClick={() => void analyze()} disabled={!hasInput || loading} className={`${RP_SECONDARY} mt-4`}>
                  <RotateCw className="h-4 w-4" aria-hidden />
                  ხელახლა ანალიზი
                </button>
              </div>
            ) : (
              <div className="mt-5">
                <p className="text-[13px] font-semibold text-[var(--rp-muted)]" id="rp-sections">
                  რა გამოვყოთ?
                </p>
                <div role="group" aria-labelledby="rp-sections" className="mt-2 space-y-1.5">
                  {RESEARCH_SECTION_KEYS.map((key) => (
                    <SectionOption key={key} sectionKey={key} selected={selected.includes(key)} onToggle={() => toggleSection(key)} />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => void analyze()}
                  disabled={!hasInput || loading}
                  className={`mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--rp-accent)] text-[15px] font-bold text-white transition-[filter,opacity] hover:brightness-110 disabled:pointer-events-none disabled:opacity-45 ${FOCUS}`}
                >
                  {loading ? <Loader2 className="h-[18px] w-[18px] animate-spin motion-reduce:animate-none" aria-hidden /> : null}
                  {loading ? "ვაანალიზებ…" : "ანალიზის დაწყება"}
                </button>
              </div>
            )}

            {error ? (
              <Alert tone="error" className="mt-4" title="ანალიზი ვერ მოვამზადე">
                {error}
              </Alert>
            ) : null}
          </section>

          {/* Right: how it works and the last analyses, or the analysis. */}
          <section
            ref={rightRef}
            aria-label="ანალიზი"
            aria-busy={loading}
            className={`${CARD} rp-card min-w-0 flex-[999_1_480px] scroll-mt-4 p-5 max-[901px]:basis-full sm:p-7`}
          >
            {loading ? (
              <Analyzing />
            ) : result && shownFrom ? (
              <ResearchResult
                result={result}
                sections={shownFrom.sections}
                showPages={shownFrom.kind === "pdf"}
                savedNoteId={savedNoteId}
                exporting={exporting}
                onSaveToJournal={saveToJournal}
                onExportPdf={() => void exportPdf()}
                articleRef={articleRef}
              />
            ) : (
              <div>
                <h2 className="text-[18px] font-bold text-[var(--rp-strong)]">როგორ მუშაობს</h2>
                <ol className="mt-4 space-y-2.5">
                  {HOW.map((step) => {
                    const Icon = step.icon;
                    return (
                      <li key={step.n} className="flex items-center gap-3.5 rounded-[16px] px-4 py-3.5" style={{ background: `var(--rp-how${step.n}-bg)` }}>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--rp-card)]" style={{ color: `var(--rp-how${step.n}-icon)` }} aria-hidden>
                          <Icon className="h-5 w-5" strokeWidth={1.9} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[15px] font-bold" style={{ color: `var(--rp-how${step.n}-title)` }}>
                            {step.n}. {step.title}
                          </span>
                          <span className="block text-[14px]" style={{ color: `var(--rp-how${step.n}-text)` }}>
                            {step.text}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ol>

                {history.length > 0 ? (
                  <div className="mt-6 border-t border-[var(--rp-card-border)] pt-5">
                    <h3 className="text-[13px] font-semibold text-[var(--rp-muted)]">ბოლო ანალიზები</h3>
                    <ul className="mt-2 space-y-0.5">
                      {history.slice(0, 5).map((item) => {
                        const Icon = KIND[item.kind].icon;
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => reopen(item)}
                              className={`flex w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left transition-colors hover:bg-[var(--rp-soft)] ${FOCUS}`}
                            >
                              <span className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] ${KIND[item.kind].tile}`} aria-hidden>
                                <Icon className="h-4 w-4" />
                              </span>
                              <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[var(--rp-strong)]">{item.result.title || item.name}</span>
                              <span className="shrink-0 text-[12.5px] text-[var(--rp-muted)]">{relativeTimeShortKa(item.at)}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
