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
    <div className="dashboard-glass-card rounded-2xl p-2">
      <label className="relative block h-24 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-[rgb(228,216,189)] bg-[linear-gradient(135deg,#fefcf6_0%,#f6efdc_100%)] transition hover:border-violet-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-violet-400/40">
        {image ? (
          <img src={image} alt={`upload-${index + 1}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400 dark:text-zinc-500">
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
          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300"
        >
          {PLACEMENTS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        {image && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="rounded-md border border-slate-200 bg-white p-1 text-slate-500 transition hover:border-rose-300 hover:text-rose-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:border-rose-400/30 dark:hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
