"use client";

import { useEffect, useState } from "react";
import { Check, Layers, Plus, X } from "lucide-react";
import {
  DEFAULT_SEMESTER_SUBJECTS,
  SEMESTER_SUBJECTS_STORAGE_KEY,
  readSemesterSubjects,
  type SemesterSubject,
} from "@/lib/semester-subjects";
import { getActiveSubject, setActiveSubject } from "@/lib/activity";
import { DashboardCard, dashboardCardActionClass } from "./DashboardCard";

export function SemesterSubjects() {
  const [subjects, setSubjects] = useState<SemesterSubject[]>(DEFAULT_SEMESTER_SUBJECTS);
  const [semesterLabel, setSemesterLabel] = useState("2026 შემოდგომის სემესტრი");
  const [newSubject, setNewSubject] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [activeSubject, setActiveSubjectState] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const saved = readSemesterSubjects();
    setSubjects(saved.subjects);
    if (saved.semesterLabel) setSemesterLabel(saved.semesterLabel);
    setActiveSubjectState(getActiveSubject());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      SEMESTER_SUBJECTS_STORAGE_KEY,
      JSON.stringify({ subjects, semesterLabel }),
    );
  }, [subjects, semesterLabel, hydrated]);

  const addSubject = () => {
    const name = newSubject.trim();
    if (!name) return;
    setSubjects((prev) => [...prev, { id: crypto.randomUUID(), name }]);
    setNewSubject("");
  };

  const removeSubject = (id: string, name: string) => {
    setSubjects((prev) => prev.filter((subject) => subject.id !== id));
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
      title="სემესტრის საგნები"
      subtitle={
        <input
          value={semesterLabel}
          onChange={(e) => setSemesterLabel(e.target.value)}
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
                <li
                  key={subject.id}
                  className={`group inline-flex h-8 items-center rounded-full border text-sm transition-colors ${
                    isActive
                      ? "border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                      : "border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-secondary)]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleActive(subject.name)}
                    aria-pressed={isActive}
                    className="inline-flex h-full items-center gap-1.5 rounded-full pl-3 pr-1 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50"
                  >
                    {isActive && <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />}
                    {subject.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSubject(subject.id, subject.name)}
                    aria-label={`${subject.name} წაშლა`}
                    className="mr-1 flex h-6 w-6 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50"
                  >
                    <X className="h-3 w-3" strokeWidth={2.25} aria-hidden />
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
