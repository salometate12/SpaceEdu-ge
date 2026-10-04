"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import type { UploadedPhoto } from "@/lib/presentation-photos";
import { slideTheme } from "@/lib/presentation-theme";
import {
  aspectRatio,
  clampImage,
  keyFigureSize,
  resizeImage,
  snapImage,
  TEXT_SIZE,
  textBoxFor,
  type SlideImage,
} from "@/lib/presentation-layout";
import { effectiveLayout } from "@/lib/presentation-style";
import type { SlideTheme } from "@/lib/presentation-theme";
import type { SlideLayout } from "@/lib/presentation-constants";
import type { GeneratedSlide, PresentationTemplate } from "./PresentationWizard";

const cqw = (size: number) => `${size}cqw`;

/** A slide's text in its layout. Sizes are in container-width units so the
 * slide scales as a whole; the PPTX export mirrors the same structure. */
function SlideText({ slide, layout, theme }: { slide: GeneratedSlide; layout: SlideLayout; theme: SlideTheme }) {
  const title = (size: number, extra = "") => (
    <h3 className={`font-bold leading-[1.15] ${extra}`} style={{ color: theme.title, fontSize: cqw(size) }}>
      {slide.title}
    </h3>
  );

  if (slide.type === "thanks") {
    return (
      <>
        {title(TEXT_SIZE.coverTitle)}
        {slide.body ? (
          <p className="mt-[1.4cqw]" style={{ color: theme.body, fontSize: cqw(TEXT_SIZE.prose) }}>{slide.body}</p>
        ) : null}
        {/* Georgian letters (ყ, ღ…) reach well below the baseline: keep clear. */}
        <span className="mt-[3.4cqw] block h-[0.3cqw] w-[8cqw] rounded-full" style={{ backgroundColor: theme.accent }} />
        {slide.footnote ? (
          <p className="mt-[1.6cqw] tracking-wide" style={{ color: theme.body, fontSize: cqw(TEXT_SIZE.footnote) }}>{slide.footnote}</p>
        ) : null}
      </>
    );
  }

  if (slide.type === "cover") {
    return (
      <>
        {title(TEXT_SIZE.coverTitle)}
        {slide.body ? (
          <p className="mt-[1.6cqw] leading-snug" style={{ color: theme.body, fontSize: cqw(TEXT_SIZE.body) }}>{slide.body}</p>
        ) : null}
      </>
    );
  }

  if (layout === "section") {
    return (
      <>
        <span className="mb-[1.6cqw] block h-[0.35cqw] w-[6cqw] rounded-full" style={{ backgroundColor: theme.accent }} />
        {title(TEXT_SIZE.sectionTitle)}
        {slide.body ? (
          <p className="mt-[1.4cqw] leading-snug" style={{ color: theme.body, fontSize: cqw(TEXT_SIZE.prose) }}>{slide.body}</p>
        ) : null}
      </>
    );
  }

  const bodyStyle = { color: theme.body };
  return (
    <>
      {title(TEXT_SIZE.title)}
      {layout === "bullets" && slide.points?.length ? (
        <ul className="mt-[2.2cqw] space-y-[0.9cqw]" style={{ ...bodyStyle, fontSize: cqw(TEXT_SIZE.body) }}>
          {slide.points.map((point) => (
            <li key={point} className="flex gap-[0.8cqw] leading-snug">
              <span style={{ color: theme.accent }}>•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      ) : layout === "two-column" && slide.columns?.length ? (
        <div className="mt-[2.4cqw] grid grid-cols-2 gap-[3cqw]">
          {slide.columns.slice(0, 2).map((column) => (
            <div key={column.heading} className="border-t-[0.25cqw] pt-[1.2cqw]" style={{ borderColor: theme.accent }}>
              <p className="font-semibold" style={{ color: theme.title, fontSize: cqw(TEXT_SIZE.column + 0.25) }}>{column.heading}</p>
              <p className="mt-[0.8cqw] leading-snug" style={{ ...bodyStyle, fontSize: cqw(TEXT_SIZE.column) }}>{column.text}</p>
            </div>
          ))}
        </div>
      ) : layout === "quote" && slide.quote ? (
        <figure className="mt-[2.4cqw] border-l-[0.4cqw] pl-[2.2cqw]" style={{ borderColor: theme.accent }}>
          <blockquote className="italic leading-snug" style={{ color: theme.title, fontSize: cqw(TEXT_SIZE.quote) }}>
            „{slide.quote.text}“
          </blockquote>
          {slide.quote.author ? (
            <figcaption className="mt-[1.2cqw]" style={{ ...bodyStyle, fontSize: cqw(TEXT_SIZE.body) }}>{slide.quote.author}</figcaption>
          ) : null}
        </figure>
      ) : layout === "key-figure" && slide.figure ? (
        <div className="mt-[1.8cqw]">
          <p className="font-bold leading-[1.05]" style={{ color: theme.accent, fontSize: cqw(keyFigureSize(slide.figure.value)) }}>{slide.figure.value}</p>
          <p className="mt-[1.4cqw] leading-snug" style={{ ...bodyStyle, fontSize: cqw(TEXT_SIZE.prose) }}>{slide.figure.caption}</p>
        </div>
      ) : slide.body ? (
        <p className="mt-[2cqw] leading-relaxed" style={{ ...bodyStyle, fontSize: cqw(TEXT_SIZE.prose) }}>{slide.body}</p>
      ) : slide.points?.length ? (
        <p className="mt-[2cqw] leading-relaxed" style={{ ...bodyStyle, fontSize: cqw(TEXT_SIZE.prose) }}>{slide.points.join(" ")}</p>
      ) : null}
    </>
  );
}

type Corner = "nw" | "ne" | "sw" | "se";

export interface DragGhost {
  photoId: string;
  x: number;
  y: number;
}

interface SlideCardProps {
  slide: GeneratedSlide;
  index: number;
  template: PresentationTemplate;
  photos: Map<string, UploadedPhoto>;
  /** Off for the thumbnail strip: no selection, no dragging. */
  interactive?: boolean;
  selectedPhotoId?: string | null;
  onSelectPhoto?: (photoId: string | null) => void;
  /** A finished move/resize/nudge — one undo step. */
  onImageCommit?: (image: SlideImage) => void;
  onRemovePhoto?: (photoId: string) => void;
  /** The photo was dragged off this slide and dropped on another one. */
  onTransfer?: (photoId: string, targetSlideIndex: number) => void;
  /** Shows a floating copy of the photo while it's dragged off the slide. */
  onDragGhost?: (ghost: DragGhost | null) => void;
}

interface DragState {
  mode: "move" | "resize";
  corner?: Corner;
  photoId: string;
  ratio: number;
  startX: number;
  startY: number;
  start: SlideImage;
  rect: DOMRect;
  outside: boolean;
}

/** The slide index under a point, from `data-slide-drop` (slides and thumbnails). */
export function slideIndexAt(x: number, y: number): number | null {
  const target = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-slide-drop]");
  if (!target) return null;
  const value = Number(target.dataset.slideDrop);
  return Number.isInteger(value) ? value : null;
}

const HANDLES: { corner: Corner; className: string; cursor: string }[] = [
  { corner: "nw", className: "-left-1.5 -top-1.5", cursor: "nwse-resize" },
  { corner: "ne", className: "-right-1.5 -top-1.5", cursor: "nesw-resize" },
  { corner: "sw", className: "-bottom-1.5 -left-1.5", cursor: "nesw-resize" },
  { corner: "se", className: "-bottom-1.5 -right-1.5", cursor: "nwse-resize" },
];

/**
 * One slide at 16:9. Text and photos are positioned in percentages, with
 * text sizes in container-width units, so the slide looks the same at any
 * size — in the editor, the thumbnail strip and the PDF capture.
 */
export function SlideCard({
  slide,
  index,
  template,
  photos,
  interactive = false,
  selectedPhotoId = null,
  onSelectPhoto,
  onImageCommit,
  onRemovePhoto,
  onTransfer,
  onDragGhost,
}: SlideCardProps) {
  const theme = slideTheme(template.id);
  const slideRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  // While dragging, the moving photo's position lives here; it goes to the
  // parent (and the undo history) once, on release.
  const [live, setLiveState] = useState<SlideImage | null>(null);
  const liveRef = useRef<SlideImage | null>(null);
  const setLive = (next: SlideImage | null) => {
    liveRef.current = next;
    setLiveState(next);
  };

  const images = slide.images
    .filter((image) => photos.has(image.photoId))
    .map((image) => (live && live.photoId === image.photoId ? live : image));
  const text = textBoxFor(images);
  const isCover = slide.type === "cover";
  const centered = slide.type === "thanks";
  const layout = effectiveLayout(slide);

  useEffect(() => {
    if (!interactive) return;
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const { rect } = drag;
      if (drag.mode === "resize" && drag.corner) {
        const px = ((event.clientX - rect.left) / rect.width) * 100;
        const newWidth = drag.corner.includes("w") ? drag.start.x + drag.start.w - px : px - drag.start.x;
        setLive(resizeImage(drag.start, drag.ratio, drag.corner, newWidth));
        return;
      }
      const inside =
        event.clientX >= rect.left - 8 &&
        event.clientX <= rect.right + 8 &&
        event.clientY >= rect.top - 8 &&
        event.clientY <= rect.bottom + 8;
      if (!inside && onTransfer) {
        drag.outside = true;
        onDragGhost?.({ photoId: drag.photoId, x: event.clientX, y: event.clientY });
        return;
      }
      if (drag.outside) {
        drag.outside = false;
        onDragGhost?.(null);
      }
      const dx = ((event.clientX - drag.startX) / rect.width) * 100;
      const dy = ((event.clientY - drag.startY) / rect.height) * 100;
      setLive(clampImage(snapImage(clampImage({ ...drag.start, x: drag.start.x + dx, y: drag.start.y + dy }))));
    };
    const onUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      onDragGhost?.(null);
      const finished = liveRef.current;
      setLive(null);
      if (drag.outside) {
        const target = slideIndexAt(event.clientX, event.clientY);
        if (target !== null && target !== index) onTransfer?.(drag.photoId, target);
        return;
      }
      if (
        finished &&
        (finished.x !== drag.start.x || finished.y !== drag.start.y || finished.w !== drag.start.w)
      ) {
        onImageCommit?.(finished);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [interactive, index, onDragGhost, onImageCommit, onTransfer]);

  const startDrag = (
    event: ReactPointerEvent<HTMLElement>,
    image: SlideImage,
    mode: DragState["mode"],
    corner?: Corner,
  ) => {
    if (!interactive || !slideRef.current || event.button > 0) return;
    event.preventDefault();
    event.stopPropagation();
    onSelectPhoto?.(image.photoId);
    const photo = photos.get(image.photoId);
    dragRef.current = {
      mode,
      corner,
      photoId: image.photoId,
      ratio: photo ? aspectRatio(photo) : 4 / 3,
      startX: event.clientX,
      startY: event.clientY,
      start: image,
      rect: slideRef.current.getBoundingClientRect(),
      outside: false,
    };
  };

  const onImageKey = (event: KeyboardEvent<HTMLDivElement>, image: SlideImage) => {
    const step = event.shiftKey ? 5 : 1;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (moves[event.key]) {
      event.preventDefault();
      const [dx, dy] = moves[event.key];
      onImageCommit?.(clampImage({ ...image, x: image.x + dx, y: image.y + dy }));
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      onRemovePhoto?.(image.photoId);
    } else if (event.key === "Escape") {
      onSelectPhoto?.(null);
    }
  };

  return (
    <div
      ref={slideRef}
      data-slide-export
      data-slide-drop={index}
      onPointerDown={interactive ? () => onSelectPhoto?.(null) : undefined}
      className="@container relative aspect-video w-full select-none overflow-hidden rounded-xl border"
      style={{ backgroundColor: theme.bg, borderColor: template.border }}
    >
      <div
        className={`absolute flex flex-col overflow-hidden ${centered ? "items-center justify-center text-center" : isCover || layout === "section" ? "justify-center" : ""}`}
        style={{
          left: `${text.left}%`,
          top: `${text.top}%`,
          right: `${100 - text.right}%`,
          bottom: `${100 - text.bottom}%`,
        }}
      >
        <SlideText slide={slide} layout={layout} theme={theme} />
      </div>

      {images.map((image) => {
        const photo = photos.get(image.photoId) as UploadedPhoto;
        const selected = interactive && selectedPhotoId === image.photoId;
        return (
          <div
            key={image.photoId}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? `ფოტო: ${photo.caption || photo.name}. გადაადგილება — ისრებით, წაშლა — Delete` : undefined}
            onPointerDown={(event) => startDrag(event, image, "move")}
            onKeyDown={interactive ? (event) => onImageKey(event, image) : undefined}
            onFocus={interactive ? () => onSelectPhoto?.(image.photoId) : undefined}
            className={`absolute ${interactive ? "cursor-move touch-none focus:outline-none" : ""} ${
              selected ? "z-10 outline outline-2 outline-offset-1 outline-pink-500" : ""
            }`}
            style={{ left: `${image.x}%`, top: `${image.y}%`, width: `${image.w}%`, height: `${image.h}%` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
            <img src={photo.dataUrl} alt={photo.caption || photo.name} draggable={false} className="block h-full w-full rounded-[0.6cqw]" />
            {selected &&
              HANDLES.map((handle) => (
                <span
                  key={handle.corner}
                  data-html2canvas-ignore
                  onPointerDown={(event) => startDrag(event, image, "resize", handle.corner)}
                  className={`absolute h-3 w-3 touch-none rounded-full border-2 border-white bg-pink-500 shadow ${handle.className}`}
                  style={{ cursor: handle.cursor }}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}
