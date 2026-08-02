"use client";

import Link from "next/link";
import { useMemo, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Download } from "lucide-react";
import { AiSkeletonLoader } from "@/components/ui/AiSkeletonLoader";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
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
  previewClass: string;
}> = [
  {
    id: "minimal-tech",
    title: "Minimal Tech",
    subtitle: "სუფთა სტილი დეველოპერებისთვის",
    previewClass: "from-purple-500/20 to-violet-700/20",
  },
  {
    id: "creative-ui",
    title: "Creative UI/UX",
    subtitle: "თანამედროვე დიზაინი კრეატიული პროფილებისთვის",
    previewClass: "from-cyan-500/20 to-indigo-700/20",
  },
  {
    id: "academic-corporate",
    title: "Academic Corporate",
    subtitle: "სტაბილური, აკადემიური და პროფესიული ტონი",
    previewClass: "from-emerald-500/20 to-slate-700/20",
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
      accent: "text-purple-300",
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

  return (
    <section className="space-y-6">
      <header className="flex items-start gap-3">
        <Link
          href="/dashboard-student"
          className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] text-zinc-300 transition hover:border-purple-400/30 hover:bg-purple-500/10 hover:text-white"
          aria-label="Dashboard"
        >
          ←
        </Link>
        <div>
          <h1 className="headline text-2xl font-bold text-white sm:text-3xl">AI CV გენერატორი</h1>
          <p className="mt-1 max-w-4xl text-sm text-zinc-400">
            შეავსე შენი მონაცემები და AI შეგირჩევს იდეალურ სტრუქტურას სტაჟირებებისა და
            ვაკანსიებისთვის.
          </p>
        </div>
      </header>

      <div className="rounded-2xl border border-white/[0.08] bg-[#121214]/40 p-5 backdrop-blur-md sm:p-6">
        <div className="relative pb-4">
          <div className="absolute left-5 right-5 top-5 h-px bg-white/[0.06]" />
          <div className="relative flex items-start justify-between gap-2 overflow-x-auto">
            {STEPS.map((item) => {
              const active = step === item.id;
              return (
                <div key={item.id} className="min-w-[132px] text-center">
                  <button
                    type="button"
                    onClick={() => setStep(item.id)}
                    className={`mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition ${
                      active
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                        : "border border-white/[0.08] bg-[#161619] text-gray-500"
                    }`}
                  >
                    {item.id}
                  </button>
                  <p className="mt-2 text-xs text-zinc-400">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/[0.08] bg-[#121214]/60 p-5">
          {step === 1 && (
            <div className="grid gap-4 lg:grid-cols-[120px_1fr]">
              <label className="cursor-pointer space-y-2">
                <span className="block text-xs text-zinc-400">ფოტოს დამატება (არასავალდებულო)</span>
                <div className="flex h-24 w-24 flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-[#161619]/40 transition-all hover:border-purple-500/40">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile"
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    <span className="text-xs text-zinc-500">ფოტო</span>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="text-zinc-400">სრული სახელი</span>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#121214]/60 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-zinc-400">Email</span>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#121214]/60 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-zinc-400">ტელეფონი</span>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#121214]/60 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50"
                  />
                </label>
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="text-zinc-400">LinkedIn / Portfolio</span>
                  <input
                    value={portfolio}
                    onChange={(event) => setPortfolio(event.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#121214]/60 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50"
                  />
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">განათლება & გამოცდილება</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="text-zinc-400">University</span>
                  <input
                    value={university}
                    onChange={(event) => setUniversity(event.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#121214]/60 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-zinc-400">Graduation Year</span>
                  <input
                    value={graduationYear}
                    onChange={(event) => setGraduationYear(event.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#121214]/60 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50"
                  />
                </label>
                <label className="space-y-1 text-sm sm:col-span-3">
                  <span className="text-zinc-400">Degree</span>
                  <input
                    value={degree}
                    onChange={(event) => setDegree(event.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#121214]/60 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-200">
                🤖 მოკლედ აღწერე სად მუშაობდი ან რა პროექტები გაქვს გაკეთებული, AI მათ
                პროფესიონალურ პუნქტებად გადააქცევს.
              </div>
              <textarea
                value={experienceText}
                onChange={(event) => setExperienceText(event.target.value)}
                className="min-h-32 w-full rounded-xl border border-white/[0.08] bg-[#121214]/60 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50"
                placeholder="მაგ: ვიმუშავე სტუდენტურ პროექტზე..."
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">უნარები & თულები</h2>
              <label className="space-y-1 text-sm">
                <span className="text-zinc-400">Software & Tools</span>
                <input
                  value={toolInput}
                  onChange={(event) => setToolInput(event.target.value)}
                  onBlur={commitToolInput}
                  onKeyDown={onToolInputKeyDown}
                  placeholder="მაგ: Figma, Next.js, Tailwind, Cursor, Git"
                  className="w-full rounded-xl border border-white/[0.08] bg-[#121214]/60 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50"
                />
              </label>

              {tools.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tools.map((tool) => (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => setTools((prev) => prev.filter((item) => item !== tool))}
                      className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300 transition hover:text-white"
                    >
                      {tool} ✕
                    </button>
                  ))}
                </div>
              )}

              <label className="space-y-1 text-sm">
                <span className="text-zinc-400">Personal Skills</span>
                <textarea
                  value={softSkills}
                  onChange={(event) => setSoftSkills(event.target.value)}
                  placeholder="მაგ: კოლაბორაცია, პრობლემების გადაჭრა..."
                  className="min-h-24 w-full rounded-xl border border-white/[0.08] bg-[#121214]/60 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setOptimizationPills((prev) => ({ ...prev, ats: !prev.ats }))
                  }
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    optimizationPills.ats
                      ? "border-purple-500/40 bg-purple-500/10 text-purple-300 shadow-sm"
                      : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:text-white"
                  }`}
                >
                  + ATS ოპტიმიზაცია
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setOptimizationPills((prev) => ({ ...prev, internship: !prev.internship }))
                  }
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    optimizationPills.internship
                      ? "border-purple-500/40 bg-purple-500/10 text-purple-300 shadow-sm"
                      : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:text-white"
                  }`}
                >
                  + სტაჟირებისთვის მორგება
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
              <aside className="space-y-3 rounded-xl border border-white/[0.08] bg-[#141418]/60 p-3">
                <p className="text-xs text-zinc-400">ტემპლეიტი</p>
                {TEMPLATES.map((template) => {
                  const active = selectedTemplate === template.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`w-full rounded-xl border bg-gradient-to-br p-3 text-left transition ${
                        active
                          ? `${template.previewClass} border-purple-500/45`
                          : `${template.previewClass} border-white/[0.08] hover:border-purple-500/25`
                      }`}
                    >
                      <p className="text-sm font-semibold text-white">{template.title}</p>
                    </button>
                  );
                })}
              </aside>

              <div className="rounded-2xl border border-white/[0.08] bg-[#0f1014]/65 p-4">
                <div className="mb-3 flex items-center justify-end">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-purple-500/10 transition-all hover:from-purple-500 hover:to-indigo-500"
                  >
                    <Download className="h-4 w-4" strokeWidth={1.5} />
                    PDF ექსპორტი
                  </button>
                </div>

                <div className="max-h-[560px] overflow-y-auto rounded-xl border border-white/[0.08] bg-black/20 p-4">
                  <div className={`mx-auto min-h-[760px] w-full max-w-[760px] rounded-xl border border-white/[0.1] p-6 ${templateStyle.pageBg}`}>
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
                          className="h-24 w-24 rounded-xl border border-white/[0.15] object-cover"
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
                </div>
              </div>
            </div>
          )}
        </div>

        {cvError && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {cvError}
          </div>
        )}
        {cvLoading && step === 3 && <AiSkeletonLoader rows={2} className="mt-4" />}

        <footer className="mt-6 flex items-center justify-between border-t border-white/[0.08] pt-4">
          <button
            type="button"
            onClick={goBack}
              disabled={step === 1 || cvLoading}
            className="rounded-xl border border-white/[0.08] bg-[#161619] px-5 py-2.5 text-sm text-zinc-300 transition hover:text-white disabled:opacity-40"
          >
            უკან
          </button>
          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={cvLoading}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/10 transition-all hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60"
            >
              {step === 3 ? (cvLoading ? "იტვირთება..." : "CV-ს გენერირება") : "შემდეგი"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setGenerated(false);
                setSummary("");
                setHeadline("");
                setExperienceBullets([]);
                setHighlightedSkills([]);
                setOptimizationTips([]);
              }}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/10 transition-all hover:from-purple-500 hover:to-indigo-500"
            >
              ახალი CV
            </button>
          )}
        </footer>
      </div>
    </section>
  );
}
