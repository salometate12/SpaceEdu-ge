"use client";

import { useEffect, useState } from "react";
import { Layers, Plus, X } from "lucide-react";

const STORAGE_KEY = "spaceedu-semester-subjects";

interface Subject {
  id: string;
  name: string;
}

const DEFAULT_SUBJECTS: Subject[] = [
  { id: "default-1", name: "მონაცემთა სტრუქტურები" },
  { id: "default-2", name: "ალგორითმები" },
  { id: "default-3", name: "მათემატიკა" },
  { id: "default-4", name: "სტატისტიკა" },
];

const TAG_COLORS = [
  { bg: "#efe9fe", text: "#5b21b6" },
  { bg: "#dbeafe", text: "#1e3a8a" },
  { bg: "#fef3c7", text: "#92400e" },
  { bg: "#d1fae5", text: "#065f46" },
  { bg: "#fce7f3", text: "#9d174d" },
  { bg: "#cffafe", text: "#0e7490" },
];

export function SemesterSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [semesterLabel, setSemesterLabel] = useState("2026 შემოდგომის სემესტრი");
  const [newSubject, setNewSubject] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { subjects?: Subject[]; semesterLabel?: string };
        if (Array.isArray(parsed.subjects)) setSubjects(parsed.subjects);
        if (parsed.semesterLabel) setSemesterLabel(parsed.semesterLabel);
      }
    } catch {
      // ignore malformed storage, fall back to defaults
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ subjects, semesterLabel }));
  }, [subjects, semesterLabel, hydrated]);

  const addSubject = () => {
    const name = newSubject.trim();
    if (!name) return;
    setSubjects((prev) => [...prev, { id: crypto.randomUUID(), name }]);
    setNewSubject("");
  };

  const removeSubject = (id: string) => {
    setSubjects((prev) => prev.filter((subject) => subject.id !== id));
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
        className="mt-2 mb-4 w-full max-w-xs border-b border-dashed border-[var(--border)] bg-transparent pb-1 text-sm font-semibold text-[var(--text-secondary)] outline-none focus:border-[var(--accent-primary)]"
      />

      <div className="flex flex-wrap gap-2">
        {subjects.map((subject, idx) => {
          const color = TAG_COLORS[idx % TAG_COLORS.length];
          return (
            <span
              key={subject.id}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold"
              style={{ background: color.bg, color: color.text }}
            >
              {subject.name}
              <button
                type="button"
                onClick={() => removeSubject(subject.id)}
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
