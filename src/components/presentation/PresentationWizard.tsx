"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileText,
  HelpCircle,
  LayoutTemplate,
  Loader2,
  Sparkles,
} from "lucide-react";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import type { PresentationResponse } from "@/lib/ai/presentation-schema";
import { DEFAULT_PRESENTATION_LEVEL } from "@/lib/presentation-constants";
import { historyReducer, initHistory } from "@/lib/presentation-history";
import { assignPhotosToSlides } from "@/lib/presentation-layout";
import {
  countPresentations,
  loadPresentation,
  MAX_PRESENTATIONS,
  presentationTitle,
  savePresentation,
  storageAlmostFull,
  type SavedPresentation,
} from "@/lib/presentation-store";
import { PRESENTATION_TEMPLATES as TEMPLATES } from "@/lib/presentation-templates";
import { DEFAULT_TEMPLATE_ID } from "@/lib/presentation-theme";
import type { Deck, GeneratedSlide, PresentationForm, QAAnswers } from "@/lib/presentation-types";
import { photoMeta, type UploadedPhoto } from "@/lib/presentation-photos";
import { PresentationThinkingLoader } from "./PresentationThinkingLoader";
import { Step1Info } from "./Step1Info";
import { Step2Templates } from "./Step2Templates";
import { Step3PhotosQA } from "./Step3PhotosQA";
import { Step4Result } from "./Step4Result";

export type { GeneratedSlide, PresentationForm, PresentationTemplate, QAAnswers } from "@/lib/presentation-types";

const STEPS = [
  { n: 1, label: "ინფო", icon: FileText },
  { n: 2, label: "დიზაინი", icon: LayoutTemplate },
  { n: 3, label: "დეტალები", icon: HelpCircle },
  { n: 4, label: "შედეგი", icon: Sparkles },
] as const;

const SAVE_DELAY_MS = 800;

const DEFAULT_FORM: PresentationForm = {
  topic: "",
  subject: "",
  slideCount: 10,
  level: DEFAULT_PRESENTATION_LEVEL,
  language: "ქართული",
  extraInstructions: "",
};

const DEFAULT_QA: QAAnswers = {
  goal: "ცნების განმარტება",
  audience: "პროფესორი",
  tone: "აკადემიური",
  mainPoint: "",
};

interface PresentationWizardProps {
  /** Where this presentation is saved; a new id starts an empty wizard. */
  presentationId: string;
  /** The first time it's saved (the page then puts the id in the URL). */
  onFirstSave?: (id: string) => void;
  onNewPresentation: () => void;
}

/** Everything that is saved; a new object whenever any of it changes. */
interface Snapshot {
  form: PresentationForm;
  templateId: string;
  qa: QAAnswers;
  step: SavedPresentation["step"];
  deck: Deck | null;
  photos: UploadedPhoto[];
}

