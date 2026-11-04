"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, ClipboardCheck, FileText, Zap, X, type LucideIcon } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { readSavedSemesterSubjects } from "@/lib/semester-subjects";
import { getFiles, SUBJECTS_UPDATED_EVENT } from "@/lib/subject-store";
import { fileTitle, type SubjectFile } from "@/lib/subjects";
import { CHECK_QUESTIONS, STUDY_MAX_FILES, type StudyMode } from "@/lib/study/schemas";
import { createSession, estimateMinutes, estimateParts, sessionHref, type SessionFile } from "@/lib/study/sessions";
import "../subjects.css";
import "./study.css";

const MODES: { id: StudyMode; title: string; text: string; icon: LucideIcon }[] = [
  { id: "full", title: "სრული გავლა", text: "მთელი მასალა, თავიდან ბოლომდე, მოკლე ნაწილებად. თითო ნაწილს ბოლოს ერთი კითხვა აქვს.", icon: BookOpen },
  { id: "quick", title: "სწრაფი გამეორება", text: "მხოლოდ მთავარი ცნებები და ფორმულები. გამოცდის წინ გამოგადგება.", icon: Zap },
  { id: "check", title: "შემამოწმე", text: `ჯერ ${CHECK_QUESTIONS} კითხვა. რასაც ვერ უპასუხებ, მხოლოდ იმას აგიხსნით.`, icon: ClipboardCheck },
];

export const toSessionFile = (file: SubjectFile): SessionFile => ({ id: file.id, name: fileTitleWithExtension(file), size: file.size, mime: file.mime, storagePath: file.storagePath });

/** The title from the contents with the file's own extension (the server reads the type from it). */
function fileTitleWithExtension(file: SubjectFile): string {
  const extension = file.name.match(/\.[a-z0-9]{1,8}$/i)?.[0] ?? "";
  // Only a path separator would trouble a file's name; „ლექცია 2: პროცესები“ stays as it reads.
  const title = fileTitle(file).replace(/[\\/]+/g, " ").replace(/\s+/g, " ").trim();
  return title.toLowerCase().endsWith(extension.toLowerCase()) ? title : `${title}${extension}`;
}

/**
 * „როგორ ვისწავლოთ?“ (/subjects/<id>/study/new?files=…&topic=…): the
 * chosen files (each can be taken off), three ways to study them, „დაწყება“.
 */
