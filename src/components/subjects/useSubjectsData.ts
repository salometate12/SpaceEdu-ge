"use client";

import { useEffect, useState } from "react";
import { getConspectusList, CONSPECTUS_UPDATED_EVENT } from "@/lib/conspectus-storage";
import { CUSTOM_DECKS_UPDATED_EVENT, getCustomDecks } from "@/lib/custom-decks";
import { listPresentations } from "@/lib/presentation-store";
import { PRESENTATIONS_UPDATED_EVENT } from "@/lib/presentation-sync-client";
import { getQuizzes, QUIZZES_UPDATED_EVENT } from "@/lib/quiz-library";
import { readSavedSemesterSubjects, readSemesterSubjects, SEMESTER_SUBJECTS_UPDATED_EVENT, type SemesterSubject } from "@/lib/semester-subjects";
import { getFiles, getTopics, SUBJECTS_UPDATED_EVENT } from "@/lib/subject-store";
import { CALENDAR_UPDATED_EVENT, getGeneratedMilestones, type SyllabusMilestone } from "@/lib/syllabus-calendar";
import { getTaskHelpers, TASK_HELPERS_UPDATED_EVENT } from "@/lib/task-helper-store";
import type { SubjectFile, SubjectTopic } from "@/lib/subjects";

/** Something made in SpaceEdu for a subject, as the materials column lists it. */
export interface MadeItem {
  key: string;
  kind: "deck" | "quiz" | "conspectus" | "presentation" | "task";
  title: string;
  href: string;
  subjectId: string;
  topicId?: string;
}

export interface SubjectsData {
  subjects: SemesterSubject[];
  semesterLabel: string;
  topics: SubjectTopic[];
  files: SubjectFile[];
  milestones: SyllabusMilestone[];
  made: MadeItem[];
  ready: boolean;
}

function readSync(): Omit<SubjectsData, "ready" | "made"> & { made: MadeItem[] } {
  const subjects = readSavedSemesterSubjects();
  const made: MadeItem[] = [
    ...getCustomDecks().flatMap((deck): MadeItem[] =>
      deck.subjectId ? [{ key: `deck:${deck.id}`, kind: "deck", title: deck.title, href: `/deck/${deck.id}`, subjectId: deck.subjectId, topicId: deck.topicId }] : [],
    ),
    ...getQuizzes().flatMap((quiz): MadeItem[] =>
      quiz.subjectId ? [{ key: `quiz:${quiz.id}`, kind: "quiz", title: quiz.title, href: `/quiz?quiz=${encodeURIComponent(quiz.id)}`, subjectId: quiz.subjectId, topicId: quiz.topicId }] : [],
    ),
    ...getConspectusList().flatMap((item): MadeItem[] =>
      item.subjectId ? [{ key: `conspectus:${item.id}`, kind: "conspectus", title: item.title, href: `/conspectus/${item.id}`, subjectId: item.subjectId, topicId: item.topicId }] : [],
    ),
    ...getTaskHelpers().flatMap((task): MadeItem[] =>
      task.subjectId ? [{ key: `task:${task.id}`, kind: "task", title: task.title, href: `/task-helper?id=${encodeURIComponent(task.id)}`, subjectId: task.subjectId, topicId: task.topicId }] : [],
    ),
  ];
  return { subjects, semesterLabel: subjects.length ? readSemesterSubjects().semesterLabel : "", topics: getTopics(), files: getFiles(), milestones: getGeneratedMilestones(), made };
}

const EMPTY: SubjectsData = { subjects: [], semesterLabel: "", topics: [], files: [], milestones: [], made: [], ready: false };

/** Everything the subject page shows, kept current (this tab, other tabs, the account). */
export function useSubjectsData(): SubjectsData {
  const [data, setData] = useState<SubjectsData>(EMPTY);
  const [presentations, setPresentations] = useState<MadeItem[]>([]);

  useEffect(() => {
    const refresh = () => setData({ ...readSync(), ready: true });
    const refreshPresentations = () => {
      listPresentations()
        .then((list) =>
          setPresentations(
            list.flatMap((item): MadeItem[] =>
              item.subjectId
                ? [{ key: `presentation:${item.id}`, kind: "presentation", title: item.title, href: `/presentation?id=${encodeURIComponent(item.id)}`, subjectId: item.subjectId, topicId: item.topicId }]
                : [],
            ),
          ),
        )
        .catch(() => setPresentations([]));
    };
    void Promise.resolve().then(() => {
      refresh();
      refreshPresentations();
    });
    const events = [
      SUBJECTS_UPDATED_EVENT,
      SEMESTER_SUBJECTS_UPDATED_EVENT,
      CALENDAR_UPDATED_EVENT,
      CUSTOM_DECKS_UPDATED_EVENT,
      QUIZZES_UPDATED_EVENT,
      CONSPECTUS_UPDATED_EVENT,
      TASK_HELPERS_UPDATED_EVENT,
      "storage",
    ];
    events.forEach((name) => window.addEventListener(name, refresh));
    window.addEventListener(PRESENTATIONS_UPDATED_EVENT, refreshPresentations);
    return () => {
      events.forEach((name) => window.removeEventListener(name, refresh));
      window.removeEventListener(PRESENTATIONS_UPDATED_EVENT, refreshPresentations);
    };
  }, []);

  return { ...data, made: [...data.made, ...presentations] };
}