export function PresentationWizard({ presentationId, onFirstSave, onNewPresentation }: PresentationWizardProps) {
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState<SavedPresentation["step"]>(1);
  const [form, setForm] = useState<PresentationForm>(DEFAULT_FORM);
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [qa, setQa] = useState<QAAnswers>(DEFAULT_QA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The generated deck with its undo history (null before generation).
  const [history, dispatch] = useReducer(historyReducer<Deck | null>, null, initHistory<Deck | null>);
  const deck = history.present;
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);

  // ---- loading a saved presentation ----
  const createdAt = useRef<number | null>(null);
  const [storageProblem, setStorageProblem] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    loadPresentation(presentationId)
      .then((saved) => {
        if (!active) return;
        if (saved) {
          const { presentation } = saved;
          createdAt.current = presentation.createdAt;
          setForm({ ...DEFAULT_FORM, ...presentation.form });
          setQa({ ...DEFAULT_QA, ...presentation.qa });
          setSelectedTemplateId(presentation.templateId);
          setPhotos(saved.photos);
          if (presentation.slides?.length) {
            dispatch({
              type: "reset",
              present: { title: presentation.title, templateId: presentation.templateId, slides: presentation.slides },
            });
            setStep(4);
          } else {
            setStep(Math.min(presentation.step, 3) as SavedPresentation["step"]);
          }
        }
        setLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setStorageProblem("ამ ბრაუზერში შენახვა ვერ ხერხდება (მაგ. პირად რეჟიმში) — პრეზენტაცია მხოლოდ ამ ჩანართში დარჩება.");
        setLoaded(true);
      });
    void storageAlmostFull().then((full) => {
      if (active && full) setStorageProblem("მოწყობილობის მეხსიერება თითქმის სავსეა — ძველი პრეზენტაციები წაშალე, რომ ახლები შეინახოს.");
    });
    return () => {
      active = false;
    };
  }, [presentationId]);

  // ---- autosave ----
  const snapshot = useMemo<Snapshot>(
    () => ({ form, templateId: deck?.templateId ?? selectedTemplateId, qa, step, deck, photos }),
    [form, selectedTemplateId, qa, step, deck, photos],
  );
  const hasContent = Boolean(form.topic.trim() || photos.length > 0 || step > 1 || deck);
  const [savedSnapshot, setSavedSnapshot] = useState<Snapshot | null>(null);
  const [saveProblem, setSaveProblem] = useState<"error" | "limit" | null>(null);
  const latest = useRef({ snapshot, hasContent, loaded });
  useEffect(() => {
    latest.current = { snapshot, hasContent, loaded };
  }, [snapshot, hasContent, loaded]);
  const exists = useRef(false);
  const saving = useRef<Promise<void> | null>(null);

  const flush = useCallback(async () => {
    // One write at a time; the next one picks up whatever changed meanwhile.
    if (saving.current) await saving.current;
    const { snapshot: current, hasContent: worthSaving, loaded: ready } = latest.current;
    if (!ready || !worthSaving) return;
    const run = (async () => {
      try {
        if (!exists.current && createdAt.current === null) {
          if ((await countPresentations()) >= MAX_PRESENTATIONS) {
            setSaveProblem("limit");
            return;
          }
        }
        const now = Date.now();
        const first = createdAt.current === null;
        if (first) createdAt.current = now;
        await savePresentation(
          {
            id: presentationId,
            title: presentationTitle(current.deck?.title, current.form.topic),
            createdAt: createdAt.current ?? now,
            updatedAt: now,
            status: current.deck ? "generated" : "draft",
            step: current.deck ? 4 : (Math.min(current.step, 3) as SavedPresentation["step"]),
            form: current.form,
            templateId: current.templateId,
            qa: current.qa,
            slides: current.deck?.slides ?? null,
            photoIds: current.photos.map((photo) => photo.id),
          },
          current.photos,
        );
        exists.current = true;
        setSavedSnapshot(current);
        setSaveProblem(null);
        if (first) onFirstSave?.(presentationId);
      } catch {
        setSaveProblem("error");
      }
    })();
    saving.current = run;
    await run;
    saving.current = null;
  }, [presentationId, onFirstSave]);

  useEffect(() => {
    if (!loaded || !hasContent || snapshot === savedSnapshot) return;
    const timer = window.setTimeout(() => void flush(), SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [snapshot, savedSnapshot, loaded, hasContent, flush]);

  // Leaving (closing the tab, switching apps, another page): save right away.
  useEffect(() => {
    const now = () => void flush();
    const onVisibility = () => document.visibilityState === "hidden" && now();
    window.addEventListener("beforeunload", now);
    window.addEventListener("pagehide", now);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", now);
      window.removeEventListener("pagehide", now);
      document.removeEventListener("visibilitychange", onVisibility);
      now();
    };
  }, [flush]);

  const pending = loaded && hasContent && snapshot !== savedSnapshot;
  const saveStatus =
    saveProblem === "limit" ? (
      <span className="font-medium text-amber-700 dark:text-amber-300">
        არ ინახება: უკვე {MAX_PRESENTATIONS} პრეზენტაცია გაქვს — ძველი წაშალე
      </span>
    ) : saveProblem === "error" ? (
      <button type="button" onClick={() => void flush()} className="font-medium text-rose-600 underline-offset-2 hover:underline dark:text-rose-400">
        ვერ შეინახა — სცადე ხელახლა
      </button>
    ) : pending ? (
      <span className="inline-flex items-center gap-1 text-slate-500 dark:text-zinc-500">
        <Loader2 className="h-3 w-3 animate-spin" />
        ინახება…
      </span>
    ) : savedSnapshot ? (
      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
        <Check className="h-3 w-3" strokeWidth={2.5} />
        შენახულია
      </span>
    ) : null;

  const selectedTemplate = useMemo(
    () => TEMPLATES.find((t) => t.id === selectedTemplateId) ?? TEMPLATES[0],
    [selectedTemplateId],
  );

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const parsed = await fetchAiJson<PresentationResponse>({
        pageType: "presentation",
        responseMode: "json",
        payload: {
          topic: form.topic,
          subject: form.subject,
          slideCount: form.slideCount,
          level: form.level,
          language: form.language,
          extraInstructions: form.extraInstructions,
          qa,
          templateId: selectedTemplateId,
          // Only metadata — the images themselves never leave the browser.
          photos: photos.map(photoMeta),
        },
      });

      const layouts = assignPhotosToSlides(parsed.slides, photos);
      const slides: GeneratedSlide[] = parsed.slides.map((slide, index) => ({
        id: slide.id,
        type: slide.type,
        slideType: slide.slideType,
        title: slide.title,
        layout: slide.layout,
        body: slide.body,
        points: slide.points,
        columns: slide.columns,
        quote: slide.quote,
        figure: slide.figure,
        footnote: (slide as { footnote?: string }).footnote,
        images: layouts[index],
      }));
      // A fresh deck starts a fresh undo history.
      dispatch({ type: "reset", present: { title: parsed.title, templateId: selectedTemplate.id, slides } });
      setStep(4);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "AI ამჟამად მიუწვდომელია. გთხოვ სცადე კიდევ ერთხელ.",
      );
    } finally {
      setLoading(false);
    }
  };

  const commitDeck = useCallback((next: Deck) => dispatch({ type: "commit", next }), []);
  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  if (!loaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500 dark:text-zinc-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {storageProblem ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
          {storageProblem}
        </p>
      ) : null}
      {step < 4 && saveStatus ? <div className="flex justify-end text-xs">{saveStatus}</div> : null}
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const isDone = step > s.n;
          const isActive = step === s.n;
          const clickable = s.n < step && step < 4;
          const StepIcon = s.icon;
          return (
            <div key={s.n} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && setStep(s.n as SavedPresentation["step"])}
                className={`flex flex-col items-center gap-1.5 ${clickable ? "cursor-pointer" : "cursor-default"}`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                    isActive
                      ? "border-pink-500 bg-pink-600 text-white shadow-[0_0_0_4px_rgba(124,58,237,0.15)] dark:border-pink-400 dark:bg-pink-500"
                      : isDone
                        ? "border-pink-300 bg-pink-50 text-pink-600 dark:border-pink-400/40 dark:bg-pink-500/10 dark:text-pink-300"
                        : "border-slate-200 bg-white text-slate-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-600"
                  }`}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <StepIcon className="h-4 w-4" strokeWidth={2} />
                  )}
                </span>
                <span
                  className={`text-[11px] font-semibold ${
                    isActive
                      ? "text-pink-700 dark:text-pink-300"
                      : "text-slate-500 dark:text-zinc-500"
                  }`}
                >
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span
                  className={`mx-2 h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                    isDone ? "bg-pink-300 dark:bg-pink-500/40" : "bg-slate-200 dark:bg-white/10"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* On a phone the result step gets the width back: the slides are
          16:9 and their text scales with them. */}
      <section className={`dashboard-tool-card mt-6 rounded-[28px] sm:p-8 ${step === 4 ? "p-2" : "p-5"}`}>
        <div className={`dashboard-glass-card rounded-2xl sm:p-6 ${step === 4 ? "p-3" : "p-5"}`}>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <PresentationThinkingLoader />
              </motion.div>
            ) : (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                {step === 1 && (
                  <Step1Info
                    form={form}
                    onChange={(next) => setForm((prev) => ({ ...prev, ...next }))}
                    photos={photos}
                    onPhotosChange={setPhotos}
                  />
                )}
                {step === 2 && (
                  <Step2Templates
                    templates={TEMPLATES}
                    selectedTemplateId={selectedTemplateId}
                    onSelect={setSelectedTemplateId}
                  />
                )}
                {step === 3 && (
                  <Step3PhotosQA
                    qa={qa}
                    onQaChange={(next) => setQa((prev) => ({ ...prev, ...next }))}
                  />
                )}
                {step === 4 && deck && (
                  <Step4Result
                    deck={deck}
                    photos={photos}
                    language={form.language}
                    topic={form.topic}
                    canUndo={history.past.length > 0}
                    canRedo={history.future.length > 0}
                    onUndo={undo}
                    onRedo={redo}
                    onCommit={commitDeck}
                    onPhotosChange={setPhotos}
                    onNewPresentation={onNewPresentation}
                    saveStatus={saveStatus}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {error && !loading && (
            <div className="mt-5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
              <button className="ml-3 underline" onClick={generate}>
                კვლავ სცადე
              </button>
            </div>
          )}
        </div>

        {step < 4 && (
          <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-white/[0.08]">
            <button
              type="button"
              disabled={step === 1 || loading}
              onClick={() => setStep((s) => Math.max(1, s - 1) as SavedPresentation["step"])}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-pink-400/30 dark:hover:bg-pink-500/10 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              უკან
            </button>
            {step < 3 && (
              <button
                type="button"
                disabled={loading}
                onClick={() => setStep((s) => Math.min(3, s + 1) as SavedPresentation["step"])}
                className="inline-flex items-center gap-1.5 rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-pink-500 dark:hover:bg-pink-400"
              >
                შემდეგი
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            )}
            {step === 3 && (
              <button
                type="button"
                disabled={loading}
                onClick={generate}
                className="inline-flex items-center gap-1.5 rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-pink-500 dark:hover:bg-pink-400"
              >
                <Sparkles className="h-4 w-4" strokeWidth={2} />
                გენერაცია
              </button>
            )}
          </footer>
        )}
      </section>
    </div>
  );
}
