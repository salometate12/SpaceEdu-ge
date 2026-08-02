"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  CloudUpload,
  Plus,
} from "lucide-react";
import { AiSkeletonLoader } from "@/components/ui/AiSkeletonLoader";
import { fetchAiMultipartJson } from "@/lib/ai/fetch-ai";
import type { SyllabusResponse } from "@/lib/ai/syllabus-schema";
import {
  addMilestoneToDashboardCalendar,
  clearLegacySyllabusMockData,
  getDashboardCalendarEvents,
  isMilestoneOnDashboard,
  setGeneratedMilestones,
  type SyllabusMilestone,
  type SyllabusMilestoneType,
} from "@/lib/syllabus-calendar";

type SyllabusOption = "plan" | "midterms" | "quiz-weeks";

const OPTIONS: Array<{ id: SyllabusOption; label: string }> = [
  { id: "plan", label: "სემესტრული გეგმა" },
  { id: "midterms", label: "შუალედურების თარიღები" },
  { id: "quiz-weeks", label: "Quiz კვირები" },
];

const BADGE_STYLES: Record<
  SyllabusMilestoneType,
  { label: string; className: string }
> = {
  midterm: {
    label: "შუალედური",
    className:
      "rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400",
  },
  quiz: {
    label: "ქვიზი",
    className:
      "rounded border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-400",
  },
  deadline: {
    label: "დედლაინი",
    className:
      "rounded border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400",
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
    clearLegacySyllabusMockData();
    setGenerated(false);
    setMilestones([]);
    setAiInsight("");
    setAddedIds(new Set());
  }, []);

  useEffect(() => {
    if (!generated) return;
    const synced = new Set(getDashboardCalendarEvents().map((event) => event.id));
    setAddedIds(synced);
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

    setIsLoading(true);
    setError(null);
    setAiInsight("");

    try {
      const data = await fetchAiMultipartJson<SyllabusResponse>({
        pageType: "syllabus",
        file: syllabusFile,
        fields: { options: JSON.stringify(enabled) },
      });

      const next: SyllabusMilestone[] = data.milestones.map((item, index) => ({
        id: item.id?.trim() || `syllabus-ms-${index + 1}`,
        title: item.title,
        date: item.date,
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

  return (
    <section className="space-y-6">
      <header className="flex items-start gap-3">
        <Link
          href="/dashboard-student"
          className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] text-zinc-300 transition hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:text-white"
          aria-label="Dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="headline text-2xl font-bold text-white sm:text-3xl">
            სილაბუსის AI ანალიზატორი
          </h1>
          <p className="mt-1 max-w-4xl text-sm text-zinc-400">
            ჩააგდე საგნის სილაბუსის PDF ფაილი და გარდაქმენი ის ინტერაქციულ სემესტრულ გეგმად.
          </p>
        </div>
      </header>

      <div className="mt-6 flex w-full flex-col gap-6 lg:flex-row">
        <aside className="w-full lg:w-[360px] lg:shrink-0">
          <div className="rounded-2xl border border-white/[0.06] bg-[#121214]/40 p-5 backdrop-blur-md">
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-[#121214]/40 p-8 text-center transition-all ${
                dragActive
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-white/[0.08] hover:border-emerald-500/30"
              }`}
            >
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={onFileChange}
              />
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <CloudUpload className="h-3.5 w-3.5" />
                PDF Upload
              </div>
              <p className="text-sm text-zinc-200">ჩააგდე სილაბუსის PDF ან დააწკაპუნე ასარჩევად</p>
              <p className="text-xs text-zinc-500">მხარდაჭერა: მხოლოდ PDF</p>
            </label>

            {fileName && (
              <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                ატვირთული ფაილი: {fileName}
              </div>
            )}

            <div className="mt-4 space-y-2">
              {OPTIONS.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-300 transition hover:border-white/[0.12]"
                >
                  <input
                    type="checkbox"
                    checked={enabled[item.id]}
                    onChange={(event) =>
                      setEnabled((prev) => ({ ...prev, [item.id]: event.target.checked }))
                    }
                    className="h-4 w-4 accent-emerald-500"
                  />
                  {item.label}
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={isLoading || !syllabusFile}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-500/10 transition-all hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60"
            >
              {isLoading ? "PDF-ის დამუშავება მიმდინარეობს..." : "კალენდრის გენერაცია"}
            </button>
            {error && (
              <p className="mt-3 text-xs text-rose-300">{error}</p>
            )}
          </div>
        </aside>

        <section className="min-h-[520px] flex-1 rounded-2xl border border-white/[0.06] bg-[#121214]/20 p-5 backdrop-blur-md">
          {isLoading ? (
            <div className="space-y-3">
              <p className="text-sm text-emerald-300/90">
                PDF-ის დამუშავება მიმდინარეობს...
              </p>
              <AiSkeletonLoader rows={4} />
            </div>
          ) : !generated ? (
            <div className="flex h-full min-h-[480px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-[#0f1420]/30 p-8 text-center">
              <p className="max-w-sm text-sm text-zinc-500">
                ატვირთე სილაბუსი სემესტრული კალენდრის დასაგენერირებლად.
              </p>
            </div>
          ) : (
            <div className="fade-in flex h-full flex-col rounded-2xl border border-white/[0.06] bg-[#121214]/40 p-5 backdrop-blur-md">
              <div className="mb-5">
                <div className="mb-1 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-emerald-400" strokeWidth={1.5} />
                  <h2 className="text-lg font-semibold text-white">
                    სილაბუსიდან გენერირებული თარიღები
                  </h2>
                </div>
                <p className="text-sm text-zinc-400">
                  მონიშნე მნიშვნელოვანი დღეები დეშბორდის კალენდარში დასამატებლად.
                </p>
              </div>

              {aiInsight && (
                <div className="mb-5 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-4 text-xs leading-relaxed text-zinc-400">
                  {aiInsight}
                </div>
              )}

              <div className="relative space-y-0 pl-6">
                <div
                  className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-emerald-500/40 via-white/10 to-transparent"
                  aria-hidden
                />
                {visibleMilestones.map((item, index) => {
                  const added =
                    addedIds.has(item.id) || isMilestoneOnDashboard(item.id);
                  const badge = BADGE_STYLES[item.type];
                  return (
                    <article
                      key={item.id}
                      className={`stagger-in relative pb-4 ${index === visibleMilestones.length - 1 ? "pb-0" : ""}`}
                      style={{ animationDelay: `${index * 70}ms` }}
                    >
                      <span
                        className="absolute -left-6 top-4 h-3 w-3 rounded-full border-2 border-emerald-500/50 bg-[#121214] shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                        aria-hidden
                      />
                      <div className="relative flex items-start justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#17181b]/55 py-3 pl-4 pr-28 transition hover:border-white/[0.12]">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className={badge.className}>[ {badge.label} ]</span>
                          </div>
                          <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                          <p className="mt-0.5 text-xs text-zinc-400">{item.date}</p>
                        </div>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {added ? (
                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400">
                              <Check className="h-3.5 w-3.5" />
                              დამატებულია
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddToCalendar(item)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-white/90 transition-all hover:border-purple-500/40 hover:bg-white/[0.08]"
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
                className="mt-5 inline-flex items-center gap-2 text-xs text-emerald-400 transition hover:text-emerald-300"
              >
                <Bell className="h-3.5 w-3.5" />
                გახსენი სრული კალენდარი სასწავლო გეგმაში
              </Link>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
