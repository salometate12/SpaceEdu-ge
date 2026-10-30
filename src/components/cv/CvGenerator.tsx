"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, Download, Eye, FileText, Lightbulb, Loader2, Maximize2, RefreshCw, RotateCcw, X } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { StepperBar } from "@/components/ui/StepperBar";
import { StepFooter } from "@/components/ui/wizard/StepFooter";
import { WizardColumns } from "@/components/ui/wizard/WizardPage";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import { recordCvUpdate } from "@/lib/dashboard-metrics";
import type { CvResponse } from "@/lib/ai/cv-schema";
import { A4_HEIGHT_PX, A4_WIDTH_PX } from "@/lib/cv-sheet";
import { accentColor, CV_TEMPLATE_INFO, showsPhoto, visibleSections, type CvData, type CvLanguage, type CvPrefs } from "@/lib/cv-data";
import { emptyExperience, experienceLine, hasContent, type CvExperience } from "@/lib/cv-experience";
import { readCvPrefs, resolveCvPrefs, serverCvPrefs, subscribeCvPrefs, writeCvPrefs } from "@/lib/cv-prefs";
import { pageCount, paginateSheet } from "@/lib/cv-paginate";
import { CvSheetFrame } from "./CvSheetFrame";
import { CvTemplatePicker } from "./CvTemplatePicker";
import { ContactStep, EducationStep, emailProblem, SkillsStep, yearProblem } from "./CvFormSteps";
import { CvLivePreview } from "./CvLivePreview";
import { CV_TEMPLATE_COMPONENTS } from "./templates";
import { downloadCvPdf } from "./pdf/downloadCvPdf";

type WizardStep = 1 | 2 | 3 | 4;
type OptimizationPill = "ats" | "internship";

const STEPS: Array<{ id: WizardStep; label: string }> = [
  { id: 1, label: "კონტაქტი და ფოტო" },
  { id: 2, label: "განათლება და გამოცდილება" },
  { id: 3, label: "უნარები" },
  { id: 4, label: "შაბლონი და შედეგი" },
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
  const [experiences, setExperiences] = useState<CvExperience[]>([emptyExperience()]);

  const [tools, setTools] = useState<string[]>([]);
  const [softSkills, setSoftSkills] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
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
            experiences: experiences.filter(hasContent),
            tools,
            softSkills: softSkills.join(", "),
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

  // Fields that are filled in but malformed hold the step back.
  const stepProblem = step === 1 ? emailProblem(email) : step === 2 ? yearProblem(graduationYear) : null;

  const goNext = () => {
    if (stepProblem) return;
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

  // One CvData object; every template draws it.
  const cvData: CvData = {
    fullName: previewName,
    headline: generated && headline ? headline : degree.trim(),
    email: email.trim(),
    phone: phone.trim(),
    photo: photoPreview,
    summary: generated ? summary : "",
    experience: generated ? experienceBullets : [],
    experienceText: experiences.filter(hasContent).map(experienceLine).join("\n"),
    education: university.trim() || degree.trim() ? [{ institution: university.trim(), degree: degree.trim(), year: graduationYear.trim() }] : [],
    skills: generated && highlightedSkills.length > 0 ? highlightedSkills : tools,
    softSkills: generated && highlightedSkills.length > 0 ? [] : softSkills,
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

  const secondaryBtn =
    "inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-pink-300 hover:text-pink-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-300 dark:hover:border-pink-400/30 dark:hover:text-white";
  const primaryBtn =
    "inline-flex items-center gap-1.5 rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-pink-500 dark:hover:bg-pink-400";
  const draft = { fullName, email, phone, portfolio, photo: photoPreview, university, degree, graduationYear, experiences, tools, softSkills };
  const languageMismatch = generated && generatedLanguage !== null && generatedLanguage !== prefs.language;

  return (
    <section className="flex flex-col gap-5">
      <StepperBar steps={STEPS} current={step} onStep={(next) => setStep(next as WizardStep)} />

      {step < 4 ? (
        <WizardColumns
          form={
            <>
              {step === 1 && (
                <ContactStep
                  values={{ fullName, email, phone, portfolio }}
                  onChange={(key, value) =>
                    ({ fullName: setFullName, email: setEmail, phone: setPhone, portfolio: setPortfolio })[key](value)
                  }
                  photo={photoPreview}
                  onPhoto={setPhotoPreview}
                />
              )}
              {step === 2 && (
                <EducationStep
                  values={{ university, degree, graduationYear }}
                  onChange={(key, value) => ({ university: setUniversity, degree: setDegree, graduationYear: setGraduationYear })[key](value)}
                  experiences={experiences}
                  onExperiences={setExperiences}
                />
              )}
              {step === 3 && (
                <SkillsStep
                  tools={tools}
                  onTools={setTools}
                  softSkills={softSkills}
                  onSoftSkills={setSoftSkills}
                  ats={optimizationPills.ats}
                  internship={optimizationPills.internship}
                  onToggle={(key, value) => setOptimizationPills((prev) => ({ ...prev, [key]: value }))}
                  language={prefs.language}
                  onLanguage={(language) => updatePrefs({ language })}
                />
              )}

              {cvError ? (
                <Alert tone="error" className="mt-6">
                  {cvError}
                </Alert>
              ) : null}

              {/* Below 1024px the preview opens from here, in a sheet. */}
              <button type="button" onClick={() => setPreviewOpen(true)} className="wz-secondary mt-6 h-11 px-5 text-[14.5px] lg:!hidden">
                <Eye className="h-4 w-4" aria-hidden />
                გადახედვა
              </button>

              <StepFooter
                step={step}
                total={STEPS.length}
                onBack={goBack}
                onNext={goNext}
                nextLabel={step === 3 ? (cvLoading ? "ვქმნით…" : "შექმენი CV") : "შემდეგი"}
                final={step === 3}
                disabled={Boolean(stepProblem)}
                busy={cvLoading}
              />
            </>
          }
          panel={<PreviewPanel draft={draft} language={prefs.language} />}
        />
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
      {previewOpen && step < 4 ? (
        <div className="fixed inset-0 z-[100] flex items-end bg-black/40 lg:hidden" onClick={() => setPreviewOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="გადახედვა"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[85dvh] w-full overflow-y-auto rounded-t-[28px] bg-[var(--wz-panel)] p-5 pb-[max(20px,env(safe-area-inset-bottom))]"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="mx-auto h-1.5 w-12 rounded-full bg-[var(--wz-field-border)]" aria-hidden />
            </div>
            <PreviewPanel draft={draft} language={prefs.language} onClose={() => setPreviewOpen(false)} />
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** „გადახედვა“ and the sketch of the sheet as it's being filled in. */
function PreviewPanel({ draft, language, onClose }: { draft: Parameters<typeof CvLivePreview>[0]["draft"]; language: CvLanguage; onClose?: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-bold text-[var(--wz-title)]">გადახედვა</h2>
        <span className="flex items-center gap-2">
          <span className="text-[13px] text-[var(--wz-faint)]">ივსება წერისას</span>
          {onClose ? (
            <button type="button" onClick={onClose} aria-label="დახურვა" className="wz-focus flex h-9 w-9 items-center justify-center rounded-full text-[var(--wz-muted)] hover:bg-[var(--wz-hover)]">
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </span>
      </div>
      <CvLivePreview draft={draft} language={language} />
    </div>
  );
}
