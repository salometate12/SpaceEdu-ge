"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Database,
  Pencil,
  Save,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  applyRowEdit,
  buildAdminUniversityRows,
  type AdminUniversityRow,
} from "@/lib/admin/handbook-rows";
import { ADMIN_PASSWORD_HEADER } from "@/lib/admin/constants";
import type { HandbookData } from "@/lib/exam-calculator/types";
import { UniversityEditModal } from "./UniversityEditModal";

interface AdminDashboardProps {
  password: string;
}

type AdminSection = "universities";

const PAGE_SIZE = 25;

export function AdminDashboard({ password }: AdminDashboardProps) {
  const [section, setSection] = useState<AdminSection>("universities");
  const [handbook, setHandbook] = useState<HandbookData | null>(null);
  const [rows, setRows] = useState<AdminUniversityRow[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<AdminUniversityRow | null>(null);

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/universities", {
        headers: { [ADMIN_PASSWORD_HEADER]: password },
      });
      const payload = (await response.json()) as {
        data?: HandbookData;
        rows?: AdminUniversityRow[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load university data");
      }

      setHandbook(payload.data ?? null);
      setRows(payload.rows ?? []);
      setDirty(false);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!dirty || !handbook) return;

    setSaving(true);
    setStatus(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/universities", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          [ADMIN_PASSWORD_HEADER]: password,
        },
        body: JSON.stringify({ data: handbook }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Save failed");
      }

      setDirty(false);
      setStatus("All changes written to data/universities.json.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSave(updatedRow: AdminUniversityRow) {
    if (!handbook) {
      throw new Error("Handbook data is not loaded.");
    }

    const previousHandbook = handbook;
    const previousRows = rows;

    const nextData = applyRowEdit(handbook, updatedRow);
    setHandbook(nextData);
    setRows(buildAdminUniversityRows(nextData));
    setEditingRow(null);
    setError(null);

    const response = await fetch("/api/admin/update-data", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        [ADMIN_PASSWORD_HEADER]: password,
      },
      body: JSON.stringify({
        programCode: updatedRow.programCode,
        institutionCode: updatedRow.institutionCode,
        name: updatedRow.name,
        faculty: updatedRow.faculty,
        threshold: updatedRow.threshold,
        slots: updatedRow.slots,
      }),
    });

    const payload = (await response.json()) as {
      ok?: boolean;
      data?: HandbookData;
      row?: AdminUniversityRow;
      error?: string;
    };

    if (!response.ok || !payload.ok) {
      setHandbook(previousHandbook);
      setRows(previousRows);
      throw new Error(payload.error ?? "Failed to save program update");
    }

    if (payload.data) {
      setHandbook(payload.data);
      setRows(buildAdminUniversityRows(payload.data));
    }

    setDirty(false);
    setStatus(
      `Updated ${updatedRow.programCode}: threshold ${updatedRow.threshold}, slots ${updatedRow.slots ?? "—"}. Saved to data/universities.json.`,
    );
  }

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((row) =>
      [row.name, row.faculty, row.institutionCode, row.programCode]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, rows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pageRows = filteredRows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="admin-shell flex min-h-screen">
      <aside className="admin-sidebar hidden w-64 shrink-0 flex-col border-r border-cyan-500/15 bg-[#070a12]/95 p-5 lg:flex">
        <div className="mb-8">
          <p className="admin-kicker">SpaceEdu</p>
          <h1 className="text-lg font-bold text-white">Admin Console</h1>
          <p className="mt-1 text-xs text-zinc-500">Neon-Cyber workspace</p>
        </div>

        <nav className="space-y-2">
          <button
            type="button"
            onClick={() => setSection("universities")}
            className={`admin-nav-item w-full ${section === "universities" ? "admin-nav-item-active" : ""}`}
          >
            <Database className="h-4 w-4" strokeWidth={1.75} />
            University Data
          </button>
        </nav>

        <div className="mt-auto rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-xs text-zinc-400">
          {rows.length} program rows loaded
          {dirty ? " · unsaved edits" : ""}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="admin-topbar flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/10 px-4 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-300/80 lg:hidden">
              <Building2 className="h-4 w-4" strokeWidth={1.75} />
              <span className="text-sm font-semibold">University Data</span>
            </div>
            <h2 className="hidden text-xl font-bold text-white lg:block">University Data</h2>
            <p className="text-sm text-zinc-400">
              Edit institution names, thresholds, and admission slots.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={!dirty || saving || !handbook}
            className="gap-2"
          >
            <Save className="h-4 w-4" strokeWidth={1.75} />
            {saving ? "Saving..." : "Save"}
          </Button>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          {status ? (
            <p className="mb-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              {status}
            </p>
          ) : null}
          {error ? (
            <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <div className="admin-panel p-4 sm:p-5">
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
                  placeholder="Search university, faculty, or code..."
                  className="admin-input w-full pl-10"
                />
              </div>
              <p className="text-sm text-zinc-500">
                {filteredRows.length} results
              </p>
            </div>

            {loading ? (
              <p className="py-16 text-center text-sm text-zinc-400">Loading handbook data...</p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="admin-table min-w-full text-left text-sm">
                    <thead>
                      <tr>
                        <th>University</th>
                        <th>Program</th>
                        <th>Threshold</th>
                        <th>Slots</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((row) => (
                        <tr key={row.programCode}>
                          <td>
                            <div className="font-medium text-white">{row.name}</div>
                            <div className="text-xs text-zinc-500">{row.institutionCode}</div>
                          </td>
                          <td className="max-w-xs truncate text-zinc-300" title={row.faculty}>
                            {row.faculty}
                          </td>
                          <td className="font-mono text-cyan-200">{row.threshold}</td>
                          <td className="font-mono text-purple-200">
                            {row.slots ?? "—"}
                          </td>
                          <td className="text-right">
                            <button
                              type="button"
                              onClick={() => setEditingRow(row)}
                              className="admin-edit-btn inline-flex items-center gap-1.5"
                            >
                              <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                              Edit
                            </button>
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
          </div>
        </main>
      </div>

      {editingRow ? (
        <UniversityEditModal
          row={editingRow}
          onClose={() => setEditingRow(null)}
          onSave={(updated) => handleEditSave(updated)}
        />
      ) : null}
    </div>
  );
}
