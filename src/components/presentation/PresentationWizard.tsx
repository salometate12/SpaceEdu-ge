"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileText,
  HelpCircle,
  LayoutTemplate,
  Sparkles,
} from "lucide-react";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import type { PresentationResponse } from "@/lib/ai/presentation-schema";
import { PresentationThinkingLoader } from "./PresentationThinkingLoader";
import { Step1Info } from "./Step1Info";
import { Step2Templates } from "./Step2Templates";
import { Step3PhotosQA } from "./Step3PhotosQA";
import { Step4Result } from "./Step4Result";

export interface PresentationForm {
  topic: string;
  subject: string;
  slideCount: number;
  level: string;
  language: string;
  extraInstructions: string;
}

export interface QAAnswers {
  goal: string;
  audience: string;
  tone: string;
  mainPoint: string;
}

export interface PresentationTemplate {
  id: string;
  name: string;
  desc: string;
  bg: string;
  accent: string;
  border: string;
}

export interface GeneratedSlide {
  id: number;
  type: "cover" | "content" | "image" | "stats" | "conclusion";
  slideType: string;
  title: string;
  body?: string;
  points?: string[];
  photoSlot?: string | null;
  photoBase64?: string | null;
}

interface GeneratedPresentation {
  title: string;
  slides: GeneratedSlide[];
}

const TEMPLATES: PresentationTemplate[] = [
  { id: "galaxy", name: "Galaxy", desc: "მუქი, კოსმოსური", bg: "#0f0520", accent: "#a78bfa", border: "#7C3AED" },
  { id: "ocean", name: "Ocean", desc: "ლურჯი, სუფთა", bg: "#021825", accent: "#22d3ee", border: "#22d3ee" },
  { id: "forest", name: "Forest", desc: "მწვანე, ორგანული", bg: "#021a0e", accent: "#22c55e", border: "#22c55e" },
  { id: "sunset", name: "Sunset", desc: "ნარინჯი, თბილი", bg: "#1c0f00", accent: "#f59e0b", border: "#f59e0b" },
  { id: "minimal", name: "Minimal", desc: "თეთრი, მინიმალური", bg: "#ffffff", accent: "#7C3AED", border: "#e2e8f0" },
  { id: "bold", name: "Bold Purple", desc: "მეწამული, თამამი", bg: "#7C3AED", accent: "#ffffff", border: "#5b21b6" },
];

const STEPS = [
  { n: 1, label: "ინფო", icon: FileText },
  { n: 2, label: "დიზაინი", icon: LayoutTemplate },
  { n: 3, label: "დეტალები", icon: HelpCircle },
  { n: 4, label: "შედეგი", icon: Sparkles },
] as const;

export function PresentationWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<PresentationForm>({
    topic: "",
    subject: "",
    slideCount: 10,
    level: "უნივერსიტეტი",
    language: "ქართული",
    extraInstructions: "",
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState("galaxy");
  const [qa, setQa] = useState<QAAnswers>({
    goal: "ცნების განმარტება",
    audience: "პროფესორი",
    tone: "აკადემიური",
    mainPoint: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedPresentation | null>(null);

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
        },
      });

      setGenerated({
        title: parsed.title,
        slides: parsed.slides.map((slide) => ({ ...slide, photoBase64: null })),
      });
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

  const reset = () => {
    setStep(1);
    setGenerated(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
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
                onClick={() => clickable && setStep(s.n)}
                className={`flex flex-col items-center gap-1.5 ${clickable ? "cursor-pointer" : "cursor-default"}`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                    isActive
                      ? "border-violet-500 bg-violet-600 text-white shadow-[0_0_0_4px_rgba(124,58,237,0.15)] dark:border-violet-400 dark:bg-violet-500"
                      : isDone
                        ? "border-violet-300 bg-violet-50 text-violet-600 dark:border-violet-400/40 dark:bg-violet-500/10 dark:text-violet-300"
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
                      ? "text-violet-700 dark:text-violet-300"
                      : "text-slate-500 dark:text-zinc-500"
                  }`}
                >
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span
                  className={`mx-2 h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                    isDone ? "bg-violet-300 dark:bg-violet-500/40" : "bg-slate-200 dark:bg-white/10"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <section className="dashboard-tool-card mt-6 rounded-[28px] p-5 sm:p-8">
        <div className="dashboard-glass-card rounded-2xl p-5 sm:p-6">
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
                {step === 4 && generated && (
                  <Step4Result
                    title={generated.title}
                    slides={generated.slides}
                    template={selectedTemplate}
                    onReset={reset}
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
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-violet-400/30 dark:hover:bg-violet-500/10 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              უკან
            </button>
            {step < 3 && (
              <button
                type="button"
                disabled={loading}
                onClick={() => setStep((s) => Math.min(3, s + 1))}
                className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-500 dark:hover:bg-violet-400"
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
                className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-500 dark:hover:bg-violet-400"
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
