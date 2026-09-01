"use client";

import { useEffect, useState } from "react";
import { Check, Layers, Plus, X } from "lucide-react";
import {
  DEFAULT_SEMESTER_SUBJECTS,
  SEMESTER_SUBJECTS_STORAGE_KEY,
  SUBJECT_TAG_COLORS as TAG_COLORS,
  readSemesterSubjects,
  type SemesterSubject,
} from "@/lib/semester-subjects";
import { getActiveSubject, setActiveSubject } from "@/lib/activity";

export function SemesterSubjects() {
  const [subjects, setSubjects] = useState<SemesterSubject[]>(DEFAULT_SEMESTER_SUBJECTS);
  const [semesterLabel, setSemesterLabel] = useState("2026 შემოდგომის სემესტრი");
  const [newSubject, setNewSubject] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [activeSubject, setActiveSubjectState] = useState<string | null>(null);

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

  return (
    <div className="dashboard-tool-card rounded-[32px] p-6 sm:p-8">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/10 text-violet-700 dark:bg-white/20 dark:text-white">
            <Layers className="h-4 w-4 stroke-[2]" />
          </span>
          <h3 className="headline text-lg font-bold text-[var(--text-primary)]">
            სემესტრის საგნები
          </h3>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
          {subjects.length} საგანი
        </span>
      </div>

      <input
        value={semesterLabel}
        onChange={(e) => setSemesterLabel(e.target.value)}
        placeholder="სემესტრის დასახელება..."
        className="mt-2 w-full max-w-xs border-b border-dashed border-[var(--border)] bg-transparent pb-1 text-sm font-semibold text-[var(--text-secondary)] outline-none focus:border-[var(--accent-primary)]"
      />

      <p className="mt-3 mb-3 text-xs text-[var(--text-muted)]">
        დააჭირე საგანს, რომელსაც ახლა სწავლობ — ასე დავითვლით შენს აქტივობას საგნების
        მიხედვით და სტატისტიკაში ნახავ, რომელ საგანზე მუშაობ ყველაზე ხშირად.
      </p>

      <div className="flex flex-wrap gap-2">
        {subjects.map((subject, idx) => {
          const color = TAG_COLORS[idx % TAG_COLORS.length];
          const isActive = activeSubject === subject.name;
          return (
            <span
              key={subject.id}
              className="inline-flex items-center gap-1 rounded-full py-1 pl-1 pr-1.5 text-sm font-semibold"
              style={{ background: color.bg, color: color.text }}
            >
              <button
                type="button"
                onClick={() => toggleActive(subject.name)}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-all ${
                  isActive ? "bg-white/70 shadow-sm dark:bg-black/25" : ""
                }`}
              >
                {isActive && <Check className="h-3 w-3" strokeWidth={3} />}
                {subject.name}
              </button>
              <button
                type="button"
                onClick={() => removeSubject(subject.id, subject.name)}
                aria-label={`${subject.name} წაშლა`}
                className="flex h-4 w-4 items-center justify-center rounded-full opacity-60 transition-opacity hover:opacity-100"
              >
                <X className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </span>
          );
        })}
        {subjects.length === 0 && (
          <p className="text-sm text-[var(--text-muted)]">ჯერ არცერთი საგანი არ დამატებულა.</p>
        )}
      </div>

      <p className="mt-3 text-xs font-semibold text-[var(--text-secondary)]">
        {activeSubject ? (
          <>
            ამჟამად სწავლობ:{" "}
            <span className="text-[var(--accent-primary)]">{activeSubject}</span>
          </>
        ) : (
          "საგანი არჩეული არ არის — დააჭირე რომელიმეს ზემოთ."
        )}
      </p>

      <div className="mt-4 flex gap-2">
        <input
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addSubject();
          }}
          placeholder="ახალი საგანი, მაგ. ფიზიკა..."
          className="h-11 flex-1 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)]"
        />
        <button
          type="button"
          onClick={addSubject}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-primary)] px-4 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 stroke-[1.75]" />
          დამატება
        </button>
      </div>
    </div>
  );
}
