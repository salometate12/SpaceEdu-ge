"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ChangeEvent, type KeyboardEvent } from "react";
import { ArrowLeft, Check, Download, FileText, Lightbulb, Loader2, Maximize2, RefreshCw, RotateCcw, X } from "lucide-react";
import { UploadIconBadge } from "@/components/ui/UploadDropzone";
import { AiSkeletonLoader } from "@/components/ui/AiSkeletonLoader";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import { recordCvUpdate } from "@/lib/dashboard-metrics";
import type { CvResponse } from "@/lib/ai/cv-schema";
import { A4_HEIGHT_PX, A4_WIDTH_PX } from "@/lib/cv-sheet";
import { accentColor, CV_TEMPLATE_INFO, showsPhoto, splitList, visibleSections, type CvData, type CvLanguage, type CvPrefs } from "@/lib/cv-data";
import { readCvPrefs, resolveCvPrefs, serverCvPrefs, subscribeCvPrefs, writeCvPrefs } from "@/lib/cv-prefs";
import { pageCount, paginateSheet } from "@/lib/cv-paginate";
import { CvSheetFrame } from "./CvSheetFrame";
import { CvTemplatePicker, LanguageSwitch } from "./CvTemplatePicker";
import { CV_TEMPLATE_COMPONENTS } from "./templates";
import { downloadCvPdf } from "./pdf/downloadCvPdf";

/** The one plain card steps 1–3 sit on (as on /presentation, PR #139). */
const SURFACE =
  "rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)] sm:p-8";

type WizardStep = 1 | 2 | 3 | 4;
type OptimizationPill = "ats" | "internship";

