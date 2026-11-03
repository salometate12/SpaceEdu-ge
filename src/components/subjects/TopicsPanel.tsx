"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Layers,
  ListChecks,
  Loader2,
  Pencil,
  Play,
  Plus,
  Presentation,
  ScrollText,
  Trash2,
} from "lucide-react";
import { addTopic, deleteTopic, renameTopic, setTopicStatus } from "@/lib/subject-store";
import type { TopicTool } from "@/lib/subject-actions";
import type { SubjectNote } from "@/lib/subject-notes";
import { FILE_KINDS, type SubjectFile, type SubjectTopic } from "@/lib/subjects";
import { MoreMenu } from "./MoreMenu";
import { NotesBlock } from "./NoteRows";

const TOOLS: { id: TopicTool; label: string; icon: typeof Layers }[] = [
  { id: "quiz", label: "ქვიზი", icon: ListChecks },
  { id: "cards", label: "ფლეშბარათები", icon: Layers },
  { id: "presentation", label: "პრეზენტაცია", icon: Presentation },
  { id: "summary", label: "კონსპექტი", icon: ScrollText },
];

const kindLabel = (kind: SubjectFile["kind"]) => FILE_KINDS.find((item) => item.id === kind)?.label ?? "";

function StatusChips({ topic }: { topic: SubjectTopic }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {topic.status === "done" ? (
        <span className="sj-status st-done">ნასწავლი</span>
      ) : topic.status === "in_progress" ? (
        <span className="sj-status st-current">მიმდინარე</span>
      ) : topic.quizPercent === undefined ? (
        <span className="sj-status st-new">ჯერ არ დაწყებულა</span>
      ) : null}
      {topic.quizPercent !== undefined ? <span className="sj-status st-quiz">ქვიზი {topic.quizPercent}%</span> : null}
    </span>
  );
}

function TopicRow({
  topic,
  number,
  files,
  notes,
  open,
  onToggle,
  onStudy,
  onTool,
  onOpenFile,
  busy,
}: {
  topic: SubjectTopic;
  number: number;
  files: SubjectFile[];
  notes: SubjectNote[];
  open: boolean;
  onToggle: () => void;
  onStudy: () => void;
  onTool: (tool: TopicTool) => void;
  onOpenFile: (file: SubjectFile) => void;
  busy: boolean;
}) {
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(topic.title);
  const current = topic.status === "in_progress";
  const save = () => {
    renameTopic(topic.id, title);
    setRenaming(false);
  };

  const menu = (
    <MoreMenu
      label={`${topic.title}: მეტი`}
      items={[
        // Phone: the tools the card doesn't show.
        ...TOOLS.filter((tool) => tool.id === "presentation" || tool.id === "summary").map((tool) => ({
          label: tool.label,
          icon: <tool.icon className="h-4 w-4" aria-hidden />,
          onSelect: () => onTool(tool.id),
        })),
        topic.status === "done"
          ? { label: "დაბრუნება მიმდინარეში", icon: <Play className="h-4 w-4" aria-hidden />, onSelect: () => setTopicStatus(topic.id, "in_progress") }
          : { label: "მონიშნე ნასწავლად", icon: <Check className="h-4 w-4" aria-hidden />, onSelect: () => setTopicStatus(topic.id, "done") },
        { label: "გადარქმევა", icon: <Pencil className="h-4 w-4" aria-hidden />, onSelect: () => setRenaming(true) },
        { label: "წაშლა", icon: <Trash2 className="h-4 w-4" aria-hidden />, onSelect: () => deleteTopic(topic.id), danger: true },
      ]}
    />
  );

  return (
    <li className={`rounded-[18px] max-sm:border max-sm:border-[var(--sj-border)] ${open ? "bg-[var(--sj-open)]" : ""}`}>
      <div className="flex items-center gap-3 p-2.5 sm:p-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--sj-soft)] text-[13.5px] font-bold text-[var(--sj-title)]" aria-hidden>
          {number}
        </span>
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input
              autoFocus
              value={title}
              aria-label="თემის ახალი სახელი"
              onChange={(event) => setTitle(event.target.value)}
              onBlur={save}
              onKeyDown={(event) => {
                if (event.key === "Enter") save();
                if (event.key === "Escape") setRenaming(false);
              }}
              className="sj-input h-9 w-full"
            />
          ) : (
            <button type="button" onClick={onToggle} aria-expanded={open} className="sj-focus block w-full rounded-md text-left">
              <span className="block text-[15px] font-semibold leading-snug text-[var(--sj-title)]">{topic.title}</span>
              <span className="mt-0.5 block text-[13px] text-[var(--sj-muted)]">{notes.length || files.length ? `${notes.length} ჩანაწერი · ${files.length} ფაილი` : "ჩანაწერი და ფაილი ჯერ არ არის"}</span>
            </button>
          )}
          <span className="mt-1.5 block">
            <StatusChips topic={topic} />
          </span>
        </div>
        <button
          type="button"
          onClick={onStudy}
          disabled={busy}
          className={`${current ? "sj-primary" : "sj-secondary"} sj-focus h-9 px-3.5 text-[13.5px] max-sm:!hidden`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
          დაიწყე სწავლა
        </button>
        <span className="max-sm:hidden">{menu}</span>
        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? "დაკეცვა" : "გახსნა"}
          aria-expanded={open}
          className="sj-focus flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--sj-muted)] hover:bg-[var(--sj-hover)]"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </div>
      {open ? (
        <div className="flex flex-col gap-4 px-3 pb-4 sm:pl-[56px]">
          <NotesBlock subjectId={topic.subjectId} topicId={topic.id} notes={notes} />
          {files.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {files.map((file) => {
                const Icon = /\.(png|jpe?g|webp)$/i.test(file.name) ? ImageIcon : FileText;
                return (
                  <li key={file.id}>
                    <button type="button" onClick={() => onOpenFile(file)} className="sj-focus flex w-full items-center gap-2.5 rounded-[12px] px-2 py-2 text-left hover:bg-[var(--sj-hover)]">
                      <span className={`sj-kind kind-${file.kind} flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]`} aria-hidden>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[var(--sj-title)]">{file.name}</span>
                      <span className="shrink-0 text-[12.5px] text-[var(--sj-muted)]">{kindLabel(file.kind)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[13.5px] text-[var(--sj-muted)]">ფაილი ჯერ არ აქვს. ატვირთე მასალებში და თემას თავად მივაბამთ.</p>
          )}
          <div>
            <p className="text-[13px] font-semibold text-[var(--sj-muted)]">ამ თემაზე შექმენი:</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button type="button" onClick={onStudy} disabled={busy} className="sj-primary sj-focus h-[38px] px-4 text-[13.5px] sm:!hidden">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
                დაიწყე სწავლა
              </button>
              {TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => onTool(tool.id)}
                  className={`sj-tool tool-${tool.id} sj-focus ${tool.id === "presentation" || tool.id === "summary" ? "max-sm:!hidden" : ""}`}
                >
                  <tool.icon className="h-4 w-4" aria-hidden />
                  {tool.label}
                </button>
              ))}
              <span className="ml-auto sm:hidden">{menu}</span>
            </div>
          </div>
        </div>
      ) : null}
    </li>
  );
}

