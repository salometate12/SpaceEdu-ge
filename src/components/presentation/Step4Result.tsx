"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Download, ImagePlus, Loader2, RotateCcw, Sparkles, Undo2, X } from "lucide-react";
import { exportToPdf } from "@/lib/exportPdf";
import { exportToPptx } from "@/lib/exportPptx";
import { autoLayout, type SlideImage } from "@/lib/presentation-layout";
import { PHOTO_ACCEPT_ATTR, processPhotoFiles, type UploadedPhoto } from "@/lib/presentation-photos";
import { SlideCard, slideIndexAt, type DragGhost } from "./SlideCard";
import type { GeneratedSlide, PresentationTemplate } from "./PresentationWizard";

interface Step4ResultProps {
  title: string;
  slides: GeneratedSlide[];
  template: PresentationTemplate;
  photos: UploadedPhoto[];
  onSlidesChange: (slides: GeneratedSlide[]) => void;
  onPhotosChange: (photos: UploadedPhoto[]) => void;
  onReset: () => void;
}

const HISTORY_LIMIT = 20;

interface Selection {
  slide: number;
  photoId: string;
}

/** Waits for React to paint (e.g. the selection frame to disappear). */
const nextPaint = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

export function Step4Result({
  title,
  slides,
  template,
  photos,
  onSlidesChange,
  onPhotosChange,
  onReset,
}: Step4ResultProps) {
  const photoMap = useMemo(() => new Map(photos.map((photo) => [photo.id, photo])), [photos]);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [ghost, setGhost] = useState<DragGhost | null>(null);
  const [hoverSlide, setHoverSlide] = useState<number | null>(null);
  const [shelfMenu, setShelfMenu] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "pptx" | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const addInputRef = useRef<HTMLInputElement>(null);

  // Undo: snapshots of the slides before each photo change.
  const historyRef = useRef<GeneratedSlide[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  // The latest slides for handlers that outlive a render (drag listeners).
  const slidesRef = useRef(slides);
  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  const commit = useCallback(
    (next: GeneratedSlide[]) => {
      historyRef.current = [...historyRef.current, slidesRef.current].slice(-HISTORY_LIMIT);
      setCanUndo(true);
      onSlidesChange(next);
    },
    [onSlidesChange],
  );

  const undo = useCallback(() => {
    const previous = historyRef.current.pop();
    setCanUndo(historyRef.current.length > 0);
    if (!previous) return;
    setSelected(null);
    onSlidesChange(previous);
  }, [onSlidesChange]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return;
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo]);

  const onShelf = photos.filter((photo) => !slides.some((slide) => slide.images.some((img) => img.photoId === photo.id)));

  const updateImage = useCallback(
    (slideIndex: number, image: SlideImage) => {
      commit(
        slidesRef.current.map((slide, i) =>
          i === slideIndex
            ? { ...slide, images: slide.images.map((img) => (img.photoId === image.photoId ? image : img)) }
            : slide,
        ),
      );
    },
    [commit],
  );

  /** Takes a photo off its slide; it shows up on the shelf. */
  const removePhoto = useCallback(
    (photoId: string) => {
      setSelected(null);
      commit(
        slidesRef.current.map((slide) => ({
          ...slide,
          images: slide.images.filter((img) => img.photoId !== photoId),
        })),
      );
    },
    [commit],
  );

  /** Moves a photo (from a slide or the shelf) onto a slide and lets
   * autoLayout make room for it next to what's already there. */
  const placePhoto = useCallback(
    (photoId: string, targetIndex: number) => {
      const next = slidesRef.current.map((slide, i) => {
        const others = slide.images.filter((img) => img.photoId !== photoId);
        if (i !== targetIndex) return others.length === slide.images.length ? slide : { ...slide, images: others };
        const sizes = [...others.map((img) => img.photoId), photoId]
          .map((id) => photoMap.get(id))
          .filter((photo): photo is UploadedPhoto => Boolean(photo));
        return { ...slide, images: autoLayout(slide, sizes) };
      });
      commit(next);
      setSelected({ slide: targetIndex, photoId });
      setShelfMenu(null);
    },
    [commit, photoMap],
  );

  /** Puts one photo back where autoLayout would have it. */
  const resetPhoto = (slideIndex: number, photoId: string) => {
    const slide = slidesRef.current[slideIndex];
    const sizes = slide.images.map((img) => photoMap.get(img.photoId)).filter((p): p is UploadedPhoto => Boolean(p));
    const fresh = autoLayout(slide, sizes).find((img) => img.photoId === photoId);
    if (fresh) updateImage(slideIndex, fresh);
  };

  const handleGhost = useCallback((next: DragGhost | null) => {
    setGhost(next);
    setHoverSlide(next ? slideIndexAt(next.x, next.y) : null);
  }, []);

  // Dragging a photo off the shelf onto a slide (or a thumbnail). A short
  // press without movement opens the "ჩასმა სლაიდზე…" menu instead.
  const shelfDrag = useRef<{ photoId: string; x: number; y: number; dragging: boolean } | null>(null);
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = shelfDrag.current;
      if (!drag) return;
      if (!drag.dragging && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
      drag.dragging = true;
      handleGhost({ photoId: drag.photoId, x: event.clientX, y: event.clientY });
    };
    const onUp = (event: PointerEvent) => {
      const drag = shelfDrag.current;
      if (!drag) return;
      shelfDrag.current = null;
      handleGhost(null);
      if (!drag.dragging) {
        setShelfMenu((open) => (open === drag.photoId ? null : drag.photoId));
        return;
      }
      const target = slideIndexAt(event.clientX, event.clientY);
      if (target !== null) placePhoto(drag.photoId, target);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [handleGhost, placePhoto]);

  const addPhotos = async (files: File[]) => {
    const result = await processPhotoFiles(files, photos.length);
    setUploadErrors(result.errors);
    if (result.photos.length > 0) onPhotosChange([...photos, ...result.photos]);
  };

  const runExport = async (kind: "pdf" | "pptx") => {
    setExporting(kind);
    setSelected(null);
    setShelfMenu(null);
    try {
      await nextPaint();
      if (kind === "pdf") await exportToPdf("presentation-preview", title);
      else await exportToPptx(slides, template.id, title, photos);
    } finally {
      setExporting(null);
    }
  };

  const scrollToSlide = (index: number) =>
    document.getElementById(`slide-${index}`)?.scrollIntoView({ behavior: "smooth", block: "center" });

  const secondaryBtn =
    "inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-pink-400/30 dark:hover:bg-pink-500/10 dark:hover:text-white";
  const slideOption = (slide: GeneratedSlide, index: number) => `#${index + 1} ${slide.title}`.slice(0, 60);

  const ghostPhoto = ghost ? photoMap.get(ghost.photoId) : undefined;

  return (
    <section>
      <div className="dashboard-tool-card mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <span className="subject-icon-wrap flex h-9 w-9 shrink-0 items-center justify-center text-pink-600 dark:text-pink-400">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h2 className="headline text-xl font-semibold text-slate-900 dark:text-zinc-100">{title}</h2>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-zinc-400">
              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 dark:border-white/[0.1] dark:bg-white/[0.03]">
                {template.name}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 dark:border-white/[0.1] dark:bg-white/[0.03]">
                {slides.length} სლაიდი
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={exporting !== null}
            onClick={() => void runExport("pptx")}
            className="inline-flex items-center rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-500 disabled:opacity-60 dark:bg-pink-500 dark:hover:bg-pink-400"
          >
            {exporting === "pptx" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}
            PPTX გადმოწერა
          </button>
          <button type="button" disabled={exporting !== null} onClick={() => void runExport("pdf")} className={secondaryBtn}>
            {exporting === "pdf" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}
            PDF გადმოწერა
          </button>
          <button type="button" onClick={onReset} className={secondaryBtn}>
            <ArrowLeft className="mr-1 h-4 w-4" strokeWidth={2} />
            ახალი პრეზენტაცია
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => addInputRef.current?.click()} className={secondaryBtn}>
          <ImagePlus className="mr-1 h-4 w-4" />
          ფოტოს დამატება
        </button>
        <button type="button" onClick={undo} disabled={!canUndo} className={secondaryBtn} title="დაბრუნება (Ctrl/Cmd+Z)">
          <Undo2 className="mr-1 h-4 w-4" />
          დაბრუნება
        </button>
        <input
          ref={addInputRef}
          type="file"
          accept={PHOTO_ACCEPT_ATTR}
          multiple
          hidden
          onChange={(event) => {
            void addPhotos(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
        {photos.length > 0 && (
          <p className="text-xs text-slate-500 dark:text-zinc-500">
            ფოტო გადაათრიე, კუთხით გაადიდე, ან გადაიტანე მარცხენა სლაიდზე.
          </p>
        )}
      </div>
      {uploadErrors.length > 0 && (
        <ul className="mb-3 space-y-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {uploadErrors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      {onShelf.length > 0 && (
        <div className="mb-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-3 dark:border-white/15 dark:bg-white/[0.02]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">
            ფოტოების თარო · გადაათრიე სლაიდზე ან დააჭირე
          </p>
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {onShelf.map((photo) => (
              <li key={photo.id} className="relative shrink-0">
                <button
                  type="button"
                  onPointerDown={(event) => {
                    if (event.button > 0) return;
                    shelfDrag.current = { photoId: photo.id, x: event.clientX, y: event.clientY, dragging: false };
                  }}
                  className="block h-16 w-24 touch-pan-x overflow-hidden rounded-lg border border-stone-200 bg-white dark:border-white/10"
                  aria-label={`თაროს ფოტო: ${photo.caption || photo.name}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
                  <img src={photo.dataUrl} alt="" draggable={false} className="h-full w-full object-cover" />
                </button>
                {shelfMenu === photo.id && (
                  <div className="mt-1 flex items-center gap-1">
                    <select
                      autoFocus
                      defaultValue=""
                      onChange={(event) => event.target.value !== "" && placePhoto(photo.id, Number(event.target.value))}
                      className="w-44 min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                    >
                      <option value="" disabled>
                        ჩასმა სლაიდზე…
                      </option>
                      {slides.map((slide, index) => (
                        <option key={slide.id} value={index}>
                          {slideOption(slide, index)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShelfMenu(null)}
                      aria-label="დახურვა"
                      className="rounded-full p-1 text-slate-500 hover:text-slate-800 dark:text-zinc-400"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[150px_minmax(0,1fr)] lg:gap-4">
        {/* Slide strip: drop a photo on a thumbnail to move it there. */}
        <nav aria-label="სლაიდები" className="mb-4 lg:mb-0">
          <ol className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:pr-1">
            {slides.map((slide, index) => (
              <li key={slide.id} className="w-28 shrink-0 lg:w-full">
                <button
                  type="button"
                  data-slide-drop={index}
                  onClick={() => scrollToSlide(index)}
                  className={`block w-full rounded-xl text-left transition ${
                    hoverSlide === index ? "ring-2 ring-pink-500 ring-offset-2 dark:ring-offset-[#121214]" : ""
                  }`}
                  aria-label={`სლაიდი ${index + 1}: ${slide.title}`}
                >
                  <div className="pointer-events-none">
                    <SlideCard slide={slide} index={index} template={template} photos={photoMap} />
                  </div>
                  <span className="mt-1 block text-[10px] font-semibold text-slate-500 dark:text-zinc-500">#{index + 1}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div id="presentation-preview" className="grid gap-5">
          {slides.map((slide, index) => {
            const selection = selected?.slide === index ? selected : null;
            const selectedPhoto = selection ? photoMap.get(selection.photoId) : undefined;
            return (
              <article key={slide.id} id={`slide-${index}`} className="calendar-day-in" style={{ animationDelay: `${index * 60}ms` }}>
                <div className="mb-1.5 flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-500">
                  <span className="mono rounded-full bg-slate-100 px-2 py-0.5 dark:bg-white/10">#{index + 1}</span>
                  <span>{slide.slideType || slide.type}</span>
                </div>
                <div className={hoverSlide === index ? "rounded-xl ring-2 ring-pink-500 ring-offset-2 dark:ring-offset-[#121214]" : ""}>
                  <SlideCard
                    slide={slide}
                    index={index}
                    template={template}
                    photos={photoMap}
                    interactive
                    selectedPhotoId={selection?.photoId ?? null}
                    onSelectPhoto={(photoId) => setSelected(photoId ? { slide: index, photoId } : null)}
                    onImageCommit={(image) => updateImage(index, image)}
                    onRemovePhoto={removePhoto}
                    onTransfer={placePhoto}
                    onDragGhost={handleGhost}
                  />
                </div>
                {selection && selectedPhoto && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-pink-200 bg-pink-50/60 px-3 py-2 text-xs dark:border-pink-400/20 dark:bg-pink-500/10">
                    <span className="max-w-[10rem] truncate font-semibold text-pink-800 dark:text-pink-200">
                      {selectedPhoto.caption || selectedPhoto.name}
                    </span>
                    <select
                      value=""
                      onChange={(event) => event.target.value !== "" && placePhoto(selection.photoId, Number(event.target.value))}
                      className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 sm:w-56 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                      aria-label="სხვა სლაიდზე გადატანა"
                    >
                      <option value="" disabled>
                        სხვა სლაიდზე →
                      </option>
                      {slides.map((other, otherIndex) =>
                        otherIndex === index ? null : (
                          <option key={other.id} value={otherIndex}>
                            {slideOption(other, otherIndex)}
                          </option>
                        ),
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => resetPhoto(index, selection.photoId)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700 hover:border-pink-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200"
                    >
                      <RotateCcw className="h-3 w-3" />
                      ზომის აღდგენა
                    </button>
                    <button
                      type="button"
                      onClick={() => removePhoto(selection.photoId)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700 hover:border-rose-300 hover:text-rose-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200"
                    >
                      <X className="h-3 w-3" />
                      ამოღება
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>

      {ghost && ghostPhoto && (
        // eslint-disable-next-line @next/next/no-img-element -- local data URL
        <img
          src={ghostPhoto.dataUrl}
          alt=""
          aria-hidden
          className="pointer-events-none fixed z-[80] w-24 -translate-x-1/2 -translate-y-1/2 rounded-lg opacity-85 shadow-xl ring-2 ring-pink-500"
          style={{ left: ghost.x, top: ghost.y }}
        />
      )}
    </section>
  );
}
