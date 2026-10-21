"use client";

import {
  useSyncExternalStore,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { GripVertical, ImagePlus, X } from "lucide-react";
import type { UploadedPhoto } from "@/lib/presentation-photos";
import { geometricShapes, AURORA_LINE_CSS, auroraBackground } from "@/lib/presentation-decor";
import {
  BAR,
  bulletMarker,
  GLASS,
  PAPER_RULE,
  slideTheme,
  themedTextBox,
  titleDecor,
} from "@/lib/presentation-theme";
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
import { FIELD_LABEL, getField, sameField, type TextField } from "@/lib/presentation-deck";
import type { GeneratedSlide, PresentationTemplate } from "@/lib/presentation-types";
import { EditableText } from "./EditableText";

/** Font sizes shrink together with --fit when the text doesn't fit. */
const fs = (size: number) => `calc(${size}cqw * var(--fit, 1))`;

/** The text-editing hooks a slide in the editor gets. */
export interface SlideTextEditing {
  /** The field to focus when it renders (a point just added with Enter). */
  focus: TextField | null;
  onFocusField: (field: TextField) => void;
  onCommit: (field: TextField, value: string) => void;
  onEnterPoint: (index: number) => void;
  onBackspacePoint: (index: number) => void;
  onRemovePoint: (index: number) => void;
  onMovePoint: (from: number, to: number) => void;
}

/** Drags a bullet point by its ⋮⋮ handle onto another point of the same list. */
function startPointDrag(event: ReactPointerEvent<HTMLElement>, from: number, onMove: (from: number, to: number) => void) {
  event.preventDefault();
  event.stopPropagation();
  const list = event.currentTarget.closest("ul");
  if (!list) return;
  const target = (x: number, y: number) => {
    const item = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-point-index]");
    return item && list.contains(item) ? item : null;
  };
  let marked: HTMLElement | null = null;
  const mark = (item: HTMLElement | null) => {
    marked?.classList.remove("point-drop-target");
    marked = item;
    marked?.classList.add("point-drop-target");
  };
  const move = (ev: PointerEvent) => mark(target(ev.clientX, ev.clientY));
  const up = (ev: PointerEvent) => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
    mark(null);
    const item = target(ev.clientX, ev.clientY);
    if (item) onMove(from, Number(item.dataset.pointIndex));
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
}

/** A slide's text in its layout. Sizes are in container-width units so the
 * slide scales as a whole; the PPTX export mirrors the same structure. */
