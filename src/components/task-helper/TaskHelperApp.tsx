"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getTaskHelper, markTaskHelperOpened, TASK_HELPERS_UPDATED_EVENT, type TaskHelper } from "@/lib/task-helper-store";
import { TaskHelperInput } from "./TaskHelperInput";
import { TaskHelperResult } from "./TaskHelperResult";
import "./task-helper.css";

/** A saved assignment, kept current (this tab, another tab, the account). Undefined until read. */
function useTaskHelper(id: string | null): TaskHelper | null | undefined {
  const [task, setTask] = useState<TaskHelper | null | undefined>(undefined);
  useEffect(() => {
    if (!id) return;
    const read = () => setTask(getTaskHelper(id) ?? null);
    void Promise.resolve().then(() => {
      read();
      markTaskHelperOpened(id);
    });
    window.addEventListener(TASK_HELPERS_UPDATED_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(TASK_HELPERS_UPDATED_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, [id]);
  return id ? task : null;
}

/** /task-helper: the input, or with `?id=` a saved assignment's plan. */
export function TaskHelperApp() {
  const id = useSearchParams().get("id");
  const task = useTaskHelper(id);

  if (!id) return <TaskHelperInput />;
  if (task === undefined) return <div className="th min-h-dvh" aria-busy />;
  if (!task) {
    return (
      <div className="th under-site-header flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-[18px] font-bold text-[var(--th-title)]">ეს დავალება ვერ ვიპოვე</p>
        <Link href="/task-helper" className="th-primary th-focus h-11 px-5 text-[14.5px]">
          ახალი დავალება
        </Link>
      </div>
    );
  }
  return <TaskHelperResult task={task} />;
}
