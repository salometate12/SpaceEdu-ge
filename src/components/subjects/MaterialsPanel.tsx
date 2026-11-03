"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Compass,
  ExternalLink,
  FileText,
  Layers,
  ListChecks,
  Loader2,
  Pencil,
  Presentation,
  ScrollText,
  Shapes,
  Tag,
  Trash2,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import { removeSubjectFile } from "@/lib/subject-files-client";
import { setFileTags, setFileTitle } from "@/lib/subject-store";
import { FILE_KINDS, fileTitle, SUBJECT_FILE_ACCEPT, type SubjectFile, type SubjectFileKind, type SubjectTopic } from "@/lib/subjects";
import { MoreMenu } from "./MoreMenu";
import type { MadeItem } from "./useSubjectsData";

const KIND_ICONS: Record<SubjectFileKind, LucideIcon> = {
  lecture: FileText,
  reading: BookOpen,
  assignment: ClipboardList,
  presentation: Presentation,
  other: Shapes,
};

const MADE_ICONS: Record<MadeItem["kind"], LucideIcon> = {
  deck: Layers,
  quiz: ListChecks,
  conspectus: ScrollText,
  presentation: Presentation,
  task: Compass,
};

const MADE_LABELS: Record<MadeItem["kind"], string> = {
  deck: "ბარათები",
  quiz: "ქვიზი",
  conspectus: "კონსპექტი",
  presentation: "პრეზენტაცია",
  task: "დავალება",
};

const MONTHS = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];
const shortDate = (date: string) => {
  const [, m, d] = date.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
};

type Editing = { fileId: string; what: "topics" | "kind" | "due" | "rename" } | null;

/** „გადარქმევა“: the title the list shows; empty brings back the file's name. */
function RenameRow({ file, onDone }: { file: SubjectFile; onDone: () => void }) {
  const [value, setValue] = useState(fileTitle(file));
  const save = () => {
    setFileTitle(file.id, value.trim() === file.name ? "" : value);
    onDone();
  };
  return (
    <form
      className="mb-2 flex items-center gap-2 rounded-[14px] bg-[var(--sj-open)] p-3"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <input
        autoFocus
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onDone();
        }}
        aria-label="ფაილის სათაური"
        className="sj-input h-9 min-w-0 flex-1"
      />
      <button type="submit" className="sj-secondary sj-focus h-9 px-3 text-[13px]">
        შენახვა
      </button>
    </form>
  );
}

