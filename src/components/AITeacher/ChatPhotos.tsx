"use client";

import { useCallback, useEffect, useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { createPortal } from "react-dom";
import { Camera, ChevronLeft, ChevronRight, ImagePlus, Images, Paperclip, X } from "lucide-react";
import {
  CHAT_PHOTO_MAX,
  CHAT_PHOTO_SIGNED_OUT,
  CHAT_PHOTO_UPLOAD_FAILED,
  compressPhoto,
  pickPhotos,
  type ChatImage,
} from "@/lib/chat-photos";
import { chatPhotoUrl, isUserFilesConnected, removeChatPhotos, removeUserFile, uploadChatPhoto } from "@/lib/user-files";
import { useDismiss } from "@/hooks/useDismiss";

/** A photo just sent, shown from this device until its link is needed. */
const localPreviews = new Map<string, string>();

interface DraftPhoto {
  id: string;
  preview: string;
  status: "working" | "ready";
  path?: string;
  width?: number;
  height?: number;
}

export interface ChatPhotosState {
  drafts: DraftPhoto[];
  error: string | null;
  /** A photo is still being made small or going up: sending waits. */
  busy: boolean;
  /** Something is being dragged over the chat. */
  dragging: boolean;
  add: (files: File[]) => void;
  remove: (id: string) => void;
  /** The ready photos, taken out of the field for a message. */
  take: () => ChatImage[];
  /** Drops the drafts (and their uploads). */
  discard: () => void;
  onPaste: (event: ClipboardEvent) => void;
  dropProps: {
    onDragEnter: (event: DragEvent) => void;
    onDragOver: (event: DragEvent) => void;
    onDragLeave: (event: DragEvent) => void;
    onDrop: (event: DragEvent) => void;
  };
}

const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes("Files");

/**
 * The photos waiting in a chat's field: picked, pasted or dropped, made
 * small and uploaded to `folder()` (the conversation's id) right away, so
 * sending only names them.
 */
export function useChatPhotos(folder: () => string): ChatPhotosState {
  const [drafts, setDrafts] = useState<DraftPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  const draftsRef = useRef<DraftPhoto[]>([]);
  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);
  const folderRef = useRef(folder);
  useEffect(() => {
    folderRef.current = folder;
  });

  const add = useCallback((files: File[]) => {
    if (files.length === 0) return;
    if (!isUserFilesConnected()) {
      setError(CHAT_PHOTO_SIGNED_OUT);
      return;
    }
    const { accepted, error: problem } = pickPhotos(files, draftsRef.current.length);
    setError(problem);
    const conversation = folderRef.current();
    for (const file of accepted) {
      const id = crypto.randomUUID();
      const preview = URL.createObjectURL(file);
      const draft: DraftPhoto = { id, preview, status: "working" };
      draftsRef.current = [...draftsRef.current, draft];
      setDrafts(draftsRef.current);
      void (async () => {
        try {
          const small = await compressPhoto(file);
          const path = await uploadChatPhoto(conversation, small.blob);
          if (!path) throw new Error(CHAT_PHOTO_UPLOAD_FAILED);
          const smallPreview = URL.createObjectURL(small.blob);
          URL.revokeObjectURL(preview);
          localPreviews.set(path, smallPreview);
          // Removed while it was going up: it goes from storage too.
          if (!draftsRef.current.some((item) => item.id === id)) {
            void removeUserFile(path).catch(() => undefined);
            return;
          }
          setDrafts((current) => current.map((item) => (item.id === id ? { ...item, status: "ready", path, preview: smallPreview, width: small.width, height: small.height } : item)));
        } catch (reason) {
          URL.revokeObjectURL(preview);
          setDrafts((current) => current.filter((item) => item.id !== id));
          setError(reason instanceof Error && reason.message ? reason.message : CHAT_PHOTO_UPLOAD_FAILED);
        }
      })();
    }
  }, []);

  const remove = useCallback((id: string) => {
    const draft = draftsRef.current.find((item) => item.id === id);
    draftsRef.current = draftsRef.current.filter((item) => item.id !== id);
    setDrafts(draftsRef.current);
    setError(null);
    if (draft?.path) void removeUserFile(draft.path).catch(() => undefined);
  }, []);

  const take = useCallback((): ChatImage[] => {
    const ready = draftsRef.current.filter((item) => item.status === "ready" && item.path);
    draftsRef.current = [];
    setDrafts([]);
    setError(null);
    return ready.map((item) => ({ path: item.path!, ...(item.width ? { width: item.width, height: item.height } : {}) }));
  }, []);

  const discard = useCallback(() => {
    for (const item of draftsRef.current) if (item.path) void removeUserFile(item.path).catch(() => undefined);
    draftsRef.current = [];
    setDrafts([]);
    setError(null);
  }, []);

  const onPaste = useCallback(
    (event: ClipboardEvent) => {
      // Every pasted file goes through the same check (a HEIC has no type; a PDF gets its reason).
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length === 0) return;
      event.preventDefault();
      add(files);
    },
    [add],
  );

  const dropProps = {
    onDragEnter: (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth.current += 1;
      setDragging(true);
    },
    onDragOver: (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },
    onDragLeave: (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
    },
    onDrop: (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth.current = 0;
      setDragging(false);
      add(Array.from(event.dataTransfer.files));
    },
  };

  return { drafts, error, busy: drafts.some((item) => item.status === "working"), dragging, add, remove, take, discard, onPaste, dropProps };
}

