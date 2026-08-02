"use client";

import { ImagePlus, X } from "lucide-react";

interface PhotoUploadSlotProps {
  index: number;
  image: string | null;
  placement: string;
  onUpload: (index: number, file: File) => void;
  onRemove: (index: number) => void;
  onPlacementChange: (index: number, placement: string) => void;
}

const PLACEMENTS = [
  "სათაური სლაიდი",
  "შესავალი",
  "მთავარი ცნება",
  "სტატისტიკა",
  "ანალიზი",
  "დასკვნა",
];

export function PhotoUploadSlot({
  index,
  image,
  placement,
  onUpload,
  onRemove,
  onPlacementChange,
}: PhotoUploadSlotProps) {
  return (
    <div className="rounded-xl border border-[var(--border-hover)] bg-[var(--bg-secondary)] p-2">
      <label className="relative block h-24 cursor-pointer overflow-hidden rounded-lg border border-dashed border-[var(--border-hover)]">
        {image ? (
          <img src={image} alt={`upload-${index + 1}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--text-secondary)]">
            <ImagePlus className="h-5 w-5" />
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(index, file);
          }}
        />
      </label>
      <div className="mt-2 flex items-center gap-2">
        <select
          value={placement}
          onChange={(e) => onPlacementChange(index, e.target.value)}
          className="w-full rounded-lg border border-[var(--border-hover)] bg-[var(--bg-card)] px-2 py-1 text-xs"
        >
          {PLACEMENTS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        {image && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="rounded-md border border-[var(--border-hover)] p-1 text-[var(--text-secondary)] hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