function FileRow({
  file,
  topics,
  editing,
  setEditing,
  onOpen,
  taskHref,
}: {
  file: SubjectFile;
  topics: SubjectTopic[];
  editing: Editing;
  setEditing: (value: Editing) => void;
  onOpen: () => void;
  taskHref: string;
}) {
  const edit = editing?.fileId === file.id ? editing.what : null;
  const right = file.tagging ? (
    <span className="flex items-center gap-1 text-[12.5px] text-[var(--sj-muted)]">
      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ვარჩევთ
    </span>
  ) : file.kind === "assignment" && file.dueDate ? (
    <span className="text-[12.5px] font-semibold text-[var(--sj-title)]">ვადა {shortDate(file.dueDate)}</span>
  ) : (
    <span className="text-[12.5px] text-[var(--sj-muted)]">{file.topicIds.length ? `${file.topicIds.length} თემა` : "თემა არ არის"}</span>
  );

  const toggleTopic = (id: string) => {
    const next = file.topicIds.includes(id) ? file.topicIds.filter((item) => item !== id) : [...file.topicIds, id].slice(-2);
    setFileTags(file.id, { topicIds: next });
  };

  return (
    <li>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onOpen} className="sj-focus group min-w-0 flex-1 rounded-[10px] py-1.5 text-left">
          <span className="block truncate text-[14px] font-medium text-[var(--sj-title)] group-hover:underline">{fileTitle(file)}</span>
          {fileTitle(file) !== file.name ? <span className="sj-file-name block truncate text-[12px]">{file.name}</span> : null}
        </button>
        <span className="shrink-0">{right}</span>
        <MoreMenu
          label={`${fileTitle(file)}: მეტი`}
          items={[
            { label: "გახსნა", icon: <ExternalLink className="h-4 w-4" aria-hidden />, onSelect: onOpen },
            { label: "გადარქმევა", icon: <Pencil className="h-4 w-4" aria-hidden />, onSelect: () => setEditing({ fileId: file.id, what: "rename" }) },
            { label: "თემის შეცვლა", icon: <Tag className="h-4 w-4" aria-hidden />, onSelect: () => setEditing({ fileId: file.id, what: "topics" }) },
            { label: "ტიპის შეცვლა", icon: <Shapes className="h-4 w-4" aria-hidden />, onSelect: () => setEditing({ fileId: file.id, what: "kind" }) },
            ...(file.kind === "assignment"
              ? [
                  { label: "ვადის მითითება", icon: <CalendarDays className="h-4 w-4" aria-hidden />, onSelect: () => setEditing({ fileId: file.id, what: "due" }) },
                  { label: "დავალების დამხმარე", icon: <Compass className="h-4 w-4" aria-hidden />, onSelect: () => window.location.assign(taskHref) },
                ]
              : []),
            { label: "წაშლა", icon: <Trash2 className="h-4 w-4" aria-hidden />, onSelect: () => void removeSubjectFile(file), danger: true },
          ]}
        />
      </div>
      {edit === "rename" ? <RenameRow file={file} onDone={() => setEditing(null)} /> : null}
      {edit === "topics" ? (
        <div className="mb-2 rounded-[14px] bg-[var(--sj-open)] p-3">
          <p className="text-[12.5px] font-semibold text-[var(--sj-muted)]">რომელ თემას ეკუთვნის (2-მდე)</p>
          {topics.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {topics.map((topic) => (
                <button key={topic.id} type="button" aria-pressed={file.topicIds.includes(topic.id)} onClick={() => toggleTopic(topic.id)} className="sj-chip sj-chip-sm sj-focus">
                  {topic.title}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-[13px] text-[var(--sj-muted)]">თემები ჯერ არ არის.</p>
          )}
          <button type="button" onClick={() => setEditing(null)} className="sj-secondary sj-focus mt-2.5 h-8 px-3 text-[13px]">
            მზადაა
          </button>
        </div>
      ) : null}
      {edit === "kind" ? (
        <div className="mb-2 rounded-[14px] bg-[var(--sj-open)] p-3">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="ფაილის ტიპი">
            {FILE_KINDS.map((kind) => (
              <button
                key={kind.id}
                type="button"
                role="radio"
                aria-checked={file.kind === kind.id}
                onClick={() => {
                  setFileTags(file.id, { kind: kind.id });
                  setEditing(null);
                }}
                className="sj-chip sj-chip-sm sj-focus"
              >
                {kind.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {edit === "due" ? (
        <div className="mb-2 flex items-center gap-2 rounded-[14px] bg-[var(--sj-open)] p-3">
          <label htmlFor={`due-${file.id}`} className="text-[13px] font-semibold text-[var(--sj-muted)]">
            ვადა
          </label>
          <input
            id={`due-${file.id}`}
            type="date"
            defaultValue={file.dueDate}
            onChange={(event) => setFileTags(file.id, { dueDate: event.target.value || undefined })}
            className="sj-input h-9 flex-1"
          />
          <button type="button" onClick={() => setEditing(null)} className="sj-secondary sj-focus h-9 px-3 text-[13px]">
            მზადაა
          </button>
        </div>
      ) : null}
    </li>
  );
}

/**
 * A subject's materials: a dropzone for several files at once (the kind and
 * topic are guessed), the files grouped by kind, the assignment helper, and
 * what was made in SpaceEdu for this subject.
 */
export function MaterialsPanel({
  subjectId,
  files,
  topics,
  made,
  onUpload,
  onOpenFile,
  uploading,
  uploadError,
}: {
  subjectId: string;
  files: SubjectFile[];
  topics: SubjectTopic[];
  made: MadeItem[];
  onUpload: (files: File[]) => void;
  onOpenFile: (file: SubjectFile) => void;
  uploading: boolean;
  uploadError: string | null;
}) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);
  const groups = FILE_KINDS.map((kind) => ({ ...kind, files: files.filter((file) => file.kind === kind.id) })).filter((group) => group.files.length > 0);
  const latestAssignment = files.find((file) => file.kind === "assignment");
  const taskHref = (file: SubjectFile) => `/task-helper?file=${encodeURIComponent(file.id)}&subject=${encodeURIComponent(subjectId)}`;

  return (
    <section aria-labelledby="sj-materials" className="sj-card min-w-0 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <h2 id="sj-materials" className="min-w-0 flex-1 text-[19px] font-bold text-[var(--sj-title)]">
          მასალები
        </h2>
        <button type="button" onClick={() => input.current?.click()} className="sj-secondary sj-focus h-10 px-4 text-[14px]">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <UploadCloud className="h-4 w-4" aria-hidden />}
          ატვირთვა
        </button>
      </div>
      <input
        ref={input}
        id={inputId}
        type="file"
        multiple
        accept={SUBJECT_FILE_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const picked = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (picked.length) onUpload(picked);
        }}
      />
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const dropped = Array.from(event.dataTransfer.files ?? []);
          if (dropped.length) onUpload(dropped);
        }}
        className={`mt-3 flex cursor-pointer items-center gap-3 rounded-[16px] border-[1.5px] border-dashed px-4 py-3.5 transition-colors ${
          dragging ? "border-[#e11d74] bg-[#fdf2f8] dark:bg-pink-500/10" : "border-[var(--sj-field-border)] hover:border-[var(--sj-muted)]"
        }`}
      >
        <UploadCloud className="h-5 w-5 shrink-0 text-[var(--sj-muted)]" aria-hidden />
        <span className="text-[13.5px] text-[var(--sj-text)]">ჩააგდე ფაილები, თემას თავად მივაბამთ</span>
      </label>
      {uploadError ? (
        <p role="alert" className="mt-2 text-[13px] font-medium text-rose-600 dark:text-rose-400">
          {uploadError}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-4">
        {groups.map((group) => {
          const Icon = KIND_ICONS[group.id];
          return (
            <div key={group.id}>
              <p className="flex items-center gap-2 text-[13.5px] font-bold text-[var(--sj-title)]">
                <span className={`sj-kind kind-${group.id} flex h-7 w-7 items-center justify-center rounded-[8px]`} aria-hidden>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {group.label}
                <span className="font-semibold text-[var(--sj-muted)]">{group.files.length}</span>
              </p>
              <ul className="mt-1.5 flex flex-col pl-9">
                {group.files.map((file) => (
                  <FileRow key={file.id} file={file} topics={topics} editing={editing} setEditing={setEditing} onOpen={() => onOpenFile(file)} taskHref={taskHref(file)} />
                ))}
              </ul>
              {group.id === "assignment" && latestAssignment ? (
                <Link href={taskHref(latestAssignment)} className="sj-secondary sj-focus ml-9 mt-2 h-9 px-3.5 text-[13.5px]">
                  <Compass className="h-4 w-4 text-[#0369a1] dark:text-[#7dd3fc]" aria-hidden />
                  დავალების დამხმარე
                </Link>
              ) : null}
            </div>
          );
        })}

        {made.length > 0 ? (
          <div>
            <p className="text-[13.5px] font-bold text-[var(--sj-title)]">შექმნილი SpaceEdu-ში</p>
            <ul className="mt-1.5 flex flex-col">
              {made.map((item) => {
                const Icon = MADE_ICONS[item.kind];
                return (
                  <li key={item.key}>
                    <Link href={item.href} className="sj-focus flex items-center gap-2.5 rounded-[10px] py-1.5 hover:underline">
                      <Icon className="h-4 w-4 shrink-0 text-[var(--sj-muted)]" aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[var(--sj-title)]">{item.title}</span>
                      <span className="shrink-0 rounded-full bg-[var(--sj-soft)] px-2 py-0.5 text-[11.5px] font-semibold text-[var(--sj-muted)]">{MADE_LABELS[item.kind]}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
