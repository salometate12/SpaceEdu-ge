"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, FolderOpen, Image as ImageIcon, Loader2, Sparkles, UploadCloud, X } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { FieldError } from "@/components/ui/Alert";
import { DEFAULT_TASK_SECTIONS, TASK_TYPES, type TaskHelperResult, type TaskSection, type TaskType } from "@/lib/ai/task-helper-schema";
import { localDay } from "@/lib/task-helper";
import { newTaskHelperId, saveTaskHelper } from "@/lib/task-helper-store";
import { readSemesterSubjects, type SemesterSubject } from "@/lib/semester-subjects";
import { logActivity } from "@/lib/activity-log";

const SECTIONS: { id: TaskSection; label: string }[] = [
  { id: "steps", label: "ნაბიჯები" },
  { id: "ideas", label: "იდეები" },
  { id: "tips", label: "რჩევები" },
  { id: "presentation", label: "პრეზენტაცია" },
];

const ACCEPT = ".pdf,.docx,.png,.jpg,.jpeg,.webp,.txt,application/pdf,image/*";
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const GENERATION_ERROR = "გეგმა ვერ შევადგინეთ. სცადე თავიდან.";

const sizeLabel = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

/** The sky dropzone: a file picked or dropped. */
function Dropzone({ file, onFile, onClear }: { file: File | null; onFile: (file: File) => void; onClear: () => void }) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  if (file) {
    const Icon = /\.(png|jpe?g|webp)$/i.test(file.name) ? ImageIcon : FileText;
    return (
      <div className="flex h-14 items-center gap-3 rounded-[14px] border border-[var(--th-border)] pl-2.5 pr-1.5">
        <span className="th-tile flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]" aria-hidden>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-[var(--th-title)]">{file.name}</span>
        <span className="shrink-0 text-[13px] text-[var(--th-muted)]">{sizeLabel(file.size)}</span>
        <button type="button" onClick={onClear} aria-label="ფაილის მოშორება" className="th-focus flex h-9 w-9 items-center justify-center rounded-full text-[var(--th-muted)] hover:bg-[var(--th-hover)]">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    );
  }
  return (
    <label
      htmlFor={id}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const dropped = event.dataTransfer.files?.[0];
        if (dropped) onFile(dropped);
      }}
      className={`flex min-h-[190px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[18px] border-[1.5px] border-dashed px-4 py-6 text-center transition-colors focus-within:ring-2 focus-within:ring-[#e11d74]/40 ${
        dragging ? "border-[var(--th-sky-solid)] bg-[var(--th-sky-bg)]" : "border-[var(--th-sky-line)] bg-[var(--th-sky-bg)] hover:border-[var(--th-sky-solid)]"
      }`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--th-card)] text-[var(--th-sky)]" aria-hidden>
        <UploadCloud className="h-5 w-5" />
      </span>
      <span className="text-[15.5px] font-semibold text-[var(--th-title)]">ჩააგდე დავალების ფაილი</span>
      <span className="text-[13px] text-[var(--th-muted)]">PDF, DOCX, JPG, PNG · ბრიფი, ინსტრუქცია ან სილაბუსის ნაწილი</span>
      <input
        id={id}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => {
          const picked = event.target.files?.[0];
          event.target.value = "";
          if (picked) onFile(picked);
        }}
      />
    </label>
  );
}

/**
 * The task helper's first screen: the assignment (a file or pasted text)
 * and what's hard about it on the left; its type, subject, due date and
 * which sections to write on the right. `?subject=` picks the subject.
 */
