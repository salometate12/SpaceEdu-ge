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
import { Pencil, Ruler, Sparkle } from "@/components/landing/notebook/Doodles";
import {
  ACCENT_CARD,
  ACCENT_PILL,
  ACCENT_SOLID,
  ACCENT_TEXT,
  PLAIN_CARD,
} from "@/components/landing/notebook/accents";
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
    // The page reads top to bottom: drop the syllabus, then the dates it
    // produced, each one under the last. Side by side squeezed the dates
    // into a third of the screen for no reason.
    <div className="flex w-full flex-col gap-5">
      <section className="w-full">
        <div
          className={`grid grid-cols-1 gap-4 rounded-2xl border-2 p-4 sm:p-5 lg:grid-cols-[1.1fr_1fr] ${ACCENT_CARD.violet}`}
        >
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={`exam-paper-plain flex h-full cursor-pointer flex-col items-center justify-center gap-2.5 border-2 border-dashed p-6 text-center transition-all ${
              dragActive
                ? "border-violet-400 dark:border-violet-400/50"
                : "border-slate-300 hover:border-violet-400 dark:border-white/15 dark:hover:border-violet-400/40"
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={onFileChange}
            />
            <span
              className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1 text-xs font-bold ${ACCENT_PILL.violet}`}
            >
              <CloudUpload className="h-3.5 w-3.5 stroke-[2.5]" />
              PDF
            </span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              ჩააგდე სილაბუსის PDF ან დააწკაპუნე ასარჩევად
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">მხარდაჭერა: მხოლოდ PDF</p>
          </label>

          <div className="flex flex-col">
          {fileName && (
            <div className={`rounded-xl border-2 px-3 py-2 text-xs font-semibold ${ACCENT_PILL.green}`}>
              ატვირთული ფაილი: {fileName}
            </div>
          )}

          <label className="mt-3 block space-y-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">
              სემესტრის დაწყების თარიღი
            </span>
            <input
              type="date"
              value={semesterStartDate}
              onChange={(event) => setSemesterStartDate(event.target.value)}
              required
              className="w-full rounded-xl border-2 border-slate-300/80 bg-white/70 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500/70 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-slate-100"
            />
            <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
              სილაბუსები ხშირად კვირის ნომრებს იყენებენ თარიღების ნაცვლად — ეს
              გვჭირდება, რომ AI-მ რეალურ თარიღებად გადათვალოს.
            </p>
          </label>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {OPTIONS.map((item) => (
              <label
                key={item.id}
                className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold text-slate-700 transition dark:text-slate-200 ${PLAIN_CARD}`}
              >
                <input
                  type="checkbox"
                  checked={enabled[item.id]}
                  onChange={(event) =>
                    setEnabled((prev) => ({ ...prev, [item.id]: event.target.checked }))
                  }
                  className="h-4 w-4 accent-violet-600"
                />
                {item.label}
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={isLoading || !syllabusFile || !semesterStartDate}
            className={`paper-sticker mt-auto w-full rounded-full border-2 px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${ACCENT_SOLID.violet}`}
          >
            {isLoading ? "სილაბუსს ვამუშავებ..." : "კალენდრის გენერაცია"}
          </button>
          {error && (
            <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}
          </div>
        </div>
      </section>

      <div className="notebook-paper notebook-sheet relative min-h-[420px] w-full min-w-0 overflow-hidden rounded-[26px] p-5 sm:p-6">
        <Sparkle
          className={`pointer-events-none absolute right-5 top-5 hidden h-4 w-4 -rotate-12 opacity-70 lg:block ${ACCENT_TEXT.violet}`}
        />
        <Ruler className="pointer-events-none absolute bottom-6 right-8 hidden w-20 rotate-12 text-slate-400 opacity-50 xl:block dark:text-slate-500" />
        {isLoading ? (
          <SyllabusThinkingLoader />
        ) : !generated ? (
          <div className="flex h-full min-h-[380px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center dark:border-white/15">
            <Pencil className="mb-3 h-10 w-10 -rotate-12 text-amber-600/50 dark:text-amber-400/40" />
            <p className="max-w-sm text-sm text-slate-600 dark:text-slate-300">
              ატვირთე სილაბუსი სემესტრული კალენდრის დასაგენერირებლად.
            </p>
          </div>
        ) : (
          <div className="fade-in flex h-full flex-col">
            <div className="mb-5 flex flex-wrap items-start gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-white/70 dark:bg-white/[0.08] ${ACCENT_CARD.violet} ${ACCENT_TEXT.violet}`}
                >
                  <CalendarDays className="h-5 w-5 stroke-[2]" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="headline text-lg font-bold text-slate-900 dark:text-slate-50">
                    სილაბუსიდან გენერირებული თარიღები
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    მონიშნე მნიშვნელოვანი დღეები დეშბორდის კალენდარში დასამატებლად.
                  </p>
                </div>
              </div>
              {visibleMilestones.length > 0 && (
                allMilestonesAdded ? (
                  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-xs font-bold ${ACCENT_PILL.green}`}>
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    ყველა დამატებულია
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddAllToCalendar}
                    className={`paper-sticker inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-xs font-bold ${ACCENT_SOLID.violet}`}
                  >
                    <CalendarPlus className="h-3.5 w-3.5 shrink-0" />
                    ყველას დამატება ({pendingMilestones.length})
                  </button>
                )
              )}
            </div>

            {aiInsight && (
              <div className={`mb-5 rounded-2xl border-2 p-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300 ${ACCENT_CARD.amber}`}>
                {aiInsight}
              </div>
            )}

            {/* A bento of landscape cards rather than one long column: a
                semester is a dozen dates, and the point is to take them in
                at a glance instead of scrolling past them one at a time.
                The nearest date takes the wide tile. */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {visibleMilestones.map((item, index) => {
                const added =
                  addedIds.has(item.id) || isMilestoneOnDashboard(item.id);
                const meta = TYPE_META[item.type];
                const Icon = meta.icon;
                return (
                  <article
                    key={item.id}
                    className={`stagger-in flex flex-col justify-between gap-3 rounded-2xl border-2 p-4 transition-transform duration-300 hover:-translate-y-1 ${PLAIN_CARD} ${
                      index === 0 ? "sm:col-span-2" : ""
                    }`}
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 text-[10px] font-bold ${meta.badge}`}
                        >
                          <Icon className="h-3 w-3 stroke-[2.5]" aria-hidden />
                          {meta.label}
                        </span>
                        {item.week && (
                          <span
                            className={`inline-flex items-center rounded-full border-2 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 ${PLAIN_CARD}`}
                          >
                            კვირა {item.week}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold leading-snug text-slate-900 dark:text-slate-50">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {formatIsoDateGeorgian(item.date)}
                      </p>
                      {item.topic && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                          {item.topic}
                        </p>
                      )}
                    </div>

                    {added ? (
                      <span
                        className={`inline-flex w-fit items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold ${ACCENT_PILL.green}`}
                      >
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                        დამატებულია
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddToCalendar(item)}
                        className={`inline-flex w-fit items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold text-slate-700 transition dark:text-slate-200 ${PLAIN_CARD}`}
                      >
                        <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                        დაამატე კალენდარში
                      </button>
                    )}
                  </article>
                );
              })}
            </div>

            <Link
              href="/study-plan"
              className={`mt-5 inline-flex items-center gap-2 text-xs font-bold ${ACCENT_TEXT.violet}`}
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