export function StudySetup({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const topicId = search.get("topic") ?? undefined;
  const [wanted, setWanted] = useState(() => (search.get("files") ?? "").split(",").filter(Boolean).slice(0, STUDY_MAX_FILES));
  const [files, setFiles] = useState<SubjectFile[] | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [mode, setMode] = useState<StudyMode>("full");

  useEffect(() => {
    const read = () => {
      setSubjectName(readSavedSemesterSubjects().find((subject) => subject.id === subjectId)?.name ?? "");
      setFiles(getFiles(subjectId));
    };
    void Promise.resolve().then(read);
    window.addEventListener(SUBJECTS_UPDATED_EVENT, read);
    return () => window.removeEventListener(SUBJECTS_UPDATED_EVENT, read);
  }, [subjectId]);

  const chosen = (files ?? []).filter((file) => wanted.includes(file.id));
  const remove = (id: string) => {
    const next = wanted.filter((item) => item !== id);
    setWanted(next);
    const url = new URL(window.location.href);
    url.searchParams.set("files", next.join(","));
    window.history.replaceState(window.history.state, "", url);
  };

  const minutes = estimateMinutes(chosen, "full");
  const meta: Record<StudyMode, string> = {
    full: `დაახლოებით ${minutes} წუთი · ${estimateParts(minutes)} ნაწილი`,
    quick: "დაახლოებით 15 წუთი",
    check: `${CHECK_QUESTIONS} კითხვა, მერე მხოლოდ ის, რაც ვერ იცი`,
  };

  const start = () => {
    if (chosen.length === 0) return;
    // Files of one topic (chosen in the materials): the session is that topic's.
    const shared = chosen.length ? chosen[0].topicIds.filter((id) => chosen.every((file) => file.topicIds.includes(id))) : [];
    const topic = topicId ?? (shared.length === 1 ? shared[0] : undefined);
    const session = createSession({ subjectId, topicId: topic, files: chosen.map(toSessionFile), mode });
    router.replace(sessionHref(session));
  };

  const back = `/subjects/${encodeURIComponent(subjectId)}${topicId ? `?topic=${encodeURIComponent(topicId)}` : ""}`;

  return (
    <div className="sj under-site-header min-h-dvh max-md:-mt-[var(--safe-top)] max-md:-mb-36 max-md:pb-36">
      <div className="mx-auto w-full max-w-[880px] px-4 pb-16 pt-[calc(var(--safe-top)+16px)] sm:px-6 md:pt-10">
        <header className="flex items-start gap-3 sm:gap-4">
          <BackButton fallbackHref={back} />
          <div className="min-w-0 flex-1">
            {subjectName ? <p className="truncate text-[13.5px] font-semibold text-[var(--sj-muted)]">{subjectName}</p> : null}
            <h1 className="text-[24px] font-bold leading-tight tracking-tight text-[var(--sj-title)] sm:text-[30px]">როგორ ვისწავლოთ?</h1>
          </div>
        </header>

        {files === null ? null : chosen.length === 0 ? (
          <section className="sj-card mt-6 flex flex-col items-center gap-3 px-6 py-12 text-center">
            <p className="text-[17px] font-bold text-[var(--sj-title)]">ფაილი არ არის არჩეული</p>
            <p className="max-w-sm text-[14px] text-[var(--sj-muted)]">მასალებში მონიშნე 1-დან {STUDY_MAX_FILES}-მდე ფაილი და დააჭირე „ისწავლე მონიშნულით“.</p>
            <Link href={back} className="sj-primary sj-focus h-11 px-5 text-[14.5px]">
              საგანზე დაბრუნება
            </Link>
          </section>
        ) : (
          <>
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="არჩეული ფაილები">
              {chosen.map((file) => (
                <li key={file.id} className="inline-flex h-9 max-w-full items-center gap-2 rounded-full border border-[var(--sj-field-border)] bg-[var(--sj-card)] pl-3 pr-1.5 text-[13.5px] font-semibold text-[var(--sj-title)]">
                  <FileText className="h-4 w-4 shrink-0 text-[var(--sj-muted)]" aria-hidden />
                  <span className="truncate">{fileTitle(file)}</span>
                  <button type="button" onClick={() => remove(file.id)} aria-label={`${fileTitle(file)}: მოხსნა`} className="sj-focus flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--sj-muted)] hover:bg-[var(--sj-hover)]">
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>

            <div role="radiogroup" aria-label="სწავლის რეჟიმი" className="mt-5 grid gap-3 md:grid-cols-3">
              {MODES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={mode === item.id}
                  onClick={() => setMode(item.id)}
                  className={`st-mode st-mode-${item.id} sj-focus flex flex-col gap-3 rounded-[24px] bg-[var(--sj-card)] p-5 text-left`}
                >
                  <span className="st-tile flex h-11 w-11 items-center justify-center rounded-[14px]" aria-hidden>
                    <item.icon className="h-5 w-5" />
                  </span>
                  <span className="text-[17px] font-bold text-[var(--sj-title)]">{item.title}</span>
                  <span className="text-[14px] leading-relaxed text-[var(--sj-text)]">{item.text}</span>
                  <span className="mt-auto text-[13px] font-semibold text-[var(--sj-muted)]">{meta[item.id]}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button type="button" onClick={start} className="sj-primary sj-focus h-12 px-6 text-[15px] max-sm:w-full">
                დაწყება
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
