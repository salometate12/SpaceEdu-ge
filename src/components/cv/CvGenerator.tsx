"use client";

import { useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { ArrowLeft, Check, Download, FileText, Loader2, Maximize2, RotateCcw, X } from "lucide-react";
import { CvSheetFrame } from "./CvSheetFrame";
import { exportCvPdf } from "@/lib/exportCvPdf";
import { A4_HEIGHT_PX, A4_WIDTH_PX } from "@/lib/cv-sheet";

/** The one plain card steps 1–3 sit on (as on /presentation, PR #139). */
const SURFACE =
  "rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)] sm:p-8";
import { AiSkeletonLoader } from "@/components/ui/AiSkeletonLoader";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import { recordCvUpdate } from "@/lib/dashboard-metrics";
import type { CvResponse } from "@/lib/ai/cv-schema";

type WizardStep = 1 | 2 | 3 | 4;
type CvTemplate = "minimal-tech" | "creative-ui" | "academic-corporate";
type OptimizationPill = "ats" | "internship";

const STEPS: Array<{ id: WizardStep; label: string }> = [
  { id: 1, label: "კონტაქტი & ფოტო" },
  { id: 2, label: "განათლება & გამოცდილება" },
  { id: 3, label: "უნარები & თულები" },
  { id: 4, label: "ტემპლეიტი & შედეგი" },
];

const TEMPLATES: Array<{
  id: CvTemplate;
  title: string;
  subtitle: string;
  /** The template's accent, for the dot on its chip. */
  dot: string;
}> = [
  {
    id: "minimal-tech",
    title: "Minimal Tech",
    subtitle: "სუფთა სტილი დეველოპერებისთვის",
    dot: "#f9a8d4",
  },
  {
    id: "creative-ui",
    title: "Creative UI/UX",
    subtitle: "თანამედროვე დიზაინი კრეატიული პროფილებისთვის",
    dot: "#67e8f9",
  },
  {
    id: "academic-corporate",
    title: "Academic Corporate",
    subtitle: "სტაბილური, აკადემიური და პროფესიული ტონი",
    dot: "#6ee7b7",
  },
];

export function CvGenerator() {
  const [step, setStep] = useState<WizardStep>(1);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [portfolio, setPortfolio] = useState("");

  const [university, setUniversity] = useState("");
  const [degree, setDegree] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [experienceText, setExperienceText] = useState("");

  const [toolInput, setToolInput] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [softSkills, setSoftSkills] = useState("");
  const [optimizationPills, setOptimizationPills] = useState<Record<OptimizationPill, boolean>>({
    ats: true,
    internship: true,
  });

  const [selectedTemplate, setSelectedTemplate] = useState<CvTemplate>("minimal-tech");
  const [generated, setGenerated] = useState(false);
  const [summary, setSummary] = useState("");
  const [headline, setHeadline] = useState("");
  const [experienceBullets, setExperienceBullets] = useState<string[]>([]);
  const [highlightedSkills, setHighlightedSkills] = useState<string[]>([]);
  const [optimizationTips, setOptimizationTips] = useState<string[]>([]);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);

  const templateStyle = useMemo(() => {
    if (selectedTemplate === "creative-ui") {
      return {
        pageBg: "bg-[linear-gradient(135deg,#0d1021_0%,#101a2a_45%,#1e1030_100%)]",
        accent: "text-cyan-300",
      };
    }
    if (selectedTemplate === "academic-corporate") {
      return {
        pageBg: "bg-[linear-gradient(135deg,#101219_0%,#10161f_40%,#1b2018_100%)]",
        accent: "text-emerald-300",
      };
    }
    return {
      pageBg: "bg-[linear-gradient(135deg,#121023_0%,#1a102a_40%,#22103a_100%)]",
      accent: "text-pink-300",
    };
  }, [selectedTemplate]);

  const previewName = fullName.trim() || "SpaceEdu Candidate";
  const previewPosition = degree.trim() || "Entry-level profile";

  const onPhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

  const commitToolInput = () => {
    const next = toolInput.trim();
    if (!next) return;
    if (!tools.includes(next)) {
      setTools((prev) => [...prev, next]);
    }
    setToolInput("");
  };

  const onToolInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitToolInput();
    }
  };

  const buildSummary = async () => {
    setCvLoading(true);
    setCvError(null);

    try {
      const data = await fetchAiJson<CvResponse>({
        pageType: "cv",
        responseMode: "json",
        payload: {
          profile: {
            fullName: previewName,
            email,
            phone,
            portfolio,
            university,
            degree,
            graduationYear,
            experienceText,
            tools,
            softSkills,
            template: selectedTemplate,
            optimizationPills,
          },
        },
      });
      setSummary(data.professionalSummary);
      setHeadline(data.headline);
      setExperienceBullets(data.experienceBullets);
      setHighlightedSkills(data.highlightedSkills);
      setOptimizationTips(data.optimizationTips);
      setGenerated(true);
      setStep(4);
      recordCvUpdate();
    } catch (err) {
      setCvError(
        err instanceof Error
          ? err.message
          : "AI ამჟამად მიუწვდომელია. სცადე კიდევ ერთხელ.",
      );
    } finally {
      setCvLoading(false);
    }
  };

  const goNext = () => {
    if (step === 1) setStep(2);
    if (step === 2) setStep(3);
    if (step === 3) void buildSummary();
  };

  const goBack = () => {
    if (step === 4) setStep(3);
    if (step === 3) setStep(2);
    if (step === 2) setStep(1);
  };

  const sheetRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [bigView, setBigView] = useState(false);

  const exportPdf = async () => {
    if (!sheetRef.current) return;
    setExporting(true);
    setExportError(false);
    try {
      await exportCvPdf(sheetRef.current, `CV — ${previewName}`);
    } catch (error) {
      console.error("CV PDF export failed", error);
      setExportError(true);
    } finally {
      setExporting(false);
    }
  };

  const startOver = () => {
    setStep(1);
    setGenerated(false);
    setSummary("");
    setHeadline("");
    setExperienceBullets([]);
    setHighlightedSkills([]);
    setOptimizationTips([]);
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-pink-400/50 dark:focus:ring-pink-500/10";
  const labelClass = "text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500";

  /** The A4 sheet. Only the copy in the page carries the ref the PDF export captures. */
  const renderSheet = (forExport: boolean) => (
      <div
        ref={forExport ? sheetRef : undefined}
        data-cv-sheet={forExport ? "" : undefined}
        className={`p-10 ${templateStyle.pageBg}`}
        style={{ width: A4_WIDTH_PX, minHeight: A4_HEIGHT_PX }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.12] pb-4">
          <div>
            <h3 className={`text-2xl font-semibold ${templateStyle.accent}`}>{previewName}</h3>
            <p className="mt-1 text-sm text-zinc-300">
              {generated && headline ? headline : previewPosition}
            </p>
            <p className="text-xs text-zinc-400">{email || "candidate@spaceedu.ge"}</p>
            <p className="text-xs text-zinc-500">{phone || "+995 --- -- -- --"}</p>
            {portfolio && <p className="text-xs text-zinc-400">{portfolio}</p>}
          </div>
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Profile"
              className="h-24 w-24 shrink-0 rounded-xl border border-white/[0.15] object-cover"
            />
          )}
        </div>

        <div className="mt-4 space-y-4">
          <section>
            <p className="text-xs uppercase tracking-wide text-zinc-400">Education</p>
            <p className="mt-1 text-sm text-zinc-200">
              {university || "University Name"} — {degree || "Degree"}
              {graduationYear ? ` (${graduationYear})` : ""}
            </p>
          </section>
          <section>
            <p className="text-xs uppercase tracking-wide text-zinc-400">Experience</p>
            {generated && experienceBullets.length > 0 ? (
              <ul className="mt-1 list-disc space-y-1 pl-4 text-sm leading-6 text-zinc-200">
                {experienceBullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm leading-6 text-zinc-200">
                {experienceText || "გამოცდილება გამოჩნდება გენერაციის შემდეგ."}
              </p>
            )}
          </section>
          <section>
            <p className="text-xs uppercase tracking-wide text-zinc-400">Tools</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(generated && highlightedSkills.length > 0
                ? highlightedSkills
                : tools.length > 0
                  ? tools
                  : ["Figma", "Next.js", "Tailwind"]
              ).map((tool) => (
                <span
                  key={tool}
                  className="rounded-full border border-white/[0.12] bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-200"
                >
                  {tool}
                </span>
              ))}
            </div>
          </section>
          <section>
            <p className="text-xs uppercase tracking-wide text-zinc-400">AI Summary</p>
            <p className="mt-1 text-sm leading-6 text-zinc-200">
              {generated
                ? summary
                : "CV-ს გენერირების შემდეგ აქ გამოჩნდება ოპტიმიზებული ტექსტი."}
            </p>
            {generated && optimizationTips.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                {optimizationTips.map((tip) => (
                  <li key={tip}>• {tip}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
  );

  const stepCircle = (id: WizardStep) =>
    step === id
      ? "border-pink-500 bg-pink-600 text-white shadow-[0_0_0_4px_rgba(236,72,153,0.15)] dark:border-pink-400 dark:bg-pink-500"
      : id < step
        ? "border-pink-300 bg-pink-50 text-pink-600 dark:border-pink-400/40 dark:bg-pink-500/10 dark:text-pink-300"
        : "border-slate-200 bg-white text-slate-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-500";
  const pill = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-medium transition ${
      on
        ? "border-pink-300 bg-pink-50 text-pink-700 dark:border-pink-400/40 dark:bg-pink-500/10 dark:text-pink-300"
        : "border-[var(--border)] bg-[var(--bg-card)] text-slate-500 hover:border-pink-200 hover:text-pink-700 dark:text-zinc-400 dark:hover:border-pink-400/30 dark:hover:text-white"
    }`;
  const secondaryBtn =
    "inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-pink-300 hover:text-pink-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-300 dark:hover:border-pink-400/30 dark:hover:text-white";
  const primaryBtn =
    "inline-flex items-center gap-1.5 rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-pink-500 dark:hover:bg-pink-400";
  const activeTemplate = TEMPLATES.find((template) => template.id === selectedTemplate) ?? TEMPLATES[0];

  return (
    <section className="space-y-6">
      {/* Steps — outside the card. On a phone only the numbers fit, with
          the current step's name under them. */}
      <nav aria-label="CV-ის ნაბიჯები">
        <ol className="flex items-start">
          {STEPS.map((item, index) => (
            <li key={item.id} className="flex flex-1 items-start last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setStep(item.id)}
                  aria-current={step === item.id ? "step" : undefined}
                  aria-label={`${item.id}. ${item.label}`}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition ${stepCircle(item.id)}`}
                >
                  {item.id < step ? <Check className="h-4 w-4" strokeWidth={2.5} /> : item.id}
                </button>
                <span
                  className={`hidden max-w-[9rem] text-center text-[11px] font-semibold sm:block ${
                    step === item.id ? "text-pink-700 dark:text-pink-300" : "text-slate-500 dark:text-zinc-500"
                  }`}
                >
                  {item.label}
                </span>
              </div>
              {index < STEPS.length - 1 ? (
                <span
                  className={`mx-2 mt-[17px] h-0.5 flex-1 rounded-full ${
                    item.id < step ? "bg-pink-300 dark:bg-pink-500/40" : "bg-slate-200 dark:bg-white/10"
                  }`}
                />
              ) : null}
            </li>
          ))}
        </ol>
        <p className="mt-2 text-center text-xs font-semibold text-pink-700 sm:hidden dark:text-pink-300">
          ნაბიჯი {step}/{STEPS.length} · {STEPS[step - 1].label}
        </p>
      </nav>

      {step < 4 ? (
        <div className={SURFACE}>
          {step === 1 && (
            <div className="grid gap-4 lg:grid-cols-[120px_1fr]">
              <label className="cursor-pointer space-y-2">
                <span className={`block ${labelClass}`}>ფოტოს დამატება (არასავალდებულო)</span>
                <div className="flex h-24 w-24 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 transition-all hover:border-pink-300 hover:bg-pink-50 dark:border-white/20 dark:bg-white/[0.03] dark:hover:border-pink-400/40 dark:hover:bg-pink-500/10">
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local data URL
                    <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-zinc-500">ფოტო</span>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className={labelClass}>სრული სახელი</span>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className={labelClass}>Email</span>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className={labelClass}>ტელეფონი</span>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className={labelClass}>LinkedIn / Portfolio</span>
                  <input
                    value={portfolio}
                    onChange={(event) => setPortfolio(event.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">
                განათლება & გამოცდილება
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className={labelClass}>University</span>
                  <input
                    value={university}
                    onChange={(event) => setUniversity(event.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className={labelClass}>Graduation Year</span>
                  <input
                    value={graduationYear}
                    onChange={(event) => setGraduationYear(event.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="space-y-1 text-sm sm:col-span-3">
                  <span className={labelClass}>Degree</span>
                  <input
                    value={degree}
                    onChange={(event) => setDegree(event.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2.5 text-xs text-slate-600 dark:text-zinc-400">
                🤖 მოკლედ აღწერე სად მუშაობდი ან რა პროექტები გაქვს გაკეთებული, AI მათ
                პროფესიონალურ პუნქტებად გადააქცევს.
              </div>
              <textarea
                value={experienceText}
                onChange={(event) => setExperienceText(event.target.value)}
                className={`min-h-32 ${inputClass}`}
                placeholder="მაგ: ვიმუშავე სტუდენტურ პროექტზე..."
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">
                უნარები & თულები
              </h2>
              <label className="space-y-1 text-sm">
                <span className={labelClass}>Software & Tools</span>
                <input
                  value={toolInput}
                  onChange={(event) => setToolInput(event.target.value)}
                  onBlur={commitToolInput}
                  onKeyDown={onToolInputKeyDown}
                  placeholder="მაგ: Figma, Next.js, Tailwind, Cursor, Git"
                  className={inputClass}
                />
              </label>

              {tools.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tools.map((tool) => (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => setTools((prev) => prev.filter((item) => item !== tool))}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 transition hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 dark:border-white/10 dark:bg-white/[0.02] dark:text-zinc-300 dark:hover:border-pink-400/30 dark:hover:bg-pink-500/10 dark:hover:text-white"
                    >
                      {tool} ✕
                    </button>
                  ))}
                </div>
              )}

              <label className="space-y-1 text-sm">
                <span className={labelClass}>Personal Skills</span>
                <textarea
                  value={softSkills}
                  onChange={(event) => setSoftSkills(event.target.value)}
                  placeholder="მაგ: კოლაბორაცია, პრობლემების გადაჭრა..."
                  className={`min-h-24 ${inputClass}`}
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setOptimizationPills((prev) => ({ ...prev, ats: !prev.ats }))
                  }
                  className={pill(optimizationPills.ats)}
                >
                  + ATS ოპტიმიზაცია
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setOptimizationPills((prev) => ({ ...prev, internship: !prev.internship }))
                  }
                  className={pill(optimizationPills.internship)}
                >
                  + სტაჟირებისთვის მორგება
                </button>
              </div>
            </div>
          )}

          {cvError && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/70 px-3.5 py-2.5 text-xs text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
              {cvError}
            </div>
          )}
          {cvLoading && step === 3 && <AiSkeletonLoader rows={2} className="mt-4" />}

          <footer className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
            <button type="button" onClick={goBack} disabled={step === 1 || cvLoading} className={secondaryBtn}>
              უკან
            </button>
            <button type="button" onClick={goNext} disabled={cvLoading} className={primaryBtn}>
              {step === 3 ? (cvLoading ? "იტვირთება..." : "CV-ს გენერირება") : "შემდეგი"}
            </button>
          </footer>
        </div>
      ) : (
        <div>
          {/* Result: no card. A header row over a divider, then the sheet. */}
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-pink-100 bg-pink-50 text-pink-600 dark:border-pink-400/15 dark:bg-pink-500/10 dark:text-pink-400">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h2 className="headline text-xl font-semibold text-slate-900 dark:text-zinc-100">შენი CV</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">{activeTemplate.title} · A4</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void exportPdf()} disabled={exporting} className={primaryBtn}>
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" strokeWidth={1.75} />}
                PDF ექსპორტი
              </button>
              <button type="button" onClick={() => setStep(3)} className={secondaryBtn}>
                <ArrowLeft className="h-4 w-4" />
                უკან რედაქტირებაზე
              </button>
              <button type="button" onClick={startOver} className={secondaryBtn}>
                <RotateCcw className="h-4 w-4" />
                ახალი CV
              </button>
            </div>
          </header>
          {exportError ? (
            <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50/70 px-3.5 py-2.5 text-xs text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
              PDF ვერ შეიქმნა. სცადე ხელახლა.
            </p>
          ) : null}

          <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[200px_minmax(0,1fr)]">
            {/* Templates: chips in a row on phones/tablets, a narrow column on desktop. */}
            <div className="min-w-0">
              <p className={`mb-2 ${labelClass}`}>ტემპლეიტი</p>
              <div
                role="radiogroup"
                aria-label="ტემპლეიტი"
                className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
              >
                {TEMPLATES.map((template) => {
                  const active = selectedTemplate === template.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      title={template.subtitle}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-full border bg-[var(--bg-card)] px-3.5 py-2 text-left text-sm font-medium transition lg:w-full ${
                        active
                          ? "border-pink-400 text-pink-700 dark:border-pink-400/60 dark:text-pink-300"
                          : "border-[var(--border)] text-slate-700 hover:border-pink-200 dark:text-zinc-300 dark:hover:border-pink-400/30"
                      }`}
                    >
                      <span className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: template.dot }} />
                      <span className="whitespace-nowrap">{template.title}</span>
                      {active ? <Check className="ml-auto h-4 w-4 shrink-0" strokeWidth={2.5} /> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-w-0">
              <CvSheetFrame>{renderSheet(true)}</CvSheetFrame>
              <div className="mt-3 flex justify-center">
                <button type="button" onClick={() => setBigView(true)} className={secondaryBtn}>
                  <Maximize2 className="h-4 w-4" />
                  დიდი ნახვა
                </button>
              </div>
            </div>
          </div>

          {bigView ? (
            <div role="dialog" aria-modal="true" aria-label="CV — დიდი ნახვა" className="fixed inset-0 z-[120] overflow-auto bg-black/80 p-4 pt-[calc(env(safe-area-inset-top)+3.5rem)]">
              <button
                type="button"
                onClick={() => setBigView(false)}
                aria-label="დახურვა"
                className="fixed right-4 top-[calc(env(safe-area-inset-top)+0.75rem)] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg"
              >
                <X className="h-5 w-5" />
              </button>
              {/* Full size: scroll and pinch-zoom like any page. */}
              <div className="mx-auto w-max shadow-2xl">
                <CvSheetFrame fit={false}>{renderSheet(false)}</CvSheetFrame>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
