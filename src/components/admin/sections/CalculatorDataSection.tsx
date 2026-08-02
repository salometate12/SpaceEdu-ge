"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAdmin } from "@/contexts/AdminContext";
import {
  buildAdminUniversityRows,
  type AdminUniversityRow,
} from "@/lib/admin/handbook-rows";
import { ADMIN_PASSWORD_HEADER } from "@/lib/admin/constants";
import type { HandbookData } from "@/lib/exam-calculator/types";
import { TableManager } from "../TableManager";

export function CalculatorDataSection() {
  const { password, notifySuccess, notifyError } = useAdmin();
  const [handbook, setHandbook] = useState<HandbookData | null>(null);
  const [rows, setRows] = useState<AdminUniversityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/universities", {
        headers: { [ADMIN_PASSWORD_HEADER]: password },
      });
      const payload = (await response.json()) as {
        data?: HandbookData;
        rows?: AdminUniversityRow[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "Failed to load handbook");
      setHandbook(payload.data ?? null);
      setRows(payload.rows ?? []);
    } catch (error) {
      notifyError(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [password, notifyError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function persistRow(updatedRow: AdminUniversityRow) {
    const response = await fetch("/api/admin/update-data", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        [ADMIN_PASSWORD_HEADER]: password,
      },
      body: JSON.stringify(updatedRow),
    });
    const payload = (await response.json()) as {
      ok?: boolean;
      data?: HandbookData;
      error?: string;
    };
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error ?? "Failed to update program");
    }
    if (payload.data) {
      setHandbook(payload.data);
      setRows(buildAdminUniversityRows(payload.data));
    } else {
      setRows((current) =>
        current.map((row) => (row.programCode === updatedRow.programCode ? updatedRow : row)),
      );
    }
    notifySuccess(`Updated ${updatedRow.programCode} in data/universities.json`);
  }

  async function handleBulkSave() {
    if (!handbook) return;
    setSaving(true);
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
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Save failed");
      notifySuccess("Full handbook saved to data/universities.json");
    } catch (error) {
      notifyError(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          Manage university thresholds and admission slots from the handbook JSON store.
        </p>
        <Button
          type="button"
          onClick={() => void handleBulkSave()}
          disabled={saving || !handbook}
          className="gap-2"
        >
          <Save className="h-4 w-4" strokeWidth={1.75} />
          {saving ? "Saving..." : "Save Handbook"}
        </Button>
      </div>

      <TableManager<AdminUniversityRow>
        title="Calculator Data"
        description="University programs used by the exam calculator."
        idKey="programCode"
        loading={loading}
        pageSize={25}
        rows={rows}
        searchKeys={["name", "faculty", "institutionCode", "programCode"]}
        searchPlaceholder="Search university, faculty, or code..."
        columns={[
          {
            key: "name",
            label: "University",
            render: (row) => (
              <div>
                <div className="font-medium text-white">{row.name}</div>
                <div className="text-xs text-zinc-500">{row.institutionCode}</div>
              </div>
            ),
          },
          { key: "faculty", label: "Program" },
          { key: "threshold", label: "Threshold", mono: true },
          {
            key: "slots",
            label: "Slots",
            mono: true,
            render: (row) => (row.slots == null ? "—" : row.slots),
          },
        ]}
        fields={[
          { key: "name", label: "University Name", type: "text", required: true },
          { key: "faculty", label: "Program", type: "text", required: true },
          { key: "threshold", label: "Threshold", type: "number", required: true },
          { key: "slots", label: "Slots", type: "number", placeholder: "Leave empty for none" },
        ]}
        onCreate={async () => {
          throw new Error("Create new programs from the handbook parser, not the admin UI.");
        }}
        onUpdate={async (row) => {
          await persistRow(row);
        }}
        onDelete={async () => {
          throw new Error("Deleting handbook programs is disabled for safety.");
        }}
        allowCreate={false}
        allowDelete={false}
        createLabel="Add Program"
      />
    </div>
  );
}
