"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import {
  AlertCircle,
  Bell,
  Brain,
  CalendarDays,
  CalendarPlus,
  Check,
  CloudUpload,
  GraduationCap,
  Plus,
} from "lucide-react";
import { fetchAiMultipartJson } from "@/lib/ai/fetch-ai";
import type { SyllabusResponse } from "@/lib/ai/syllabus-schema";
import {
  addMilestoneToDashboardCalendar,
  addMilestonesToDashboardCalendar,
  clearLegacySyllabusMockData,
  getDashboardCalendarEvents,
  isMilestoneOnDashboard,
  setGeneratedMilestones,
  type SyllabusMilestone,
  type SyllabusMilestoneType,
} from "@/lib/syllabus-calendar";
import { SyllabusThinkingLoader } from "./SyllabusThinkingLoader";

const MONTH_NAMES = [
  "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
  "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი",
];

function formatIsoDateGeorgian(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}, ${d.getFullYear()}`;
}

type SyllabusOption = "plan" | "midterms" | "quiz-weeks";

const OPTIONS: Array<{ id: SyllabusOption; label: string }> = [
  { id: "plan", label: "სემესტრული გეგმა" },
  { id: "midterms", label: "შუალედურების თარიღები" },
  { id: "quiz-weeks", label: "Quiz კვირები" },
];

const TYPE_META: Record<
  SyllabusMilestoneType,
  { label: string; icon: typeof GraduationCap; dot: string; badge: string }
> = {
  midterm: {
    label: "შუალედური",
    icon: GraduationCap,
    dot: "border-violet-400 dark:border-violet-400/60",
    badge:
      "border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300",
  },
  quiz: {
    label: "ქვიზი",
    icon: Brain,
    dot: "border-sky-400 dark:border-sky-400/60",
    badge:
      "border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300",
  },
  deadline: {
    label: "დედლაინი",
    icon: AlertCircle,
    dot: "border-pink-400 dark:border-pink-400/60",
    badge:
      "border-pink-200 bg-pink-50 text-pink-600 dark:border-pink-400/20 dark:bg-pink-400/10 dark:text-pink-300",
  },
};

function filterMilestonesByOptions(
  milestones: SyllabusMilestone[],
  enabled: Record<SyllabusOption, boolean>,
): SyllabusMilestone[] {
  return milestones.filter((item) => {
    if (item.type === "midterm") return enabled.midterms;
    if (item.type === "quiz") return enabled["quiz-weeks"];
    if (item.type === "deadline") return enabled.plan;
    return true;
  });
}

export function SyllabusAnalyzer() {
  const [fileName, setFileName] = useState("");
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [semesterStartDate, setSemesterStartDate] = useState("");
  const [enabled, setEnabled] = useState<Record<SyllabusOption, boolean>>({
    plan: true,
    midterms: true,
    "quiz-weeks": false,
  });
  const [generated, setGenerated] = useState(false);
  const [milestones, setMilestones] = useState<SyllabusMilestone[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resetState = () => {
      clearLegacySyllabusMockData();
      setGenerated(false);
      setMilestones([]);
      setAiInsight("");
      setAddedIds(new Set());
    };
    resetState();
  }, []);

  useEffect(() => {
    if (!generated) return;
    const syncAddedIds = () => {
      const synced = new Set(getDashboardCalendarEvents().map((event) => event.id));
      setAddedIds(synced);
    };
    syncAddedIds();
  }, [generated]);

  const visibleMilestones = useMemo(
    () => filterMilestonesByOptions(milestones, enabled),
    [milestones, enabled],
  );

  const handleFile = (file: File) => {
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setError("მხოლოდ PDF ფორმატის ფაილია დაშვებული.");
      return;
    }

    setError(null);
    setFileName(file.name);
    setSyllabusFile(file);
    setGenerated(false);
    setMilestones([]);
    setAddedIds(new Set());
    setAiInsight("");
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleGenerate = async () => {
    if (!syllabusFile) {
      setError("გთხოვ, ჯერ ატვირთე სილაბუსის PDF.");
      return;
    }
    if (!semesterStartDate) {
      setError("გთხოვ, მიუთითე სემესტრის დაწყების თარიღი — ეს სჭირდება AI-ს რეალური თარიღების გამოსათვლელად.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAiInsight("");

    try {
      const data = await fetchAiMultipartJson<SyllabusResponse>({
        pageType: "syllabus",
        file: syllabusFile,
        fields: { options: JSON.stringify(enabled), semesterStartDate },
      });

      const next: SyllabusMilestone[] = data.milestones.map((item, index) => ({
        id: item.id?.trim() || `syllabus-ms-${index + 1}`,
        title: item.title,
        date: item.date,
        week: item.week,
        topic: item.topic,
        type: item.type,
      }));

      if (next.length === 0) {
        throw new Error(
          "სილაბუსიდან თარიღები ვერ მოიძებნა. სცადე სხვა PDF ან უფრო ტექსტური ფაილი.",
        );
      }

      setAiInsight(data.insight);
      setMilestones(next);
      setGeneratedMilestones(next);
      setAddedIds(new Set());
      setGenerated(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "AI ამჟამად მიუწვდომელია. სცადე კიდევ ერთხელ.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCalendar = (milestone: SyllabusMilestone) => {
    addMilestoneToDashboardCalendar(milestone);
    setAddedIds((prev) => new Set(prev).add(milestone.id));
  };

  const pendingMilestones = useMemo(
    () =>
      visibleMilestones.filter(
        (item) => !addedIds.has(item.id) && !isMilestoneOnDashboard(item.id),
      ),
    [visibleMilestones, addedIds],
  );

  const allMilestonesAdded =
    visibleMilestones.length > 0 && pendingMilestones.length === 0;

  const handleAddAllToCalendar = () => {
    if (pendingMilestones.length === 0) return;
    addMilestonesToDashboardCalendar(pendingMilestones);
    setAddedIds((prev) => {
      const next = new Set(prev);
      for (const item of pendingMilestones) next.add(item.id);
      return next;
    });
  };

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row">
      <aside className="w-full lg:w-[360px] lg:shrink-0">
        <div className="dashboard-tool-card rounded-[28px] p-5">
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[rgb(228,216,189)] bg-[linear-gradient(135deg,#fefcf6_0%,#f6efdc_100%)] p-8 text-center transition-all dark:border-white/10 dark:bg-white/[0.02] ${
              dragActive
                ? "border-violet-300 bg-violet-50 dark:border-violet-400/40 dark:bg-violet-500/10"
                : "hover:border-violet-300 dark:hover:border-violet-400/40"
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={onFileChange}
            />
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-600 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300">
              <CloudUpload className="h-3.5 w-3.5" />
              PDF Upload
            </div>
            <p className="text-sm text-slate-700 dark:text-zinc-200">ჩააგდე სილაბუსის PDF ან დააწკაპუნე ასარჩევად</p>
            <p className="text-xs text-slate-500 dark:text-zinc-500">მხარდაჭერა: მხოლოდ PDF</p>
          </label>

          {fileName && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300">
              ატვირთული ფაილი: {fileName}
            </div>
          )}

          <label className="mt-4 block space-y-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">
              სემესტრის დაწყების თარიღი
            </span>
            <input
              type="date"
              value={semesterStartDate}
              onChange={(event) => setSemesterStartDate(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-100 dark:focus:border-rose-400/50 dark:focus:ring-rose-500/10"
            />
            <p className="text-xs text-slate-500 dark:text-zinc-500">
              სილაბუსები ხშირად კვირის ნომრებს იყენებენ თარიღების მაგივრად — ეს გვჭირდება, რომ AI-მ ისინი რეალურ თარიღებად გადათვალოს.
            </p>
          </label>

          <div className="mt-4 space-y-2">
            {OPTIONS.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition hover:border-rose-200 hover:bg-rose-50/50 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-zinc-300 dark:hover:border-white/[0.12] dark:hover:bg-white/[0.04]"
              >
                <input
                  type="checkbox"
                  checked={enabled[item.id]}
                  onChange={(event) =>
                    setEnabled((prev) => ({ ...prev, [item.id]: event.target.checked }))
                  }
                  className="h-4 w-4 accent-rose-500"
                />
                {item.label}
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={isLoading || !syllabusFile || !semesterStartDate}
            className="mt-4 w-full rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-500 dark:hover:bg-violet-400"
          >
            {isLoading ? "სილაბუსს ვამუშავებ..." : "კალენდრის გენერაცია"}
          </button>
          {error && (
            <p className="mt-3 text-xs text-rose-600 dark:text-rose-400">{error}</p>
          )}
        </div>
      </aside>

      <div className="dashboard-tool-card min-h-[520px] flex-1 rounded-[28px] p-5">
        {isLoading ? (
          <SyllabusThinkingLoader />
        ) : !generated ? (
          <div className="flex h-full min-h-[480px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 p-8 text-center dark:border-white/[0.08] dark:bg-white/[0.02]">
            <p className="max-w-sm text-sm text-slate-500 dark:text-zinc-500">
              ატვირთე სილაბუსი სემესტრული კალენდრის დასაგენერირებლად.
            </p>
          </div>
        ) : (
          <div className="fade-in flex h-full flex-col">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl subject-icon-wrap">
                  <CalendarDays className="h-5 w-5 text-rose-600 dark:text-rose-400" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    სილაბუსიდან გენერირებული თარიღები
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-zinc-400">
                    მონიშნე მნიშვნელოვანი დღეები დეშბორდის კალენდარში დასამატებლად.
                  </p>
                </div>
              </div>
              {visibleMilestones.length > 0 && (
                allMilestonesAdded ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-600 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <Check className="h-3.5 w-3.5" />
                    ყველა დამატებულია კალენდარში
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddAllToCalendar}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-500 dark:bg-violet-500 dark:hover:bg-violet-400"
                  >
                    <CalendarPlus className="h-3.5 w-3.5" />
                    ყველას კალენდარში დამატება ({pendingMilestones.length})
                  </button>
                )
              )}
            </div>

            {aiInsight && (
              <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-xs leading-relaxed text-slate-600 dark:border-rose-400/15 dark:bg-rose-500/[0.04] dark:text-zinc-400">
                {aiInsight}
              </div>
            )}

            <div className="relative space-y-0 pl-6">
              <div
                className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-rose-300 via-slate-200 to-transparent dark:from-rose-400/40 dark:via-white/10 dark:to-transparent"
                aria-hidden
              />
              {visibleMilestones.map((item, index) => {
                const added =
                  addedIds.has(item.id) || isMilestoneOnDashboard(item.id);
                const meta = TYPE_META[item.type];
                return (
                  <article
                    key={item.id}
                    className={`stagger-in relative pb-4 ${index === visibleMilestones.length - 1 ? "pb-0" : ""}`}
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <span
                      className={`absolute -left-6 top-4 h-3 w-3 rounded-full border-2 bg-white dark:bg-[#121214] ${meta.dot}`}
                      aria-hidden
                    />
                    <div className="dashboard-glass-card relative flex items-start justify-between gap-3 rounded-2xl py-3 pl-4 pr-28">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${meta.badge}`}
                          >
                            {meta.label}
                          </span>
                          {item.week && (
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400">
                              კვირა {item.week}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">{item.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                          {formatIsoDateGeorgian(item.date)}
                        </p>
                        {item.topic && (
                          <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-zinc-500">{item.topic}</p>
                        )}
                      </div>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {added ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                            <Check className="h-3.5 w-3.5" />
                            დამატებულია
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToCalendar(item)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-violet-400/30 dark:hover:bg-violet-500/10 dark:hover:text-white"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            {index % 2 === 0 ? "დაამატე კალენდარში" : "მოინიშნე ეს დღე"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <Link
              href="/study-plan"
              className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-rose-600 transition hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
            >
              <Bell className="h-3.5 w-3.5" />
              გახსენი სრული კალენდარი სასწავლო გეგმაში
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