export function TaskHelperInput() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"file" | "text">("file");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("other");
  const [subjects, setSubjects] = useState<SemesterSubject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [sections, setSections] = useState<TaskSection[]>(DEFAULT_TASK_SECTIONS);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // „ჩემი საგნები“ for the dropdown; `?subject=` (an id or a name) picks one.
  const wanted = params.get("subject");
  useEffect(() => {
    void Promise.resolve().then(() => {
      const list = readSemesterSubjects().subjects;
      setSubjects(list);
      const match = wanted ? list.find((item) => item.id === wanted || item.name === wanted) : undefined;
      if (match) setSubjectId(match.id);
    });
  }, [wanted]);

  const pickFile = (next: File) => {
    if (next.size > MAX_FILE_BYTES) {
      setError("ფაილი ძალიან დიდია. მაქსიმუმ 20 MB.");
      return;
    }
    if (!/\.(pdf|docx|png|jpe?g|webp|txt)$/i.test(next.name)) {
      setError("აქ PDF, DOCX, JPG და PNG ფაილები იტვირთება.");
      return;
    }
    setError(null);
    setFile(next);
  };

  const toggleSection = (section: TaskSection) =>
    setSections((current) => (current.includes(section) ? current.filter((item) => item !== section) : [...current, section]));

  const missing = mode === "file" ? (file ? null : "ატვირთე დავალების ფაილი.") : text.trim() ? null : "ჩასვი დავალების ტექსტი.";
  const today = localDay();
  const pastDue = Boolean(dueDate) && dueDate < today;

  const submit = async () => {
    if (missing || loading) return;
    setLoading(true);
    setError(null);
    const subject = subjects.find((item) => item.id === subjectId);
    const formData = new FormData();
    if (mode === "file" && file) formData.append("file", file, file.name);
    else formData.append("text", text);
    if (note.trim()) formData.append("note", note.trim());
    formData.append("taskType", taskType);
    if (subject) formData.append("subject", subject.name);
    if (dueDate) formData.append("dueDate", dueDate);
    formData.append("today", today);
    for (const section of sections.length > 0 ? sections : DEFAULT_TASK_SECTIONS) formData.append("sections", section);
    try {
      const response = await fetch("/api/task-helper", { method: "POST", body: formData });
      const data = (await response.json()) as {
        result?: TaskHelperResult;
        sections?: TaskSection[];
        inputText?: string;
        message?: string;
        error?: string | boolean;
      };
      if (!response.ok || !data.result) {
        throw new Error(typeof data.message === "string" && data.message ? data.message : GENERATION_ERROR);
      }
      const now = Date.now();
      const id = newTaskHelperId(now);
      saveTaskHelper({
        id,
        title: data.result.title,
        taskType,
        sections: data.sections ?? sections,
        ...(subject ? { subjectId: subject.id, subjectName: subject.name } : {}),
        ...(dueDate ? { dueDate } : {}),
        inputText: data.inputText ?? (mode === "text" ? text : ""),
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(mode === "file" && file ? { fileName: file.name } : {}),
        result: data.result,
        doneSteps: [],
        chosenIdea: null,
        messages: [],
        createdAt: now,
        updatedAt: now,
        lastOpenedAt: now,
      });
      logActivity({ type: "tool_open", tool: "other", subject: subject?.name ?? null, meta: { tool: "task-helper", title: data.result.title } });
      router.replace(`/task-helper?id=${encodeURIComponent(id)}`);
    } catch (caught) {
      setError(caught instanceof Error && caught.message ? caught.message : GENERATION_ERROR);
      setLoading(false);
    }
  };

  const label = "text-[14px] font-bold text-[var(--th-title)]";

  return (
    <div className="th under-site-header min-h-dvh max-md:-mt-[var(--safe-top)] max-md:-mb-36 max-md:pb-36">
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-[calc(var(--safe-top)+16px)] sm:px-6 md:pt-10">
        <header className="flex items-start gap-3 sm:gap-4">
          <BackButton fallbackHref="/dashboard-student" />
          <div className="min-w-0 flex-1">
            <h1 className="text-[24px] font-bold leading-tight tracking-tight text-[var(--th-title)] sm:text-[30px]">დავალების დამხმარე</h1>
            <p className="mt-1 text-[14.5px] text-[var(--th-muted)] sm:text-[15.5px]">ატვირთე დავალება და მიიღე გეგმა, იდეები და პრეზენტაციის სტრუქტურა</p>
          </div>
          <Link href="/library?type=tasks" className="th-secondary th-focus h-11 shrink-0 px-4 text-[14px] max-sm:w-11 max-sm:px-0">
            <FolderOpen className="h-4 w-4" aria-hidden />
            <span className="max-sm:sr-only">ჩემი მასალები</span>
          </Link>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
          <section aria-label="დავალება" className="th-card flex min-w-0 flex-col gap-5 p-4 sm:p-6">
            <div role="radiogroup" aria-label="როგორ დაამატო" className="grid grid-cols-2 gap-1 rounded-full bg-[var(--th-soft)] p-1 sm:inline-grid sm:w-fit">
              {(
                [
                  ["file", "ფაილი"],
                  ["text", "ტექსტის ჩასმა"],
                ] as const
              ).map(([id, text]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={mode === id}
                  onClick={() => {
                    setMode(id);
                    setError(null);
                  }}
                  className={`th-focus h-10 rounded-full px-5 text-[14.5px] font-semibold transition-colors ${
                    mode === id ? "bg-[var(--th-card)] text-[var(--th-title)] shadow-[0_1px_2px_rgb(0_0_0/0.08)]" : "text-[var(--th-muted)]"
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>

            {mode === "file" ? (
              <Dropzone file={file} onFile={pickFile} onClear={() => setFile(null)} />
            ) : (
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={9}
                maxLength={50_000}
                aria-label="დავალების ტექსტი"
                placeholder="ჩასვი დავალების პირობა, ბრიფი ან სილაბუსის ნაწილი"
                className="th-input min-h-[190px]"
              />
            )}

            <div>
              <label htmlFor="th-note" className={label}>
                რა გიჭირს ან რისი გაკეთება გინდა <span className="ml-1 text-[13px] font-medium text-[var(--th-muted)]">არასავალდებულო</span>
              </label>
              <textarea
                id="th-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="მაგ. იდეა არ მაქვს, საიდან დავიწყო"
                className="th-input mt-2"
              />
            </div>
            <FieldError id="th-error">{error}</FieldError>
          </section>

          <section aria-label="პარამეტრები" className="th-card flex min-w-0 flex-col gap-5 p-4 sm:p-6">
            <div>
              <p id="th-type" className={label}>
                დავალების ტიპი
              </p>
              <div role="radiogroup" aria-labelledby="th-type" className="mt-2.5 flex flex-wrap gap-2">
                {TASK_TYPES.map((type) => (
                  <button key={type.id} type="button" role="radio" aria-checked={taskType === type.id} onClick={() => setTaskType(type.id)} className="th-chip th-focus">
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="th-subject" className={label}>
                საგანი <span className="ml-1 text-[13px] font-medium text-[var(--th-muted)]">არასავალდებულო</span>
              </label>
              <select id="th-subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className="th-input mt-2 cursor-pointer">
                <option value="">ჩემი საგნებიდან</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="th-due" className={label}>
                ჩაბარების თარიღი
              </label>
              <input id="th-due" type="date" min={today} value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="th-input mt-2" />
              <p className={`mt-1.5 text-[13px] ${pastDue ? "text-rose-600 dark:text-rose-400" : "text-[var(--th-muted)]"}`}>
                {pastDue ? "თარიღი უკვე გავიდა: ნაბიჯები დღევანდელ დღეზე დალაგდება." : "გეგმას ამით დავალაგებთ"}
              </p>
            </div>

            <div>
              <p id="th-sections" className={label}>
                რა გჭირდება
              </p>
              <div role="group" aria-labelledby="th-sections" className="mt-2.5 flex flex-wrap gap-2">
                {SECTIONS.map((section) => (
                  <button key={section.id} type="button" aria-pressed={sections.includes(section.id)} onClick={() => toggleSection(section.id)} className="th-chip th-focus">
                    {section.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:border-t max-md:border-[var(--th-border)] max-md:bg-[var(--page-bg)] max-md:px-4 max-md:pb-[calc(env(safe-area-inset-bottom)+96px)] max-md:pt-3">
              {missing ? <p className="mb-2 text-center text-[13px] text-[var(--th-muted)]">{missing}</p> : null}
              <button type="button" onClick={() => void submit()} disabled={Boolean(missing) || loading} className="th-primary th-focus h-14 w-full text-[16px]">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Sparkles className="h-5 w-5" aria-hidden />}
                {loading ? "გეგმას ვადგენთ…" : "გეგმის შექმნა"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