const STEPS: Array<{ id: WizardStep; label: string }> = [
  { id: 1, label: "კონტაქტი & ფოტო" },
  { id: 2, label: "განათლება & გამოცდილება" },
  { id: 3, label: "უნარები & თულები" },
  { id: 4, label: "ტემპლეიტი & შედეგი" },
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

  // Template, colour, photo and language: remembered in this browser.
  const storedPrefs = useSyncExternalStore(subscribeCvPrefs, readCvPrefs, serverCvPrefs);
  const [generated, setGenerated] = useState(false);
  const [summary, setSummary] = useState("");
  const [headline, setHeadline] = useState("");
  const [experienceBullets, setExperienceBullets] = useState<string[]>([]);
  const [highlightedSkills, setHighlightedSkills] = useState<string[]>([]);
  const [optimizationTips, setOptimizationTips] = useState<string[]>([]);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const [generatedLanguage, setGeneratedLanguage] = useState<CvLanguage | null>(null);
  const prefs = resolveCvPrefs(storedPrefs, optimizationPills.ats);
  const updatePrefs = (next: Partial<CvPrefs> & { chosen?: boolean }) => writeCvPrefs(next);

  const previewName = fullName.trim() || "SpaceEdu Candidate";

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
            template: prefs.template,
            language: prefs.language,
            optimizationPills,
          },
        },
      });
      setSummary(data.professionalSummary);
      setHeadline(data.headline);
      setExperienceBullets(data.experienceBullets);
      setHighlightedSkills(data.highlightedSkills);
      setOptimizationTips(data.optimizationTips);
      setGeneratedLanguage(prefs.language);
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
    setExporting(true);
    setExportError(false);
    try {
      await downloadCvPdf({ template: prefs.template, ...templateProps });
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

  // One CvData object; every template draws it.
  const cvData: CvData = {
    fullName: previewName,
    headline: generated && headline ? headline : degree.trim(),
    email: email.trim(),
    phone: phone.trim(),
    photo: photoPreview,
    summary: generated ? summary : "",
    experience: generated ? experienceBullets : [],
    experienceText: experienceText.trim(),
    education: university.trim() || degree.trim() ? [{ institution: university.trim(), degree: degree.trim(), year: graduationYear.trim() }] : [],
    skills: generated && highlightedSkills.length > 0 ? highlightedSkills : tools,
    softSkills: generated && highlightedSkills.length > 0 ? [] : splitList(softSkills),
    languages: [],
    links: portfolio.trim() ? [portfolio.trim()] : [],
  };
  const Template = CV_TEMPLATE_COMPONENTS[prefs.template];
  const templateProps = {
    data: cvData,
    accent: prefs.template === "ats" ? "#111827" : accentColor(prefs.accent),
    photo: showsPhoto(prefs.template, prefs, cvData),
    language: prefs.language,
    sections: visibleSections(cvData),
  };
  const [pages, setPages] = useState(1);
  const bigSheetRef = useRef<HTMLDivElement>(null);
  const paginationKey = JSON.stringify([cvData, prefs]);
  // Page breaks: re-applied whenever the content or the look changes, and
  // once the fonts are in. Only the DOM is touched here; the page count
  // comes back through the ResizeObserver below.
  useLayoutEffect(() => {
    const sheets = [sheetRef.current, bigSheetRef.current].filter((sheet): sheet is HTMLDivElement => Boolean(sheet));
    const run = () => sheets.forEach((sheet) => paginateSheet(sheet));
    run();
    let active = true;
    void document.fonts?.ready.then(() => active && run());
    return () => {
      active = false;
    };
  }, [paginationKey, bigView, step]);
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const observer = new ResizeObserver(() => setPages(pageCount(sheet.offsetHeight)));
    observer.observe(sheet);
    return () => observer.disconnect();
  }, [step]);

  /** The A4 sheet. Only the copy in the page carries the ref the PDF export captures. */
  const renderSheet = (forExport: boolean) => (
    <div
      ref={forExport ? sheetRef : bigSheetRef}
      data-cv-sheet={forExport ? "" : undefined}
      className="relative"
      style={{ width: A4_WIDTH_PX, minHeight: A4_HEIGHT_PX, background: "#ffffff" }}
    >
      <Template {...templateProps} />
      {/* Page breaks: guides on the preview; the PDF is drawn separately. */}
      {forExport
        ? Array.from({ length: pages - 1 }, (_, index) => (
            <div
              key={index}
              aria-hidden
              className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-slate-300"
              style={{ top: (index + 1) * A4_HEIGHT_PX }}
            >
              <span className="absolute right-3 top-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
                გვერდი {index + 2}
              </span>
            </div>
          ))
        : null}
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
  const languageMismatch = generated && generatedLanguage !== null && generatedLanguage !== prefs.language;

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
                    <UploadIconBadge size={40} />
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
              <div className="border-t border-[var(--border)] pt-4">
                <LanguageSwitch value={prefs.language} onChange={(language) => updatePrefs({ language })} />
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">AI ამ ენაზე დაწერს CV-ს ტექსტს და სექციების სათაურებს.</p>
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
                <p className="text-xs text-slate-500 dark:text-zinc-400">{CV_TEMPLATE_INFO[prefs.template].name} · A4{pages > 1 ? ` · ${pages} გვერდი` : ""}</p>
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

          {languageMismatch ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
              <span>სექციების სათაურები შეიცვალა, AI-ის ტექსტი კი ჯერ {generatedLanguage === "en" ? "ინგლისურადაა" : "ქართულადაა"}.</span>
              <button type="button" onClick={() => void buildSummary()} disabled={cvLoading} className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline">
                {cvLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                ხელახლა დაწერა {prefs.language === "en" ? "ინგლისურად" : "ქართულად"}
              </button>
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            {/* Templates (thumbnails: a row on phones/tablets, a column on desktop) and the options. */}
            <CvTemplatePicker
              prefs={prefs}
              accent={accentColor(prefs.accent)}
              atsFocus={optimizationPills.ats}
              hasPhoto={Boolean(photoPreview)}
              onChange={updatePrefs}
            />

            <div className="min-w-0">
              <CvSheetFrame>{renderSheet(true)}</CvSheetFrame>
              <div className="mt-3 flex justify-center">
                <button type="button" onClick={() => setBigView(true)} className={secondaryBtn}>
                  <Maximize2 className="h-4 w-4" />
                  დიდი ნახვა
                </button>
              </div>
              {generated && optimizationTips.length > 0 ? (
                <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                    AI-ის რჩევები (CV-ში არ ჩანს)
                  </p>
                  <ul className="space-y-1 text-xs text-slate-600 dark:text-zinc-400">
                    {optimizationTips.map((tip) => (
                      <li key={tip}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
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
