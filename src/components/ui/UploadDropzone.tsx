"use client";

import { useId, useState, type ReactNode } from "react";
import { CloudUpload } from "lucide-react";

/** The site's upload mark: a pink cloud in a white circle with a thin border. */
export function UploadIconBadge({ size = 52, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full border border-[#e7e5e4] bg-white text-[#e11d74] dark:border-white/15 dark:bg-white/[0.06] dark:text-pink-400 ${className}`}
      style={{ width: size, height: size }}
    >
      <CloudUpload style={{ width: size * 0.46, height: size * 0.46 }} strokeWidth={1.9} />
    </span>
  );
}

/**
 * A drop-or-click area for files, the same on every page: dashed border,
 * the upload mark, a line and a hint; pink while a file is dragged over.
 */
export function UploadDropzone({
  accept,
  onFiles,
  label = "ჩააგდე ფაილი ან დააწკაპუნე",
  hint,
  multiple = false,
  disabled = false,
  className = "",
  children,
}: {
  accept: string;
  onFiles: (files: File[]) => void;
  label?: ReactNode;
  hint?: ReactNode;
  multiple?: boolean;
  disabled?: boolean;
  /** Size and spacing (e.g. `min-h-[150px]`). */
  className?: string;
  /** Extra content under the hint. */
  children?: ReactNode;
}) {
  const [dragging, setDragging] = useState(false);
  const id = useId();
  return (
    <label
      htmlFor={id}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const files = Array.from(event.dataTransfer.files ?? []);
        if (!disabled && files.length > 0) onFiles(multiple ? files : files.slice(0, 1));
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border-[1.5px] border-dashed px-4 py-6 text-center transition-colors focus-within:ring-2 focus-within:ring-[#e11d74]/40 ${
        dragging
          ? "border-[#e11d74] bg-[#fdf2f8] dark:bg-pink-500/10"
          : "border-[#d6d3d1] bg-[#fafaf9] hover:border-[#a8a29e] dark:border-[#3f3f46] dark:bg-white/[0.03] dark:hover:border-white/30"
      } ${disabled ? "pointer-events-none opacity-60" : ""} ${className}`}
    >
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) onFiles(files);
          event.target.value = "";
        }}
      />
      <UploadIconBadge />
      <span className="mt-1 text-[15px] font-semibold text-[#1c1a17] dark:text-zinc-100">{label}</span>
      {hint ? <span className="text-[12.5px] text-[#6f6a64] dark:text-zinc-400">{hint}</span> : null}
      {children}
    </label>
  );
}
