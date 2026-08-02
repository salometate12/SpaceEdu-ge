"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
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
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              step === n
                ? "bg-purple-500 text-white shadow-md shadow-purple-500/20"
                : "border border-white/[0.06] bg-[#161619] text-gray-500"
            }`}
          >
            Step {n}
          </span>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-white/[0.08] bg-[#121214]/40 p-8 backdrop-blur-md">
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
          <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
            <button className="ml-3 underline" onClick={generate}>
              კვლავ სცადე
            </button>
          </div>
        )}

        {loading && (
          <div className="mt-5 space-y-3">
            <AiSkeletonLoader rows={3} />
            <p className="text-sm text-zinc-400">
              {activeLoading[0]} — {activeLoading[1]}
            </p>
          </div>
        )}

        {step < 4 && (
          <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-5">
            <Button
              variant="ghost"
              disabled={step === 1 || loading}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="px-5 py-2.5"
            >
              უკან
            </Button>
            {step < 3 && (
              <button
                type="button"
                disabled={loading}
                onClick={() => setStep((s) => Math.min(3, s + 1))}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 font-medium text-white shadow-lg shadow-purple-500/10 transition-all hover:from-purple-500 hover:to-indigo-500"
              >
                შემდეგი →
              </button>
            )}
            {step === 3 && (
              <button
                type="button"
                disabled={loading}
                onClick={generate}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 font-medium text-white shadow-lg shadow-purple-500/10 transition-all hover:from-purple-500 hover:to-indigo-500"
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
