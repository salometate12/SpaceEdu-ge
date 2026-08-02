"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { ADMIN_PASSWORD_HEADER } from "@/lib/admin/constants";
import type { AdminQuizMaterial, AdminQuizStore } from "@/lib/admin/types";
import { TableManager } from "../TableManager";

const SUBJECT_OPTIONS = [
  { value: "history", label: "History" },
  { value: "geography", label: "Geography" },
  { value: "math", label: "Math" },
  { value: "physics", label: "Physics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "biology", label: "Biology" },
  { value: "civic", label: "Civics" },
  { value: "georgian", label: "Georgian" },
  { value: "english", label: "English" },
];

function authHeaders(password: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    [ADMIN_PASSWORD_HEADER]: password,
  };
}

function normalizeQuizItem(
  draft: Record<string, unknown> | AdminQuizMaterial,
  existing?: AdminQuizMaterial,
): AdminQuizMaterial {
  const source = draft as Record<string, unknown>;
  const questions = Array.isArray(source.questions)
    ? source.questions
    : typeof source.questions === "string"
      ? JSON.parse(source.questions)
      : existing?.questions ?? [];

  const id = String(source.id ?? existing?.id ?? "").trim();
  if (!id) throw new Error("Quiz id is required");

  return {
    id,
    title: String(source.title ?? existing?.title ?? "").trim(),
    subject: String(source.subject ?? existing?.subject ?? "history").trim(),
    materialPreview: String(source.materialPreview ?? existing?.materialPreview ?? "").trim(),
    questionCount: Number(source.questionCount ?? questions.length ?? 0),
    questions,
    updatedAt: new Date().toISOString(),
  };
}

export function QuizManagerSection() {
  const { password, notifySuccess, notifyError } = useAdmin();
  const [rows, setRows] = useState<AdminQuizMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/data/quizzes", {
        headers: { [ADMIN_PASSWORD_HEADER]: password },
      });
      const payload = (await response.json()) as AdminQuizStore & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Failed to load quizzes");
      setRows(payload.items ?? []);
    } catch (error) {
      notifyError(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [password, notifyError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <TableManager<AdminQuizMaterial>
      title="Quiz Manager"
      description="Create and edit quiz materials stored in data/admin/quizzes.json."
      idKey="id"
      loading={loading}
      rows={rows}
      searchKeys={["id", "title", "subject", "materialPreview"]}
      searchPlaceholder="Search quiz title, subject, or id..."
      columns={[
        { key: "title", label: "Title" },
        { key: "subject", label: "Subject" },
        { key: "questionCount", label: "Questions", mono: true },
        {
          key: "materialPreview",
          label: "Material",
          render: (row) => (
            <span className="line-clamp-2 max-w-md text-zinc-400">{row.materialPreview}</span>
          ),
        },
      ]}
      fields={[
        { key: "id", label: "Quiz ID", type: "text", required: true, placeholder: "history-recall-01" },
        { key: "title", label: "Title", type: "text", required: true },
        {
          key: "subject",
          label: "Subject",
          type: "select",
          required: true,
          options: SUBJECT_OPTIONS,
        },
        {
          key: "materialPreview",
          label: "Learning Material Preview",
          type: "textarea",
          rows: 4,
          required: true,
        },
        { key: "questionCount", label: "Question Count", type: "number", required: true },
        {
          key: "questions",
          label: "Questions JSON",
          type: "textarea",
          rows: 12,
          required: true,
          placeholder: '[{"id":1,"questionText":"...","options":["A","B","C","D"],"correctAnswerIndex":0,"explanation":"..."}]',
        },
      ]}
      onCreate={async (draft) => {
        const item = normalizeQuizItem(draft);
        const response = await fetch("/api/admin/data/quizzes", {
          method: "POST",
          headers: authHeaders(password),
          body: JSON.stringify(item),
        });
        const payload = (await response.json()) as { ok?: boolean; data?: AdminQuizStore; error?: string };
        if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Create failed");
        setRows(payload.data?.items ?? []);
        notifySuccess(`Created quiz "${item.title}"`);
      }}
      onUpdate={async (row) => {
        const item = normalizeQuizItem(row, row);
        const response = await fetch("/api/admin/data/quizzes", {
          method: "PATCH",
          headers: authHeaders(password),
          body: JSON.stringify(item),
        });
        const payload = (await response.json()) as { ok?: boolean; data?: AdminQuizStore; error?: string };
        if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Update failed");
        setRows(payload.data?.items ?? []);
        notifySuccess(`Updated quiz "${item.title}"`);
      }}
      onDelete={async (id) => {
        const response = await fetch("/api/admin/data/quizzes", {
          method: "DELETE",
          headers: authHeaders(password),
          body: JSON.stringify({ id }),
        });
        const payload = (await response.json()) as { ok?: boolean; data?: AdminQuizStore; error?: string };
        if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Delete failed");
        setRows(payload.data?.items ?? []);
        notifySuccess(`Deleted quiz "${id}"`);
      }}
      createLabel="Add Quiz"
    />
  );
}
