"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AdminUniversityRow } from "@/lib/admin/handbook-rows";

interface UniversityEditModalProps {
  row: AdminUniversityRow;
  onClose: () => void;
  onSave: (row: AdminUniversityRow) => Promise<void>;
}

export function UniversityEditModal({ row, onClose, onSave }: UniversityEditModalProps) {
  const [threshold, setThreshold] = useState(String(row.threshold));
  const [slots, setSlots] = useState(row.slots == null ? "" : String(row.slots));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setThreshold(String(row.threshold));
    setSlots(row.slots == null ? "" : String(row.slots));
    setError(null);
  }, [row]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsedThreshold = Number(threshold);
    const parsedSlots = slots.trim() === "" ? null : Number(slots);

    if (Number.isNaN(parsedThreshold)) {
      setError("Threshold must be a valid number.");
      return;
    }
    if (parsedSlots != null && Number.isNaN(parsedSlots)) {
      setError("Slots must be a valid number or empty.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...row,
        threshold: parsedThreshold,
        slots: parsedSlots,
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-panel w-full max-w-lg p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="admin-kicker">Edit Program</p>
            <h3 id="edit-modal-title" className="text-lg font-bold text-white">
              {row.name}
            </h3>
            <p className="mt-1 text-sm text-zinc-400">{row.faculty}</p>
            <p className="mt-1 font-mono text-xs text-zinc-500">{row.programCode}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="admin-pagination-btn"
            aria-label="Close"
            disabled={saving}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-cyan-300/80">
                Threshold
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={threshold}
                onChange={(event) => setThreshold(event.target.value)}
                className="admin-input w-full font-mono"
                required
                disabled={saving}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-cyan-300/80">
                Slots
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={slots}
                onChange={(event) => setSlots(event.target.value)}
                className="admin-input w-full font-mono"
                placeholder="—"
                disabled={saving}
              />
            </label>
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
