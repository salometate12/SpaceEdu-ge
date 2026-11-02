"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { BookOpenCheck, FolderOpen, Loader2, NotebookPen, Play, Plus, UploadCloud } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { readSavedSemesterSubjects, readSemesterSubjects, saveSemesterSubjects } from "@/lib/semester-subjects";
import { prepareStudy, toolHref, type TopicTool } from "@/lib/subject-actions";
import { addSubjectFiles, getSubjectFileBlob } from "@/lib/subject-files-client";
import { getNoteByLegacyId, newNoteHref, NO_SUBJECT, noteHref } from "@/lib/subject-notes";
import { syncSyllabusTopics } from "@/lib/subject-store";
import { nextExam, SUBJECT_FILE_ACCEPT, type SubjectFile, type SubjectTopic } from "@/lib/subjects";
import { localDay } from "@/lib/task-helper";
import { LectureNotesMovedToast } from "./LectureNotesMovedToast";
import { MaterialsPanel } from "./MaterialsPanel";
import { NoteRows } from "./NoteRows";
import { TopicsPanel } from "./TopicsPanel";
import { useSubjectsData } from "./useSubjectsData";
import "./subjects.css";

const LAST_SUBJECT_KEY = "spaceedu-last-subject";
const MONTHS = ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"];
const longDate = (date: string) => {
  const [, m, d] = date.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
};

function readLast(): string | null {
  try {
    return window.localStorage.getItem(LAST_SUBJECT_KEY);
  } catch {
    return null;
  }
}

/** „+ საგანი“: a semester subject, saved where the dashboard keeps them. Returns the new id. */
function addSemesterSubject(name: string): string | null {
  const title = name.trim();
  if (!title) return null;
  // Added to the saved ones: the dashboard's sample subjects, never saved, aren't kept.
  const subject = { id: crypto.randomUUID(), name: title };
  saveSemesterSubjects({ subjects: [...readSavedSemesterSubjects(), subject], semesterLabel: readSemesterSubjects().semesterLabel });
  return subject.id;
}

/**
 * „ჩემი საგნები“: the semester subjects as chips (the URL follows without a
 * reload), and for the one open its topics, files, next exam and a button
 * per tool. Real records only: the subjects the student saved, the topics
 * of their syllabus or added by hand, the files they uploaded.
 */
