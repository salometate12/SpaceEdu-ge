"use client";

import { useEffect, useState } from "react";
import { Check, Layers, Plus, X } from "lucide-react";
import {
  DEFAULT_SEMESTER_SUBJECTS,
  SEMESTER_SUBJECTS_UPDATED_EVENT,
  readSemesterSubjects,
  saveSemesterSubjects,
  type SemesterSubject,
} from "@/lib/semester-subjects";
import { getActiveSubject, setActiveSubject } from "@/lib/activity";
import { DashboardCard, dashboardCardActionClass } from "./DashboardCard";

export function SemesterSubjects() {
  const [subjects, setSubjects] = useState<SemesterSubject[]>(DEFAULT_SEMESTER_SUBJECTS);
  const [semesterLabel, setSemesterLabel] = useState("2026 შემოდგომის სემესტრი");
  const [newSubject, setNewSubject] = useState("");
  const [activeSubject, setActiveSubjectState] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Read on mount, and again when the account's copy arrives (UserDataSync).
  useEffect(() => {
    const load = () => {
      const saved = readSemesterSubjects();
      setSubjects(saved.subjects);
      if (saved.semesterLabel) setSemesterLabel(saved.semesterLabel);
      setActiveSubjectState(getActiveSubject());
    };
    load();
    window.addEventListener(SEMESTER_SUBJECTS_UPDATED_EVENT, load);
    return () => window.removeEventListener(SEMESTER_SUBJECTS_UPDATED_EVENT, load);
  }, []);

  // Saved only on the student's own edits, so opening the page never
  // counts as a change to send to the account.
  const save = (nextSubjects: SemesterSubject[], nextLabel: string) => {
    setSubjects(nextSubjects);
    setSemesterLabel(nextLabel);
    saveSemesterSubjects({ subjects: nextSubjects, semesterLabel: nextLabel });
  };

  const addSubject = () => {
    const name = newSubject.trim();
    if (!name) return;
    save([...subjects, { id: crypto.randomUUID(), name }], semesterLabel);
    setNewSubject("");
  };

  const removeSubject = (id: string, name: string) => {
    save(subjects.filter((subject) => subject.id !== id), semesterLabel);
    if (activeSubject === name) {
      setActiveSubject(null);
      setActiveSubjectState(null);
    }
  };

  const toggleActive = (name: string) => {
    const next = activeSubject === name ? null : name;
    setActiveSubject(next);
    setActiveSubjectState(next);
  };

  const openAdder = () => setAdding(true);

  const hasSubjects = subjects.length > 0;

  return (
    <DashboardCard
      icon={Layers}
      tone="violet"
      title="სემესტრის საგნები"
      subtitle={
        <input
          value={semesterLabel}
          onChange={(e) => save(subjects, e.target.value)}
          placeholder="სემესტრის დასახელება..."
          aria-label="სემესტრის დასახელება"
          className="-mx-1 w-full max-w-xs rounded-md bg-transparent px-1 text-sm text-[var(--text-secondary)] outline-none transition-colors placeholder:text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] focus:bg-[var(--bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/40"
        />
      }
      meta={hasSubjects ? `${subjects.length} საგანი` : undefined}
      action={
        hasSubjects && !adding ? (
          <button
            type="button"
            onClick={openAdder}
            aria-label="საგნის დამატება"
            className={dashboardCardActionClass}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            დამატება
          </button>
        ) : undefined
      }
    >
      {hasSubjects ? (
        <>
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            {activeSubject ? (
              <>
                ახლა სწავლობ:{" "}
                <span className="font-medium text-[var(--accent-primary)]">{activeSubject}</span>
              </>
            ) : (
              "აირჩიე, რას სწავლობ ახლა"
            )}
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {subjects.map((subject) => {
              const isActive = activeSubject === subject.name;
              return (
                // Grows with the name (up to two lines) instead of a fixed
                // height; ✕ stays at the right edge, centred.
                <li
                  key={subject.id}
                  className={`group inline-flex min-h-8 max-w-full items-center rounded-[18px] border text-sm transition-colors ${
                    isActive
                      ? "border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                      : "border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-secondary)]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleActive(subject.name)}
                    aria-pressed={isActive}
                    title={subject.name}
                    className="flex min-w-0 items-center gap-1.5 self-stretch rounded-[18px] py-1.5 pl-3 text-left font-medium leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50"
                  >
                    {isActive && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />}
                    <span className="line-clamp-2 min-w-0 break-words">{subject.name}</span>
                  </button>
                  {/* 40×40 touch target; the round hover mark inside stays 24px. */}
                  <button
                    type="button"
                    onClick={() => removeSubject(subject.id, subject.name)}
                    aria-label={`${subject.name} წაშლა`}
                    className="group/x -my-1 flex h-10 w-9 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] focus-visible:outline-none"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full transition-colors group-hover/x:bg-[var(--bg-secondary)] group-hover/x:text-[var(--text-primary)] group-focus-visible/x:ring-2 group-focus-visible/x:ring-[var(--accent-primary)]/50">
                      <X className="h-3 w-3" strokeWidth={2.25} aria-hidden />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        !adding && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--text-muted)]">ჯერ არცერთი საგანი არ დამატებულა</p>
            <button type="button" onClick={openAdder} className={dashboardCardActionClass}>
              <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              საგნის დამატება
            </button>
          </div>
        )
      )}

      {adding && (
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addSubject();
          }}
        >
          <input
            // Only mounts when the student asked to add a subject.
            autoFocus
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setNewSubject("");
                setAdding(false);
              }
            }}
            placeholder="ახალი საგანი, მაგ. ფიზიკა..."
            aria-label="ახალი საგანი"
            className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20"
          />
          <button
            type="submit"
            disabled={!newSubject.trim()}
            className="h-10 shrink-0 rounded-xl bg-[var(--accent-primary)] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            დამატება
          </button>
          <button
            type="button"
            onClick={() => {
              setNewSubject("");
              setAdding(false);
            }}
            aria-label="გაუქმება"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
        </form>
      )}
    </DashboardCard>
  );
}
