"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { GripVertical, Loader2, X } from "lucide-react";
import { UploadIconBadge } from "@/components/ui/UploadDropzone";
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
        className={`wz-focus flex min-h-[84px] w-full items-center gap-4 rounded-[18px] border-[1.5px] border-dashed px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
          dragActive
            ? "border-[#e11d74] bg-[#fdf2f8] dark:bg-pink-500/10"
            : "border-[var(--wz-field-border)] bg-[var(--wz-field)] hover:border-[var(--wz-future)]"
        }`}
      >
        {busy ? (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center text-[#e11d74]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>
        ) : (
          <UploadIconBadge size={44} />
        )}
        <span className="min-w-0">
          <span className="block text-[14.5px] font-semibold text-[var(--wz-title)]">
            {full ? `ატვირთულია ${MAX_PHOTOS} ფოტო, მეტი არ ეტევა` : "ჩააგდე ფოტოები ან აირჩიე"}
          </span>
          <span className="block text-[13px] text-[var(--wz-faint)]">JPG, PNG, WEBP · მაქს. {MAX_PHOTOS} ფოტო, თითო 10 MB</span>
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
        <ul role="alert" className="space-y-1 text-[13px] font-medium text-rose-600 dark:text-rose-400">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      {photos.length > 0 && (
        <ul className="flex flex-col gap-2">
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              data-photo-tile={photo.id}
              className={`flex items-center gap-3 rounded-[14px] border border-[var(--wz-border)] p-2 transition ${draggingId === photo.id ? "opacity-60" : ""}`}
            >
              <button
                type="button"
                aria-label={`რიგის შეცვლა: ${photo.name}`}
                onPointerDown={(event) => startReorder(event, photo.id)}
                onPointerMove={moveReorder}
                onPointerUp={() => setDraggingId(null)}
                onPointerCancel={() => setDraggingId(null)}
                className="wz-focus inline-flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-[var(--wz-future)] active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[10px] bg-[var(--wz-soft)]">
                {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
                <img src={photo.dataUrl} alt={photo.caption || photo.name} className="h-full w-full object-cover" draggable={false} />
                <span className="absolute left-1 top-1 rounded-full bg-black/55 px-1.5 text-[10px] font-semibold text-white">{index + 1}</span>
              </span>
              <input
                value={photo.caption}
                maxLength={200}
                onChange={(event) => update(photo.id, { caption: event.target.value })}
                placeholder="რას აჩვენებს? მაგ. „ნიუტონის პორტრეტი“"
                aria-label={`წარწერა: ${photo.name}`}
                className="wz-input !h-11 min-w-0 flex-1 !text-[14px]"
              />
              <button
                type="button"
                aria-label={`წაშლა: ${photo.name}`}
                onClick={() => onChange(photos.filter((p) => p.id !== photo.id))}
                className="wz-focus inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--wz-muted)] hover:bg-[var(--wz-hover)]"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
