"use client";

import { logActivity } from "@/lib/activity-log";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { StepperBar } from "@/components/ui/StepperBar";
import { StepFooter } from "@/components/ui/wizard/StepFooter";
import { WizardColumns } from "@/components/ui/wizard/WizardPage";
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
import { normalizeAudience, Step3PhotosQA } from "./Step3PhotosQA";
import { Step4Result } from "./Step4Result";
import { PresentationSummary } from "./PresentationSummary";
import { takePresentationHandoff } from "@/lib/tool-handoff";

export type { GeneratedSlide, PresentationForm, PresentationTemplate, QAAnswers } from "@/lib/presentation-types";

const STEPS = [{ label: "ინფორმაცია" }, { label: "დიზაინი" }, { label: "დეტალები" }, { label: "შედეგი" }];

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
  /** After each successful save (the page shows „შენახულია“ for a moment). */
  onSaved?: () => void;
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

export function PresentationWizard({ presentationId, onFirstSave, onNewPresentation, onSaved }: PresentationWizardProps) {
  const onSavedRef = useRef(onSaved);
  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);
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
          setQa({ ...DEFAULT_QA, ...presentation.qa, audience: normalizeAudience(presentation.qa?.audience ?? DEFAULT_QA.audience) });
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
        } else {
          // A new one opened from another tool (the task helper): its first step filled in.
          const handed = takePresentationHandoff();
          if (handed) {
            setForm({
              ...DEFAULT_FORM,
              topic: handed.topic,
              subject: handed.subject ?? "",
              slideCount: handed.slideCount ?? DEFAULT_FORM.slideCount,
              extraInstructions: handed.extraInstructions ?? "",
            });
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
        onSavedRef.current?.();
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
        არ ინახება: უკვე {MAX_PRESENTATIONS} პრეზენტაცია გაქვს, ძველი წაშალე
      </span>
    ) : saveProblem === "error" ? (
      <button type="button" onClick={() => void flush()} className="font-medium text-rose-600 underline-offset-2 hover:underline dark:text-rose-400">
        ვერ შეინახა. სცადე ხელახლა
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
      logActivity({ type: "presentation_created", tool: "presentation", meta: { slides: slides.length } });
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

  const editorStep = step === 4 && Boolean(deck) && !loading;

  if (!loaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500 dark:text-zinc-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const back = () => setStep((s) => Math.max(1, s - 1) as SavedPresentation["step"]);
  const next = () => (step === 3 ? void generate() : setStep((s) => Math.min(3, s + 1) as SavedPresentation["step"]));

  const body = (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
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
            <Step1Info form={form} onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))} photos={photos} onPhotosChange={setPhotos} />
          )}
          {step === 2 && <Step2Templates templates={TEMPLATES} selectedTemplateId={selectedTemplateId} onSelect={setSelectedTemplateId} />}
          {step === 3 && <Step3PhotosQA qa={qa} onQaChange={(patch) => setQa((prev) => ({ ...prev, ...patch }))} />}
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
  );

  const errorBox =
    error && !loading ? (
      <Alert
        tone="error"
        className="mt-5"
        action={
          <button type="button" onClick={() => void generate()} className="wz-secondary h-10 px-4 text-[14px]">
            კვლავ სცადე
          </button>
        }
      >
        {error}
      </Alert>
    ) : null;

  return (
    <div className="flex flex-col gap-5">
      {storageProblem ? <Alert tone="warning">{storageProblem}</Alert> : null}
      {/* Only a problem with saving is shown here; a good save is the page's „შენახულია“. */}
      {step < 4 && saveProblem ? <div className="flex justify-end text-[13px]">{saveStatus}</div> : null}
      <StepperBar steps={STEPS} current={step} onStep={step < 4 ? (n) => setStep(n as SavedPresentation["step"]) : undefined} />

      {editorStep ? (
        <section>
          {body}
          {errorBox}
        </section>
      ) : (
        <WizardColumns
          form={
            <>
              {body}
              {errorBox}
              {step < 4 && !loading ? (
                <StepFooter
                  step={step}
                  total={STEPS.length}
                  onBack={back}
                  onNext={next}
                  nextLabel={step === 3 ? "პრეზენტაციის შექმნა" : "შემდეგი"}
                  final={step === 3}
                />
              ) : null}
            </>
          }
          panel={step < 4 && !loading ? <PresentationSummary form={form} template={selectedTemplate} qa={qa} step={step} /> : undefined}
        />
      )}
    </div>
  );
}