/** A conversation deleted, or a chat started over: its photos leave storage. */
export function forgetChatPhotos(conversationId: string | null) {
  if (conversationId) void removeChatPhotos(conversationId).catch(() => undefined);
}

/* --- 📎 ------------------------------------------------------------------ */

/**
 * „ფოტოს მიმაგრება“: a file picker; on a phone a choice between the camera
 * and the gallery.
 */
export function PhotoAttachButton({ photos, touch, disabled = false, className = "" }: { photos: ChatPhotosState; touch: boolean; disabled?: boolean; className?: string }) {
  const gallery = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const [menu, setMenu] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useDismiss(menu, () => setMenu(false), panel, trigger);
  const full = photos.drafts.length >= CHAT_PHOTO_MAX;
  const picked = (input: HTMLInputElement | null) => {
    if (!input?.files) return;
    photos.add(Array.from(input.files));
    input.value = "";
  };
  const open = (input: HTMLInputElement | null) => {
    setMenu(false);
    input?.click();
  };
  return (
    <div className="relative shrink-0">
      <button
        ref={trigger}
        type="button"
        aria-label="ფოტოს მიმაგრება"
        title="ფოტოს მიმაგრება"
        aria-haspopup={touch ? "menu" : undefined}
        aria-expanded={touch ? menu : undefined}
        disabled={disabled || full}
        onClick={() => (touch ? setMenu((value) => !value) : open(gallery.current))}
        className={`inline-flex h-[38px] w-[38px] items-center justify-center rounded-full text-[var(--chat-text-muted,var(--text-secondary))] transition hover:bg-[var(--chat-hover,var(--bg-secondary))] hover:text-[var(--chat-text-strong,var(--text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50 disabled:opacity-40 ${className}`}
      >
        <Paperclip className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      </button>
      <input ref={gallery} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={(event) => picked(event.currentTarget)} />
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(event) => picked(event.currentTarget)} />
      {menu ? (
        <div
          ref={panel}
          role="menu"
          className="absolute bottom-[calc(100%+8px)] left-0 z-30 min-w-[200px] rounded-[18px] border border-[var(--chat-border,var(--border))] bg-[var(--chat-surface,var(--bg-card))] p-1.5 shadow-[0_18px_40px_-18px_rgb(0_0_0/0.35)]"
        >
          <button type="button" role="menuitem" onClick={() => open(camera.current)} className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-[15px] font-medium text-[var(--chat-text-strong,var(--text-primary))] hover:bg-[var(--chat-hover,var(--bg-secondary))]">
            <Camera className="h-[18px] w-[18px] shrink-0" aria-hidden />
            ფოტოს გადაღება
          </button>
          <button type="button" role="menuitem" onClick={() => open(gallery.current)} className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-[15px] font-medium text-[var(--chat-text-strong,var(--text-primary))] hover:bg-[var(--chat-hover,var(--bg-secondary))]">
            <Images className="h-[18px] w-[18px] shrink-0" aria-hidden />
            გალერეიდან
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* --- In the field ----------------------------------------------------- */

/** A small ring turning while a photo is made small and goes up. */
function UploadRing() {
  return (
    <span className="absolute inset-0 flex items-center justify-center rounded-[12px] bg-black/35" role="progressbar" aria-label="იტვირთება">
      <svg viewBox="0 0 24 24" className="h-6 w-6 animate-spin" aria-hidden>
        <circle cx="12" cy="12" r="9" fill="none" stroke="rgb(255 255 255 / 0.35)" strokeWidth="3" />
        <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/** The photos above the field: 56px squares with ✕; the error under them. */
export function PhotoDrafts({ photos, errorId }: { photos: ChatPhotosState; errorId: string }) {
  if (photos.drafts.length === 0 && !photos.error) return null;
  return (
    <div className="px-3 pt-2.5">
      {photos.drafts.length ? (
        <ul className="flex flex-wrap gap-2" aria-label="მიმაგრებული ფოტოები">
          {photos.drafts.map((draft, index) => (
            <li key={draft.id} className="relative h-14 w-14 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element -- a local preview */}
              <img src={draft.preview} alt={`ფოტო ${index + 1}`} className="h-14 w-14 rounded-[12px] border border-[var(--chat-border,var(--border))] object-cover" />
              {draft.status === "working" ? <UploadRing /> : null}
              <button
                type="button"
                onClick={() => photos.remove(draft.id)}
                aria-label={`ფოტო ${index + 1}-ის წაშლა`}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#18181b] text-white shadow ring-2 ring-[var(--chat-surface,var(--bg-card))] dark:bg-[#f4f4f5] dark:text-[#18181b]"
              >
                <X className="h-3 w-3" strokeWidth={3} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {photos.error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-[13px] font-medium text-rose-600 dark:text-rose-400">
          {photos.error}
        </p>
      ) : null}
    </div>
  );
}

/** „ჩააგდე ფოტო აქ“ over the chat while a file is dragged across it. */
export function PhotoDropOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-2 z-40 flex items-center justify-center rounded-[24px] border-2 border-dashed border-pink-400 bg-pink-50/85 backdrop-blur-sm dark:border-pink-400/70 dark:bg-[rgba(236,72,153,0.12)]">
      <span className="flex flex-col items-center gap-2 text-[16px] font-semibold text-pink-700 dark:text-pink-200">
        <ImagePlus className="h-8 w-8" aria-hidden />
        ჩააგდე ფოტო აქ
      </span>
    </div>
  );
}

/* --- In the conversation ---------------------------------------------- */

/** A sent photo's address: this device's copy, or a signed link (an hour). */
function usePhotoUrl(path: string): string | null {
  const local = localPreviews.get(path) ?? null;
  const [signed, setSigned] = useState<{ path: string; url: string | null } | null>(null);
  useEffect(() => {
    if (localPreviews.has(path)) return;
    let active = true;
    void chatPhotoUrl(path).then((url) => {
      if (active) setSigned({ path, url });
    });
    return () => {
      active = false;
    };
  }, [path]);
  return local ?? (signed?.path === path ? signed.url : null);
}

function PhotoTile({ image, single, label, onOpen }: { image: ChatImage; single: boolean; label: string; onOpen: () => void }) {
  const url = usePhotoUrl(image.path);
  const ratio = single && image.width && image.height ? `${image.width} / ${image.height}` : "1 / 1";
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      className={`block overflow-hidden rounded-[14px] border border-[var(--chat-border,var(--border))] bg-[var(--chat-chip-bg,var(--bg-secondary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60 ${single ? "w-[220px] max-w-full" : "w-full"}`}
      style={{ aspectRatio: ratio, maxHeight: single ? 320 : undefined }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- signed storage link */}
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <span className="block h-full w-full animate-pulse" aria-hidden />}
    </button>
  );
}

/** A question's photos above its bubble: one 220px wide, two to four in two columns. */
export function MessagePhotos({ images }: { images: ChatImage[] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (images.length === 0) return null;
  const single = images.length === 1;
  return (
    <>
      <div className={single ? "flex justify-end" : "ml-auto grid w-[244px] max-w-full grid-cols-2 gap-1.5"}>
        {images.map((image, index) => (
          <PhotoTile key={image.path} image={image} single={single} label={`ფოტო ${index + 1}, სრულ ეკრანზე`} onOpen={() => setOpen(index)} />
        ))}
      </div>
      {open !== null ? <PhotoLightbox images={images} index={open} onIndex={setOpen} onClose={() => setOpen(null)} /> : null}
    </>
  );
}

/** A photo on the whole screen: ✕ or Esc closes it, the arrows go between them. */
function PhotoLightbox({ images, index, onIndex, onClose }: { images: ChatImage[]; index: number; onIndex: (index: number) => void; onClose: () => void }) {
  const url = usePhotoUrl(images[index].path);
  const many = images.length > 1;
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      } else if (event.key === "ArrowRight" && many) onIndex((index + 1) % images.length);
      else if (event.key === "ArrowLeft" && many) onIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [index, images.length, many, onClose, onIndex]);
  const arrow = "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";
  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label={`ფოტო ${index + 1} / ${images.length}`} onClick={onClose}>
      {/* eslint-disable-next-line @next/next/no-img-element -- signed storage link */}
      {url ? <img src={url} alt={`ფოტო ${index + 1}`} className="max-h-full max-w-full rounded-lg object-contain" onClick={(event) => event.stopPropagation()} /> : null}
      <button ref={closeRef} type="button" onClick={onClose} aria-label="დახურვა" className="absolute right-[max(16px,env(safe-area-inset-right))] top-[max(16px,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
        <X className="h-5 w-5" aria-hidden />
      </button>
      {many ? (
        <>
          <button type="button" aria-label="წინა ფოტო" onClick={(event) => { event.stopPropagation(); onIndex((index - 1 + images.length) % images.length); }} className={`${arrow} left-3`}>
            <ChevronLeft className="h-6 w-6" aria-hidden />
          </button>
          <button type="button" aria-label="შემდეგი ფოტო" onClick={(event) => { event.stopPropagation(); onIndex((index + 1) % images.length); }} className={`${arrow} right-3`}>
            <ChevronRight className="h-6 w-6" aria-hidden />
          </button>
          <span className="absolute bottom-[max(16px,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-[13px] font-medium text-white">
            {index + 1} / {images.length}
          </span>
        </>
      ) : null}
    </div>,
    document.body,
  );
}
