"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { GripVertical, ImagePlus, Loader2, X } from "lucide-react";
import {
  MAX_PHOTOS,
  PHOTO_ACCEPT_ATTR,
  processPhotoFiles,
  type UploadedPhoto,
} from "@/lib/presentation-photos";

interface PhotoUploaderProps {
  photos: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
}

/** Image files from a paste or drop, ignoring text and other items. */
function imageFiles(list: FileList | DataTransferItemList | null | undefined): File[] {
  if (!list) return [];
  const files: File[] = [];
  for (const item of Array.from(list as ArrayLike<File | DataTransferItem>)) {
    const file = item instanceof File ? item : item.kind === "file" ? item.getAsFile() : null;
    if (file) files.push(file);
  }
  return files;
}

/**
 * The "ფოტოები" block of the info step: drop zone (click, drag & drop,
 * paste), thumbnails that can be reordered by dragging, a caption per photo.
 */
export function PhotoUploader({ photos, onChange }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  // The latest list for async uploads and the paste listener.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const addFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setBusy(true);
    const result = await processPhotoFiles(files, photosRef.current.length);
    setBusy(false);
    setErrors(result.errors);
    if (result.photos.length > 0) onChange([...photosRef.current, ...result.photos]);
  };

  // Ctrl/Cmd+V anywhere on the step adds pasted images (text pastes into
  // the inputs as usual).
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = imageFiles(event.clipboardData?.items).filter((file) => file.type.startsWith("image/"));
      if (files.length === 0) return;
      event.preventDefault();
      void addFiles(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (id: string, patch: Partial<UploadedPhoto>) =>
    onChange(photos.map((photo) => (photo.id === id ? { ...photo, ...patch } : photo)));

  // Reorder by dragging a thumbnail's handle (pointer events, so it works
  // with touch too): the photo swaps into whichever tile is under the finger.
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const startReorder = (event: ReactPointerEvent<HTMLButtonElement>, id: string) => {
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // No capture (e.g. the pointer is already gone) — moves still arrive.
    }
    setDraggingId(id);
  };
  const moveReorder = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!draggingId) return;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-photo-tile]")?.dataset.photoTile;
    if (!target || target === draggingId) return;
    const current = photosRef.current;
    const from = current.findIndex((photo) => photo.id === draggingId);
    const to = current.findIndex((photo) => photo.id === target);
    if (from < 0 || to < 0) return;
    const next = [...current];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const full = photos.length >= MAX_PHOTOS;

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={full || busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!full) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          if (!full) void addFiles(imageFiles(event.dataTransfer.files));
        }}
        className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition disabled:cursor-not-allowed disabled:opacity-60 ${
          dragActive
            ? "border-pink-400 bg-pink-50 text-pink-700 dark:border-pink-400/60 dark:bg-pink-500/10 dark:text-pink-200"
            : "border-stone-300 bg-stone-50 text-slate-600 hover:border-pink-300 hover:bg-pink-50/50 dark:border-white/15 dark:bg-white/[0.02] dark:text-zinc-300 dark:hover:border-pink-400/40"
        }`}
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin text-pink-600 dark:text-pink-400" />
        ) : (
          <ImagePlus className="h-5 w-5 text-pink-600 dark:text-pink-400" />
        )}
        <span className="text-sm font-semibold">
          {full ? `ატვირთულია ${MAX_PHOTOS} ფოტო (მაქსიმუმი)` : "ჩააგდე ფოტოები აქ ან აირჩიე ფაილები"}
        </span>
        <span className="text-xs text-slate-500 dark:text-zinc-500">
          JPG, PNG ან WEBP · მაქს. {MAX_PHOTOS} ფოტო · თითო 10 MB-მდე
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_ACCEPT_ATTR}
        multiple
        hidden
        onChange={(event) => {
          void addFiles(imageFiles(event.target.files));
          event.target.value = "";
        }}
      />

      {errors.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              data-photo-tile={photo.id}
              className={`space-y-1.5 transition ${draggingId === photo.id ? "opacity-60" : ""}`}
            >
              <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-100 dark:border-white/10 dark:bg-white/[0.04]">
                {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
                <img src={photo.dataUrl} alt={photo.caption || photo.name} className="aspect-[4/3] w-full object-cover" draggable={false} />
                <span className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-1.5 text-[10px] font-semibold text-white">
                  {index + 1}
                </span>
                <button
                  type="button"
                  aria-label={`რიგის შეცვლა: ${photo.name}`}
                  onPointerDown={(event) => startReorder(event, photo.id)}
                  onPointerMove={moveReorder}
                  onPointerUp={() => setDraggingId(null)}
                  onPointerCancel={() => setDraggingId(null)}
                  className="absolute bottom-1.5 left-1.5 inline-flex h-7 w-7 cursor-grab touch-none items-center justify-center rounded-full bg-black/55 text-white active:cursor-grabbing"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`წაშლა: ${photo.name}`}
                  onClick={() => onChange(photos.filter((p) => p.id !== photo.id))}
                  className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-rose-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                value={photo.caption}
                maxLength={200}
                onChange={(event) => update(photo.id, { caption: event.target.value })}
                placeholder="რას აჩვენებს? მაგ. „ნიუტონის პორტრეტი“"
                aria-label={`წარწერა: ${photo.name}`}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:ring-pink-500/10"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
