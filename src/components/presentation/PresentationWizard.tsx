"use client";

import { useMemo, useState } from "react";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import type { PresentationResponse } from "@/lib/ai/presentation-schema";
import { AiSkeletonLoader } from "@/components/ui/AiSkeletonLoader";
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

const LOADING_MESSAGES = [
  ["Q&A-ს ამუშავებს...", "შენი პასუხების ანალიზი"],
  ["სტრუქტურას ქმნის...", "სლაიდების გეგმა"],
  ["შინაარსს ავსებს...", "AI ტექსტის გენერაცია"],
  ["ფოტოებს ათავსებს...", "სლაიდებში ინტეგრაცია"],
  ["დიზაინს აწყობს...", "Template-ის გამოყენება"],
  ["საბოლოო შეხება...", "თითქმის მზადაა!"],
];

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
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedPresentation | null>(null);

  const selectedTemplate = useMemo(
    () => TEMPLATES.find((t) => t.id === selectedTemplateId) ?? TEMPLATES[0],
    [selectedTemplateId],
  );

  const activeLoading = LOADING_MESSAGES[loadingIndex % LOADING_MESSAGES.length];

  const generate = async () => {
    setLoading(true);
    setError(null);
    const timer = setInterval(
      () => setLoadingIndex((prev) => (prev + 1) % LOADING_MESSAGES.length),
      700,
    );
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
      clearInterval(timer);
      setLoading(false);
      setLoadingIndex(0);
    }
  };

  const reset = () => {
    setStep(1);
    setGenerated(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              step === n
                ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-zinc-950"
                : "border border-slate-200 bg-white text-slate-500 dark:border-white/[0.06] dark:bg-[#161619] dark:text-gray-500"
            }`}
          >
            Step {n}
          </span>
        ))}
      </div>

      <section className="dashboard-tool-card mt-6 rounded-[28px] p-5 sm:p-8">
        <div className="dashboard-glass-card rounded-2xl p-5 sm:p-6">
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

          {error && (
            <div className="mt-5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
              <button className="ml-3 underline" onClick={generate}>
                კვლავ სცადე
              </button>
            </div>
          )}

          {loading && (
            <div className="mt-5 space-y-3">
              <AiSkeletonLoader rows={3} />
              <p className="text-sm text-slate-600 dark:text-zinc-400">
                {activeLoading[0]} — {activeLoading[1]}
              </p>
            </div>
          )}
        </div>

        {step < 4 && (
          <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-white/[0.08]">
            <button
              type="button"
              disabled={step === 1 || loading}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-violet-400/30 dark:hover:bg-violet-500/10 dark:hover:text-white"
            >
              უკან
            </button>
            {step < 3 && (
              <button
                type="button"
                disabled={loading}
                onClick={() => setStep((s) => Math.min(3, s + 1))}
                className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-500 dark:hover:bg-violet-400"
              >
                შემდეგი →
              </button>
            )}
            {step === 3 && (
              <button
                type="button"
                disabled={loading}
                onClick={generate}
                className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-500 dark:hover:bg-violet-400"
              >
                გენერაცია
              </button>
            )}
          </footer>
        )}
      </section>
    </div>
  );
}