export function SubjectsPage() {
  const router = useRouter();
  const params = useParams<{ id?: string[] }>();
  const search = useSearchParams();
  const data = useSubjectsData();
  const [currentId, setCurrentId] = useState<string | null>(params.id?.[0] ?? null);
  const [addingSubject, setAddingSubject] = useState(false);
  const [subjectDraft, setSubjectDraft] = useState("");
  const [addingTopic, setAddingTopic] = useState(false);
  const [tab, setTab] = useState<"topics" | "materials">("topics");
  const [busyTopic, setBusyTopic] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [today] = useState(() => localDay());
  const uploadInputId = useId();
  const uploadInput = useRef<HTMLInputElement>(null);

  // /subjects: the subject seen last, else the first.
  const subjects = data.subjects;
  const subject = subjects.find((item) => item.id === currentId) ?? null;
  // „საგნის გარეშე“: notes without a subject (or whose subject is gone); a chip only while there are some.
  const subjectIds = new Set(subjects.map((item) => item.id));
  const unsorted = data.notes.filter((note) => !note.subjectId || !subjectIds.has(note.subjectId));
  const viewingUnsorted = currentId === NO_SUBJECT && unsorted.length > 0;
  useEffect(() => {
    if (!data.ready || subject || viewingUnsorted) return;
    if (subjects.length === 0) {
      if (unsorted.length > 0) void Promise.resolve().then(() => setCurrentId(NO_SUBJECT));
      return;
    }
    const last = readLast();
    const pick = subjects.find((item) => item.id === last) ?? subjects[0];
    void Promise.resolve().then(() => setCurrentId(pick.id));
  }, [data.ready, subject, subjects, viewingUnsorted, unsorted.length]);

  // /lecture-notes?id=… (redirected here): the note it moved to, once it's here.
  const legacyId = search.get("id");
  const notesCount = data.notes.length;
  useEffect(() => {
    if (!legacyId || !data.ready) return;
    const moved = getNoteByLegacyId(legacyId);
    if (moved) router.replace(noteHref(moved));
  }, [legacyId, data.ready, notesCount, router]);

  const choose = (id: string) => {
    setCurrentId(id);
    setUploadError(null);
    setAddingTopic(false);
    window.history.pushState(null, "", `/subjects/${encodeURIComponent(id)}`);
  };

  // Remember it, and bring in its syllabus's topics.
  const subjectKey = subject ? `${subject.id}|${subject.name}` : "";
  const milestonesCount = data.milestones.length;
  useEffect(() => {
    if (!subjectKey) return;
    const [id, name] = subjectKey.split("|");
    try {
      window.localStorage.setItem(LAST_SUBJECT_KEY, id);
    } catch {
      // storage blocked: /subjects opens the first subject
    }
    syncSyllabusTopics({ id, name });
  }, [subjectKey, milestonesCount]);

  const topics = subject ? data.topics.filter((topic) => topic.subjectId === subject.id) : [];
  const files = subject ? data.files.filter((file) => file.subjectId === subject.id) : [];
  const made = subject ? data.made.filter((item) => item.subjectId === subject.id) : [];
  const notes = subject ? data.notes.filter((note) => note.subjectId === subject.id) : [];
  const done = topics.filter((topic) => topic.status === "done").length;
  const exam = subject ? nextExam(data.milestones, subject.name, today) : null;
  const firstOpen = topics.find((topic) => topic.status !== "done");
  const quizzes = made.filter((item) => item.kind === "quiz").length;

  const study = async (topic: SubjectTopic) => {
    if (!subject || busyTopic) return;
    setBusyTopic(topic.id);
    router.push(await prepareStudy(subject, topic));
  };

  const openTool = async (tool: TopicTool, topic: SubjectTopic) => {
    if (!subject || busyTopic) return;
    setBusyTopic(topic.id);
    router.push(await toolHref(tool, subject, topic));
  };

  const openFile = async (file: SubjectFile) => {
    // Opened now (a later window.open is blocked), filled once the file is here.
    const opened = window.open("", "_blank");
    const blob = await getSubjectFileBlob(file);
    if (!blob) {
      opened?.close();
      setUploadError("ფაილი ამ მოწყობილობაზე არ არის და ანგარიშიდანაც ვერ ჩამოვტვირთეთ.");
      return;
    }
    const url = URL.createObjectURL(blob);
    if (opened) opened.location.href = url;
    else window.location.assign(url);
  };

  const upload = async (picked: File[]) => {
    if (!subject) return;
    setUploading(true);
    setUploadError(await addSubjectFiles(subject.id, picked));
    setUploading(false);
  };

  const submitSubject = () => {
    const id = addSemesterSubject(subjectDraft);
    setSubjectDraft("");
    setAddingSubject(false);
    if (id) choose(id);
  };

  const subtitle = [data.semesterLabel, `${subjects.length} საგანი`].filter(Boolean).join(" · ");
  const meta = [subject?.credits ? `${subject.credits} კრედიტი` : null, notes.length ? `${notes.length} ჩანაწერი` : null, `${files.length} ფაილი`, `${quizzes} ქვიზი`]
    .filter(Boolean)
    .join(" · ");
  const empty = topics.length === 0 && files.length === 0 && notes.length === 0 && !addingTopic;

  const addSubjectForm = addingSubject ? (
    <form
      className="flex shrink-0 gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        submitSubject();
      }}
    >
      <input autoFocus value={subjectDraft} onChange={(event) => setSubjectDraft(event.target.value)} placeholder="საგნის სახელი" aria-label="საგნის სახელი" className="sj-input w-56" />
      <button type="submit" disabled={!subjectDraft.trim()} className="sj-primary sj-focus h-[42px] px-4 text-[14px]">
        დამატება
      </button>
      <button type="button" onClick={() => setAddingSubject(false)} className="sj-secondary sj-focus h-[42px] px-4 text-[14px]">
        გაუქმება
      </button>
    </form>
  ) : null;

  return (
    <div className="sj under-site-header min-h-dvh max-md:-mt-[var(--safe-top)] max-md:-mb-36 max-md:pb-36">
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-[calc(var(--safe-top)+16px)] sm:px-6 md:pt-10">
        <header className="flex items-start gap-3 sm:gap-4">
          <BackButton fallbackHref="/dashboard-student" />
          <div className="min-w-0 flex-1">
            <h1 className="text-[24px] font-bold leading-tight tracking-tight text-[var(--sj-title)] sm:text-[30px]">ჩემი საგნები</h1>
            {subjects.length ? <p className="mt-1 text-[14.5px] text-[var(--sj-muted)] sm:text-[15.5px]">{subtitle}</p> : null}
          </div>
          <Link href={subject ? `/library?subject=${encodeURIComponent(subject.id)}` : "/library"} className="sj-secondary sj-focus h-11 shrink-0 px-4 text-[14px] max-sm:w-11 max-sm:px-0">
            <FolderOpen className="h-4 w-4" aria-hidden />
            <span className="max-sm:sr-only">ჩემი მასალები</span>
          </Link>
        </header>

        {!data.ready ? null : subjects.length === 0 && unsorted.length === 0 ? (
          <section className="sj-card mt-6 flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sj-soft)] text-[var(--sj-muted)]" aria-hidden>
              <BookOpenCheck className="h-5 w-5" />
            </span>
            <p className="text-[17px] font-bold text-[var(--sj-title)]">სემესტრის საგნები ჯერ არ გაქვს</p>
            {addingSubject ? (
              addSubjectForm
            ) : (
              <button type="button" onClick={() => setAddingSubject(true)} className="sj-primary sj-focus h-11 px-5 text-[14.5px]">
                <Plus className="h-4 w-4" aria-hidden />
                საგნების დამატება
              </button>
            )}
          </section>
        ) : (
          <>
            <nav aria-label="საგნები" className="sj-scroll -mx-4 mt-6 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              {subjects.map((item) => (
                <button key={item.id} type="button" aria-current={item.id === subject?.id ? "page" : undefined} onClick={() => choose(item.id)} className="sj-chip sj-focus">
                  {item.name}
                </button>
              ))}
              {addingSubject ? (
                addSubjectForm
              ) : (
                <button type="button" onClick={() => setAddingSubject(true)} className="sj-chip sj-chip-add sj-focus">
                  <Plus className="h-4 w-4" aria-hidden />
                  საგანი
                </button>
              )}
              {unsorted.length > 0 ? (
                <button type="button" aria-current={viewingUnsorted ? "page" : undefined} onClick={() => choose(NO_SUBJECT)} className="sj-chip sj-focus">
                  საგნის გარეშე
                </button>
              ) : null}
            </nav>

            {viewingUnsorted ? (
              <section aria-label="საგნის გარეშე" className="sj-card mt-5 p-4 sm:p-6">
                <h2 className="text-[22px] font-bold leading-tight text-[var(--sj-title)] sm:text-[24px]">საგნის გარეშე</h2>
                <p className="mt-1 text-[14px] text-[var(--sj-muted)]">{unsorted.length} ჩანაწერი · საგანს ჩანაწერის გახსნისას მიაბამ</p>
                <div className="mt-4">
                  <NoteRows notes={unsorted} />
                </div>
              </section>
            ) : null}

            {subject ? (
              <>
                <section aria-label={subject.name} className="sj-card mt-5 p-4 sm:p-6">
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[22px] font-bold leading-tight text-[var(--sj-title)] sm:text-[24px]">{subject.name}</h2>
                      <p className="mt-1 text-[14px] text-[var(--sj-muted)] max-sm:hidden">{meta}</p>
                      {exam ? <p className="mt-1 text-[14px] font-semibold text-[var(--sj-exam)] sm:hidden">გამოცდამდე {exam.days} დღე</p> : null}
                    </div>
                    {topics.length > 0 ? (
                    <button
                      type="button"
                      disabled={!firstOpen || Boolean(busyTopic)}
                      onClick={() => firstOpen && void study(firstOpen)}
                      // Phone: the header stays compact; each topic card has its own button.
                      className="sj-primary sj-focus h-12 px-5 text-[15px] max-sm:!hidden"
                    >
                      {busyTopic && busyTopic === firstOpen?.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
                      დაიწყე სწავლა
                    </button>
                    ) : null}
                  </div>
                  {topics.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-[13.5px] font-semibold text-[var(--sj-title)]">
                        გავლილი თემები {done} / {topics.length}
                      </p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--sj-track)]" role="progressbar" aria-label="გავლილი თემები" aria-valuenow={done} aria-valuemin={0} aria-valuemax={topics.length}>
                        <div className="h-full rounded-full bg-[var(--sj-green)] transition-[width] duration-500" style={{ width: `${(done / topics.length) * 100}%` }} />
                      </div>
                    </div>
                  ) : null}
                  {exam ? (
                    <p className="mt-4 rounded-[16px] bg-[var(--sj-exam-bg)] px-4 py-3 text-[14px] font-semibold text-[var(--sj-exam)] max-sm:hidden">
                      {exam.label} · {longDate(exam.date)} · {exam.days === 0 ? "დღესაა" : `${exam.days} დღე`}
                    </p>
                  ) : null}
                </section>

                {empty ? (
                  <section className="sj-card mt-5 flex flex-col items-center gap-3 px-6 py-10 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sj-soft)] text-[var(--sj-muted)]" aria-hidden>
                      <BookOpenCheck className="h-5 w-5" />
                    </span>
                    <p className="text-[17px] font-bold text-[var(--sj-title)]">{subject.name} ჯერ ცარიელია</p>
                    <p className="max-w-md text-[14px] text-[var(--sj-muted)]">ატვირთე სილაბუსი და თემებს თავად ჩამოვწერთ, ან ჩააგდე ლექციები და დავალებები</p>
                    <div className="mt-1 flex flex-wrap justify-center gap-2">
                      <Link href={`/syllabus?subject=${encodeURIComponent(subject.name)}`} className="sj-primary sj-focus h-11 px-5 text-[14.5px]">
                        სილაბუსის ატვირთვა
                      </Link>
                      <button type="button" onClick={() => uploadInput.current?.click()} className="sj-secondary sj-focus h-11 px-5 text-[14.5px]">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <UploadCloud className="h-4 w-4" aria-hidden />}
                        ფაილების ატვირთვა
                      </button>
                      <button type="button" onClick={() => setAddingTopic(true)} className="sj-secondary sj-focus h-11 px-5 text-[14.5px]">
                        თემის ხელით დამატება
                      </button>
                      <Link href={newNoteHref(subject.id)} className="sj-secondary sj-focus h-11 px-5 text-[14.5px]">
                        <NotebookPen className="h-4 w-4" aria-hidden />
                        ჩანაწერის დამატება
                      </Link>
                    </div>
                    <input
                      ref={uploadInput}
                      id={uploadInputId}
                      type="file"
                      multiple
                      accept={SUBJECT_FILE_ACCEPT}
                      className="sr-only"
                      tabIndex={-1}
                      onChange={(event) => {
                        const picked = Array.from(event.target.files ?? []);
                        event.target.value = "";
                        if (picked.length) void upload(picked);
                      }}
                    />
                    {uploadError ? (
                      <p role="alert" className="text-[13px] font-medium text-rose-600 dark:text-rose-400">
                        {uploadError}
                      </p>
                    ) : null}
                  </section>
                ) : (
                  <>
                    {/* Phone: topics and materials as tabs. */}
                    <div role="tablist" aria-label="ხედი" className="mt-5 grid grid-cols-2 gap-1 rounded-full border border-[var(--sj-border)] bg-[var(--sj-card)] p-1 lg:hidden">
                      {(
                        [
                          ["topics", `თემები · ${topics.length}`],
                          ["materials", `მასალები · ${files.length}`],
                        ] as const
                      ).map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          role="tab"
                          aria-selected={tab === id}
                          onClick={() => setTab(id)}
                          className={`sj-focus h-10 rounded-full text-[14.5px] font-semibold ${tab === id ? "bg-[var(--sj-strong)] text-[var(--sj-on-strong)]" : "text-[var(--sj-text)]"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
                      <div className={tab === "topics" ? "" : "max-lg:hidden"}>
                        <TopicsPanel
                          subjectId={subject.id}
                          topics={topics}
                          files={files}
                          notes={notes}
                          initialOpen={search.get("topic")}
                          onStudy={(topic) => void study(topic)}
                          onTool={(tool, topic) => void openTool(tool, topic)}
                          onOpenFile={(file) => void openFile(file)}
                          busyTopic={busyTopic}
                          adding={addingTopic}
                          setAdding={setAddingTopic}
                        />
                      </div>
                      <div className={tab === "materials" ? "" : "max-lg:hidden"}>
                        <MaterialsPanel
                          subjectId={subject.id}
                          files={files}
                          topics={topics}
                          made={made}
                          onUpload={(picked) => void upload(picked)}
                          onOpenFile={(file) => void openFile(file)}
                          uploading={uploading}
                          uploadError={uploadError}
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : null}
          </>
        )}
      </div>
      <LectureNotesMovedToast link={false} />
    </div>
  );
}