function SlideText({
  slide,
  layout,
  theme,
  edit,
}: {
  slide: GeneratedSlide;
  layout: SlideLayout;
  theme: SlideTheme;
  edit?: SlideTextEditing;
}) {
  const text = (
    field: TextField,
    props: {
      as?: ElementType;
      className?: string;
      style?: CSSProperties;
      multiline?: boolean;
      placeholder?: string;
      onEnterAtEnd?: () => void;
      onBackspaceEmpty?: () => void;
    } = {},
  ) => (
    <EditableText
      value={getField(slide, field)}
      editable={Boolean(edit)}
      label={FIELD_LABEL[field.kind]}
      autoFocus={sameField(edit?.focus, field)}
      onFocus={() => edit?.onFocusField(field)}
      onCommit={(value) => edit?.onCommit(field, value)}
      placeholder={props.placeholder ?? FIELD_LABEL[field.kind]}
      {...props}
    />
  );

  const decor = titleDecor(theme, slide.type, layout);
  const titleStyle = { color: theme.title, fontFamily: theme.fontTitle, textAlign: slide.type === "thanks" ? undefined : theme.titleAlign };
  const title = (size: number, extra = "") => (
    <>
      {text({ kind: "title" }, { as: "h3", className: `block font-bold leading-[1.15] ${extra}`, style: { ...titleStyle, fontSize: fs(size) } })}
      {decor === "gradient" ? (
        <span className="mt-[1.3cqw] block h-[0.35cqw] w-[9cqw] shrink-0 rounded-full" style={{ backgroundImage: AURORA_LINE_CSS }} />
      ) : decor === "rule" ? (
        <span className="mt-[1.3cqw] block w-full shrink-0" style={{ height: "max(1px, 0.1cqw)", backgroundColor: PAPER_RULE }} />
      ) : null}
    </>
  );
  const detail = theme.detail ?? theme.accent;
  const body = (size: number, className: string) =>
    slide.body !== undefined && (slide.body || edit)
      ? text({ kind: "body" }, { as: "p", className: `block ${className}`, style: { color: theme.body, fontSize: fs(size) }, multiline: true })
      : null;

  if (slide.type === "thanks") {
    return (
      <>
        {title(TEXT_SIZE.coverTitle)}
        {slide.body ? body(TEXT_SIZE.prose, "mt-[1.4cqw]") : null}
        {/* Georgian letters (ყ, ღ…) reach well below the baseline: keep clear. */}
        <span
          className="mt-[3.4cqw] block h-[0.3cqw] w-[8cqw] rounded-full"
          style={theme.decor === "aurora" ? { backgroundImage: AURORA_LINE_CSS } : { backgroundColor: detail }}
        />
        {slide.footnote
          ? text({ kind: "footnote" }, { as: "p", className: "mt-[1.6cqw] block tracking-wide", style: { color: theme.body, fontSize: fs(TEXT_SIZE.footnote) } })
          : null}
      </>
    );
  }

  if (slide.type === "cover") {
    return (
      <>
        {title(TEXT_SIZE.coverTitle)}
        {body(TEXT_SIZE.body, "mt-[1.6cqw] leading-snug")}
      </>
    );
  }

  if (layout === "section") {
    return (
      <>
        <span className="mb-[1.6cqw] block h-[0.35cqw] w-[6cqw] rounded-full" style={{ backgroundColor: detail }} />
        {title(TEXT_SIZE.sectionTitle)}
        {body(TEXT_SIZE.prose, "mt-[1.4cqw] leading-snug")}
      </>
    );
  }

  const bodyStyle = { color: theme.body };
  const points = slide.points ?? [];
  return (
    <>
      {title(TEXT_SIZE.title)}
      {layout === "bullets" && (points.length || edit) ? (
        <ul className="mt-[2.2cqw] space-y-[0.9cqw]" style={{ ...bodyStyle, fontSize: fs(TEXT_SIZE.body) }}>
          {points.map((_, index) => (
            <li key={index} data-point-index={index} className="group/point relative flex gap-[0.8cqw] rounded-[0.4cqw] leading-snug">
              {theme.bulletStyle === "square" ? (
                <span className="mt-[0.5em] block h-[0.42em] w-[0.42em] shrink-0" style={{ backgroundColor: theme.accent }} />
              ) : (
                <span className="shrink-0" style={{ color: theme.accent }}>
                  {bulletMarker(theme.bulletStyle, index)}
                </span>
              )}
              {text(
                { kind: "point", index },
                {
                  className: "min-w-0 flex-1",
                  onEnterAtEnd: () => edit?.onEnterPoint(index),
                  onBackspaceEmpty: () => edit?.onBackspacePoint(index),
                },
              )}
              {edit ? (
                <span
                  data-html2canvas-ignore
                  className="absolute -right-1 -top-1 flex items-center gap-0.5 rounded-full bg-white/95 p-0.5 text-slate-600 opacity-0 shadow-sm ring-1 ring-black/10 transition-opacity group-focus-within/point:opacity-100 group-hover/point:opacity-100 [@media(hover:none)]:hidden"
                >
                  <button
                    type="button"
                    aria-label="პუნქტის გადატანა"
                    title="გადაათრიე რიგის შესაცვლელად"
                    onPointerDown={(event) => startPointDrag(event, index, edit.onMovePoint)}
                    className="flex h-6 w-6 cursor-grab touch-none items-center justify-center rounded-full hover:bg-slate-100 active:cursor-grabbing"
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="პუნქტის წაშლა"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => edit.onRemovePoint(index)}
                    className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-rose-50 hover:text-rose-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : layout === "two-column" && slide.columns?.length ? (
        <div className="mt-[2.4cqw] grid grid-cols-2 gap-[3cqw]">
          {slide.columns.slice(0, 2).map((_, index) => (
            <div key={index} className="border-t-[0.25cqw] pt-[1.2cqw]" style={{ borderColor: detail }}>
              {text(
                { kind: "column-heading", index },
                { as: "p", className: "block font-semibold", style: { color: theme.title, fontFamily: theme.fontTitle, fontSize: fs(TEXT_SIZE.column + 0.25) } },
              )}
              {text(
                { kind: "column-text", index },
                { as: "p", className: "mt-[0.8cqw] block leading-snug", style: { ...bodyStyle, fontSize: fs(TEXT_SIZE.column) }, multiline: true },
              )}
            </div>
          ))}
        </div>
      ) : layout === "quote" && slide.quote ? (
        <figure className="mt-[2.4cqw] border-l-[0.4cqw] pl-[2.2cqw]" style={{ borderColor: detail }}>
          <blockquote className="italic leading-snug" style={{ color: theme.title, fontFamily: theme.fontTitle, fontSize: fs(TEXT_SIZE.quote) }}>
            „{text({ kind: "quote" }, { multiline: true })}“
          </blockquote>
          {slide.quote.author || edit
            ? text(
                { kind: "quote-author" },
                { as: "figcaption", className: "mt-[1.2cqw] block", style: { ...bodyStyle, fontSize: fs(TEXT_SIZE.body) }, placeholder: "ავტორი (არასავალდებულო)" },
              )
            : null}
        </figure>
      ) : layout === "key-figure" && slide.figure ? (
        <div className="mt-[1.8cqw]">
          {text(
            { kind: "figure-value" },
            { as: "p", className: "block font-bold leading-[1.05]", style: { color: theme.figure ?? theme.accent, fontFamily: theme.fontTitle, fontSize: fs(keyFigureSize(slide.figure.value)) } },
          )}
          {text(
            { kind: "figure-caption" },
            { as: "p", className: "mt-[1.4cqw] block leading-snug", style: { ...bodyStyle, fontSize: fs(TEXT_SIZE.prose) }, multiline: true },
          )}
        </div>
      ) : slide.body !== undefined && (slide.body || edit) ? (
        body(TEXT_SIZE.prose, "mt-[2cqw] leading-relaxed")
      ) : slide.points?.length ? (
        <p className="mt-[2cqw] leading-relaxed" style={{ ...bodyStyle, fontSize: fs(TEXT_SIZE.prose) }}>{slide.points.join(" ")}</p>
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
  /** Makes the text editable in place. */
  textEditing?: SlideTextEditing;
  /** How much the text had to shrink to fit, and whether it still overflows. */
  onFitChange?: (fit: SlideFit, slideId: number) => void;
  /** A photo slide without a photo shows a slot; clicking it calls this. */
  onPhotoSlot?: () => void;
}

export interface SlideFit {
  scale: number;
  overflow: boolean;
}

const noSubscribe = () => () => {};
/** Aurora's painted background (drawn once in the browser; plain colour on the server). */
function useAuroraBackground(enabled: boolean): string | null {
  return useSyncExternalStore(noSubscribe, () => (enabled ? auroraBackground() : null), () => null);
}

/** Text shrinks in 5% steps down to this before the slide warns. */
export const MIN_FIT_SCALE = 0.75;

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

/** Where a photo slide's empty photo slot sits (autoLayout's image region). */
const PHOTO_SLOT = { x: 8, y: 24, w: 84, h: 69 };

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
  textEditing,
  onFitChange,
  onPhotoSlot,
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
  const { text, card } = themedTextBox(theme, textBoxFor(images), slide.type);
  const auroraImage = useAuroraBackground(theme.decor === "aurora");
  const isCover = slide.type === "cover";
  const centered = slide.type === "thanks";
  const layout = effectiveLayout(slide);

  // Text that doesn't fit shrinks a little (to MIN_FIT_SCALE), then warns;
  // it never spills off the slide. Measured on the DOM, so it also follows
  // typing (the input event) and late-loading fonts.
  const textRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<SlideFit>({ scale: 1, overflow: false });
  const measure = useCallback(() => {
    const element = textRef.current;
    if (!element) return;
    const overflows = () => element.scrollHeight > element.clientHeight + 1;
    let scale = 1;
    element.style.setProperty("--fit", "1");
    while (overflows() && scale > MIN_FIT_SCALE + 0.001) {
      scale = Math.round((scale - 0.05) * 100) / 100;
      element.style.setProperty("--fit", String(scale));
    }
    const overflow = overflows();
    setFit((previous) => (previous.scale === scale && previous.overflow === overflow ? previous : { scale, overflow }));
  }, []);
  const textBoxKey = `${text.left}/${text.top}/${text.right}/${text.bottom}`;
  useLayoutEffect(measure, [measure, slide, layout, textBoxKey]);
  useEffect(() => {
    let active = true;
    void document.fonts?.ready.then(() => active && measure());
    return () => {
      active = false;
    };
  }, [measure]);
  useEffect(() => {
    onFitChange?.(fit, slide.id);
  }, [fit, onFitChange, slide.id]);
  const showPhotoSlot = interactive && Boolean(onPhotoSlot) && slide.type === "image" && images.length === 0;

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
      style={{
        backgroundColor: theme.bg,
        borderColor: template.border,
        backgroundImage: auroraImage ? `url(${auroraImage})` : undefined,
        backgroundSize: "100% 100%",
      }}
    >
      {theme.decor === "geometric"
        ? geometricShapes(slide.type === "cover" || slide.type === "thanks").map((shape, i) => (
            <span
              key={i}
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                left: `${shape.x}%`,
                top: `${shape.y}%`,
                width: `${shape.w}%`,
                height: `${shape.h}%`,
                backgroundColor: shape.color,
                opacity: shape.opacity,
                borderRadius: shape.kind === "ellipse" ? "50%" : "0.3cqw",
              }}
            />
          ))
        : null}
      {card ? (
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-[1.2cqw]"
          style={{
            left: `${card.left}%`,
            top: `${card.top}%`,
            right: `${100 - card.right}%`,
            bottom: `${100 - card.bottom}%`,
            backgroundColor: GLASS.fill,
            border: `1px solid ${GLASS.line}`,
          }}
        />
      ) : null}
      {titleDecor(theme, slide.type, layout) === "bar" ? (
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            left: `${text.left - BAR.offset}%`,
            top: `calc(${text.top}% + ${BAR.top}cqw)`,
            width: `${BAR.w}%`,
            height: `calc(${BAR.h}cqw * ${fit.scale})`,
            backgroundColor: theme.accent,
          }}
        />
      ) : null}
      {theme.slideNumber && index >= 0 && slide.type !== "cover" ? (
        <span
          className="pointer-events-none absolute font-semibold tabular-nums"
          style={{ right: "3.2%", bottom: "3.4%", fontSize: `${TEXT_SIZE.footnote * 0.8}cqw`, color: theme.accent, fontFamily: theme.fontBody }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      ) : null}
      <div
        ref={textRef}
        onInput={measure}
        className={`absolute flex flex-col overflow-hidden ${centered ? "items-center justify-center text-center" : isCover || layout === "section" ? "justify-center" : ""}`}
        style={{
          left: `${text.left}%`,
          top: `${text.top}%`,
          right: `${100 - text.right}%`,
          bottom: `${showPhotoSlot ? 100 - PHOTO_SLOT.y + 2 : 100 - text.bottom}%`,
          fontFamily: theme.fontBody,
          ["--fit" as string]: fit.scale,
        }}
      >
        <SlideText slide={slide} layout={layout} theme={theme} edit={interactive ? textEditing : undefined} />
      </div>

      {showPhotoSlot ? (
        <button
          type="button"
          data-html2canvas-ignore
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onPhotoSlot}
          className="absolute flex flex-col items-center justify-center gap-2 rounded-[0.8cqw] border-2 border-dashed text-sm font-semibold transition hover:opacity-100"
          style={{
            left: `${PHOTO_SLOT.x}%`,
            top: `${PHOTO_SLOT.y}%`,
            width: `${PHOTO_SLOT.w}%`,
            height: `${PHOTO_SLOT.h}%`,
            borderColor: theme.accent,
            color: theme.body,
            opacity: 0.8,
          }}
        >
          <ImagePlus className="h-6 w-6" />
          ფოტოს ჩასმა
        </button>
      ) : null}

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
