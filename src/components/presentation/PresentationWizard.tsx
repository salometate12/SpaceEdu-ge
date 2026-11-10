"use client";

import { logActivity } from "@/lib/activity-log";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Settings2, Sparkles } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { StepperBar } from "@/components/ui/StepperBar";
import { StepFooter } from "@/components/ui/wizard/StepFooter";
import { WizardColumns } from "@/components/ui/wizard/WizardPage";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import type { PresentationResponse } from "@/lib/ai/presentation-schema";
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
import { autoStartLabel, DEFAULT_PRESENTATION_FORM as DEFAULT_FORM, DEFAULT_PRESENTATION_QA as DEFAULT_QA, wizardFromHandoff } from "@/lib/presentation-wizard-fill";

export type { GeneratedSlide, PresentationForm, PresentationTemplate, QAAnswers } from "@/lib/presentation-types";

const STEPS = [{ label: "ინფორმაცია" }, { label: "დიზაინი" }, { label: "დეტალები" }, { label: "შედეგი" }];

const SAVE_DELAY_MS = 800;


/** What generating sends: the wizard's state, or a handoff's before it's on screen. */
interface GenerateInput {
  form: PresentationForm;
  qa: QAAnswers;
  templateId: string;
  photos: UploadedPhoto[];
}

const AUTO_FAILED = "ავტომატურად ვერ შეიქმნა, შეამოწმე და სცადე თავიდან.";

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
  // „ჩემი საგნები“: the subject (and topic) it was made for (opened from a topic or an assignment, or saved with one).
  const link = useRef<{ subjectId: string; topicId?: string } | null>(null);
  // The assignment it was made from („დავალების დამხმარე“).
  const sourceTaskId = useRef<string | null>(null);
  // Generating straight from a handoff: the line above the loader (null otherwise).
  const [autoLabel, setAutoLabel] = useState<string | null>(null);
  // It failed on its own: the message goes above the steps, where it's seen.
  const [autoFailed, setAutoFailed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);
  const [storageProblem, setStorageProblem] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    loadPresentation(presentationId)
      .then((saved) => {
        if (!active) return;
        if (saved) {
          const { presentation } = saved;
          createdAt.current = presentation.createdAt;
          if (presentation.subjectId) link.current = { subjectId: presentation.subjectId, ...(presentation.topicId ? { topicId: presentation.topicId } : {}) };
          sourceTaskId.current = presentation.sourceTaskId ?? null;
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
          // A new one opened from another tool (the task helper, a topic, a conspectus): every step filled in.
          const handed = takePresentationHandoff();
          if (handed?.subjectId) link.current = { subjectId: handed.subjectId, ...(handed.topicId ? { topicId: handed.topicId } : {}) };
          if (handed?.source) sourceTaskId.current = handed.source.id;
          if (handed) {
            const fill = wizardFromHandoff(handed);
            setForm(fill.form);
            setQa(fill.qa);
            setSelectedTemplateId(fill.templateId);
            // „დავალების დამხმარე“: no steps, straight to generating.
            if (handed.autoStart) {
              setAutoLabel(autoStartLabel(fill, handed.source?.kind === "task-helper"));
              void runGenerate({ ...fill, photos: [] }, true);
            }
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
            ...(link.current ?? {}),
            ...(sourceTaskId.current ? { sourceTaskId: sourceTaskId.current } : {}),
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

  /** `auto`: started from a handoff; a failure opens the steps with what was filled in. */
  async function runGenerate(input: GenerateInput, auto = false) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setAutoFailed(false);
    try {
      const parsed = await fetchAiJson<PresentationResponse>({
        pageType: "presentation",
        responseMode: "json",
        signal: controller.signal,
        payload: {
          topic: input.form.topic,
          subject: input.form.subject,
          slideCount: input.form.slideCount,
          level: input.form.level,
          language: input.form.language,
          extraInstructions: input.form.extraInstructions,
          qa: input.qa,
          templateId: input.templateId,
          // Only metadata — the images themselves never leave the browser.
          photos: input.photos.map(photoMeta),
        },
      });
      if (controller.signal.aborted) return;

      const layouts = assignPhotosToSlides(parsed.slides, input.photos);
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
        ...(slide.notes?.trim() ? { notes: slide.notes.trim() } : {}),
        images: layouts[index],
      }));
      // A fresh deck starts a fresh undo history.
      dispatch({ type: "reset", present: { title: parsed.title, templateId: input.templateId, slides } });
      logActivity({ type: "presentation_created", tool: "presentation", meta: { slides: slides.length } });
      setAutoLabel(null);
      setStep(4);
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : "AI ამჟამად მიუწვდომელია. გთხოვ სცადე კიდევ ერთხელ.";
      if (auto) {
        // The steps, filled in, with what went wrong.
        setAutoLabel(null);
        setStep(1);
        setAutoFailed(true);
        setError(`${AUTO_FAILED} ${message}`);
      } else {
        setError(message);
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  }

  const generate = () => runGenerate({ form, qa, templateId: selectedTemplateId, photos });

  /** „პარამეტრების შეცვლა“: stops generating and opens the steps, filled in. */
  const changeSettings = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setAutoLabel(null);
    setStep(1);
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

  if (autoLabel && loading) {
    return (
      <div className="flex flex-col gap-5">
        {storageProblem ? <Alert tone="warning">{storageProblem}</Alert> : null}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[20px] border border-[#ece9e4] bg-white px-4 py-3 dark:border-[#26262e] dark:bg-[#15151b]">
          <span className="flex min-w-0 flex-1 basis-[18rem] items-center gap-2 text-[14px] font-medium text-[#44403c] dark:text-zinc-300">
            <Sparkles className="h-4 w-4 shrink-0 text-[#e11d74]" aria-hidden />
            <span className="min-w-0">{autoLabel}</span>
          </span>
          <button type="button" onClick={changeSettings} className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-[#be185d] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 dark:text-pink-300">
            <Settings2 className="h-4 w-4" aria-hidden />
            პარამეტრების შეცვლა
          </button>
        </div>
        <PresentationThinkingLoader />
      </div>
    );
  }

  const errorBox =
    error && !loading ? (
      <Alert
        tone="error"
        className={autoFailed ? "" : "mt-5"}
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
      {autoFailed ? errorBox : null}
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
              {autoFailed ? null : errorBox}
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