/**
 * A subject's topics, in order: from its syllabus or added by hand, each
 * with its notes, files, status and „დაიწყე სწავლა“; opened, the topic's
 * notes („+ ჩანაწერი“), files and a button per tool. Notes without a topic
 * are listed under the topics.
 */
export function TopicsPanel({
  subjectId,
  topics,
  files,
  notes,
  initialOpen = null,
  onStudy,
  onTool,
  onOpenFile,
  busyTopic,
  adding,
  setAdding,
}: {
  subjectId: string;
  topics: SubjectTopic[];
  files: SubjectFile[];
  notes: SubjectNote[];
  /** `?topic=`: open when the page opens (back from a note). */
  initialOpen?: string | null;
  onStudy: (topic: SubjectTopic) => void;
  onTool: (tool: TopicTool, topic: SubjectTopic) => void;
  onOpenFile: (file: SubjectFile) => void;
  busyTopic: string | null;
  adding: boolean;
  setAdding: (value: boolean) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(initialOpen);
  const topicIds = new Set(topics.map((topic) => topic.id));
  const loose = notes.filter((note) => !note.topicId || !topicIds.has(note.topicId));
  const [draft, setDraft] = useState("");
  const fromSyllabus = topics.filter((topic) => topic.source === "syllabus").length;

  const submit = () => {
    if (addTopic(subjectId, draft)) setDraft("");
    setAdding(false);
  };

  return (
    <section aria-labelledby="sj-topics" className="sj-card min-w-0 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 id="sj-topics" className="text-[19px] font-bold text-[var(--sj-title)]">
            თემები
          </h2>
          <p className="text-[13px] text-[var(--sj-muted)]">
            {fromSyllabus > 0 ? `სილაბუსიდან · ${fromSyllabus} თემა` : `${topics.length} თემა`}
          </p>
        </div>
        <button type="button" onClick={() => setAdding(true)} className="sj-secondary sj-focus h-10 px-4 text-[14px]">
          <Plus className="h-4 w-4" aria-hidden />
          თემა
        </button>
      </div>

      {adding ? (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="თემის სახელი" aria-label="თემის სახელი" className="sj-input min-w-0 flex-1" />
          <button type="submit" disabled={!draft.trim()} className="sj-primary sj-focus h-[42px] px-4 text-[14px]">
            დამატება
          </button>
          <button type="button" onClick={() => setAdding(false)} className="sj-secondary sj-focus h-[42px] px-4 text-[14px]">
            გაუქმება
          </button>
        </form>
      ) : null}

      {topics.length > 0 ? (
        <ol className="mt-3 flex flex-col gap-1 max-sm:gap-2">
          {topics.map((topic, index) => (
            <TopicRow
              key={topic.id}
              topic={topic}
              number={index + 1}
              files={files.filter((file) => file.topicIds.includes(topic.id))}
              notes={notes.filter((note) => note.topicId === topic.id)}
              open={openId === topic.id}
              onToggle={() => setOpenId((current) => (current === topic.id ? null : topic.id))}
              onStudy={() => onStudy(topic)}
              onTool={(tool) => onTool(tool, topic)}
              onOpenFile={onOpenFile}
              busy={busyTopic === topic.id}
            />
          ))}
        </ol>
      ) : !adding ? (
        <p className="mt-4 text-[14px] text-[var(--sj-muted)]">თემები ჯერ არ არის. ატვირთე სილაბუსი ან დაამატე ხელით.</p>
      ) : null}

      {loose.length > 0 || topics.length === 0 ? (
        <div className="mt-4 border-t border-[var(--sj-border)] px-1 pt-4">
          <NotesBlock subjectId={subjectId} notes={loose} title={topics.length ? "თემის გარეშე ჩანაწერები" : "ჩანაწერები"} empty="ჩანაწერი ჯერ არ არის." />
        </div>
      ) : null}
    </section>
  );
}
