"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type FieldType =
  | "text"
  | "number"
  | "textarea"
  | "select"
  | "password"
  | "boolean";

export interface FormFieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  rows?: number;
}

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  mono?: boolean;
}

interface TableManagerProps<T extends object> {
  title: string;
  description?: string;
  idKey: keyof T & string;
  columns: ColumnDef<T>[];
  fields: FormFieldDef[];
  rows: T[];
  loading?: boolean;
  pageSize?: number;
  searchPlaceholder?: string;
  searchKeys: (keyof T & string)[];
  onCreate: (draft: Record<string, unknown>) => Promise<void>;
  onUpdate: (row: T) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  createLabel?: string;
  allowCreate?: boolean;
  allowDelete?: boolean;
}

function readFieldValue(row: object, key: string): string {
  const value = (row as Record<string, unknown>)[key];
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function parseFieldValue(field: FormFieldDef, raw: string): unknown {
  if (field.type === "number") {
    if (raw.trim() === "") return null;
    return Number(raw);
  }
  if (field.type === "boolean") return raw === "true";
  if (field.key.endsWith("Json") || field.key === "questions") {
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error(`Invalid JSON in ${field.label}`);
    }
  }
  return raw.trim();
}

export function TableManager<T extends object>({
  title,
  description,
  idKey,
  columns,
  fields,
  rows,
  loading = false,
  pageSize = 20,
  searchPlaceholder = "Search rows...",
  searchKeys,
  onCreate,
  onUpdate,
  onDelete,
  createLabel = "Add",
  allowCreate = true,
  allowDelete = true,
}: TableManagerProps<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("edit");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [activeRow, setActiveRow] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((row) =>
      searchKeys
        .map((key) => String(row[key] ?? ""))
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, rows, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageRows = filteredRows.slice(page * pageSize, page * pageSize + pageSize);

  function openCreateModal() {
    const empty: Record<string, string> = {};
    for (const field of fields) {
      empty[field.key] = field.type === "boolean" ? "false" : "";
    }
    setDraft(empty);
    setActiveRow(null);
    setModalMode("create");
    setModalError(null);
    setModalOpen(true);
  }

  function openEditModal(row: T) {
    const next: Record<string, string> = {};
    for (const field of fields) {
      next[field.key] = readFieldValue(row, field.key);
    }
    setDraft(next);
    setActiveRow(row);
    setModalMode("edit");
    setModalError(null);
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setModalError(null);
    setSaving(true);

    try {
      const parsed: Record<string, unknown> = {};
      for (const field of fields) {
        parsed[field.key] = parseFieldValue(field, draft[field.key] ?? "");
      }

      if (modalMode === "create") {
        await onCreate(parsed);
      } else if (activeRow) {
        await onUpdate({ ...activeRow, ...parsed } as T);
      }

      setModalOpen(false);
    } catch (submitError) {
      setModalError(
        submitError instanceof Error ? submitError.message : "Could not save row.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: T) {
    const id = String(row[idKey] ?? "");
    if (!id) return;
    if (!window.confirm(`Delete "${id}"?`)) return;
    await onDelete(id);
  }

  return (
    <div className="admin-panel p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
        </div>
        {allowCreate ? (
          <Button type="button" onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            {createLabel}
          </Button>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400/60"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            className="admin-input w-full pl-10"
          />
        </div>
        <p className="text-sm text-zinc-500">{filteredRows.length} results</p>
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-zinc-400">Loading data...</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="admin-table min-w-full text-left text-sm">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={String(row[idKey])}>
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={column.mono ? "font-mono text-cyan-200" : "text-zinc-300"}
                      >
                        {column.render
                          ? column.render(row)
                          : String(row[column.key as keyof T] ?? "—")}
                      </td>
                    ))}
                    <td className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="admin-edit-btn inline-flex items-center gap-1.5"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                          Edit
                        </button>
                        {allowDelete ? (
                          <button
                            type="button"
                            onClick={() => void handleDelete(row)}
                            className="admin-delete-btn inline-flex items-center gap-1.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                className="admin-pagination-btn"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                className="admin-pagination-btn"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {modalOpen ? (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="admin-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="admin-kicker">{modalMode === "create" ? "Create" : "Edit"}</p>
                <h3 className="text-lg font-bold text-white">{title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="admin-pagination-btn"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
              {fields.map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-cyan-300/80">
                    {field.label}
                  </span>
                  {field.type === "textarea" ? (
                    <textarea
                      value={draft[field.key] ?? ""}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, [field.key]: event.target.value }))
                      }
                      className="admin-input min-h-[120px] w-full font-mono text-sm"
                      rows={field.rows ?? 6}
                      placeholder={field.placeholder}
                      required={field.required}
                      disabled={saving}
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={draft[field.key] ?? ""}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, [field.key]: event.target.value }))
                      }
                      className="admin-input w-full"
                      required={field.required}
                      disabled={saving}
                    >
                      {(field.options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "boolean" ? (
                    <select
                      value={draft[field.key] ?? "false"}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, [field.key]: event.target.value }))
                      }
                      className="admin-input w-full"
                      disabled={saving}
                    >
                      <option value="false">Disabled</option>
                      <option value="true">Enabled</option>
                    </select>
                  ) : (
                    <input
                      type={field.type === "password" ? "password" : field.type}
                      value={draft[field.key] ?? ""}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, [field.key]: event.target.value }))
                      }
                      className={`admin-input w-full ${field.type === "number" ? "font-mono" : ""}`}
                      placeholder={field.placeholder}
                      required={field.required}
                      disabled={saving}
                    />
                  )}
                </label>
              ))}

              {modalError ? (
                <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {modalError}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
