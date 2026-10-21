"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ClipboardCopy,
  Copy,
  CopyPlus,
  Download,
  ImagePlus,
  LayoutTemplate,
  Loader2,
  MoreHorizontal,
  Palette,
  Plus,
  Redo2,
  RotateCcw,
  Sparkles,
  Trash2,
  Undo2,
  Wand2,
  X,
} from "lucide-react";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import { copyToClipboard } from "@/lib/copy-to-clipboard";
import { exportToPdf } from "@/lib/exportPdf";
import { exportToPptx } from "@/lib/exportPptx";
import { SLIDE_LAYOUTS, type PresentationRewriteMode, type SlideLayout } from "@/lib/presentation-constants";
import {
  canDeleteField,
  convertLayout,
  deleteField,
  deleteSlide,
  duplicateSlide,
  FIELD_LABEL,
  getField,
  insertPoint,
  insertSlideAfter,
  LAYOUT_LABEL,
  moveItem,
  NEW_SLIDE_KINDS,
  NEW_SLIDE_LABEL,
  newSlide,
  nextSlideId,
  removePoint,
  setField,
  slidePlainText,
  updateSlideAt,
  type NewSlideKind,
  type TextField,
} from "@/lib/presentation-deck";
import { autoLayout, type SlideImage } from "@/lib/presentation-layout";
import { PHOTO_ACCEPT_ATTR, processPhotoFiles, type UploadedPhoto } from "@/lib/presentation-photos";
import { deckLanguage, effectiveLayout, pointsToProse } from "@/lib/presentation-style";
import { PRESENTATION_TEMPLATES, presentationTemplate } from "@/lib/presentation-templates";
import type { Deck, GeneratedSlide } from "@/lib/presentation-types";
import { EditableText } from "./EditableText";
import { Menu, MenuItem, MenuLabel, useToast } from "./EditorMenus";
import { SlideCard, slideIndexAt, type DragGhost, type SlideFit, type SlideTextEditing } from "./SlideCard";
import { NewBadge, TemplatePreview } from "./TemplatePreview";

interface Step4ResultProps {
  deck: Deck;
  photos: UploadedPhoto[];
  /** The deck's language („ქართული“, „English“…) for new thank-you slides. */
  language: string;
  topic: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  /** One undo step. */
  onCommit: (deck: Deck) => void;
  onPhotosChange: (photos: UploadedPhoto[]) => void;
  onNewPresentation: () => void;
  /** „ინახება…“ / „შენახულია ✓“ next to the title. */
  saveStatus?: ReactNode;
}

interface PhotoSelection {
  slide: number;
  photoId: string;
}

interface FieldSelection {
  slide: number;
  field: TextField;
}

const REWRITE_LABEL: Record<PresentationRewriteMode, string> = {
  shorter: "მოკლედ",
  academic: "უფრო აკადემიურად",
  simpler: "უფრო მარტივად",
  prose: "პუნქტებიდან ტექსტად",
};

/** Waits for React to paint (e.g. the selection frame to disappear). */
const nextPaint = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

const secondaryBtn =
  "inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-pink-400/30 dark:hover:bg-pink-500/10 dark:hover:text-white";
const barBtn =
  "inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700 transition hover:border-pink-300 hover:text-pink-700 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:border-pink-400/30";

export function Step4Result({
  deck,
  photos,
  language,
  topic,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onCommit,
  onPhotosChange,
  onNewPresentation,
  saveStatus,
}: Step4ResultProps) {
  const { slides } = deck;
  const template = presentationTemplate(deck.templateId);
  const photoMap = useMemo(() => new Map(photos.map((photo) => [photo.id, photo])), [photos]);
  const [selected, setSelected] = useState<PhotoSelection | null>(null);
  const [selectedField, setSelectedField] = useState<FieldSelection | null>(null);
  const [focusRequest, setFocusRequest] = useState<FieldSelection | null>(null);
  const [activeSlide, setActiveSlide] = useState<number | null>(null);
  const [ghost, setGhost] = useState<DragGhost | null>(null);
  const [hoverSlide, setHoverSlide] = useState<number | null>(null);
  const [shelfMenu, setShelfMenu] = useState<string | null>(null);
  const [slotPicker, setSlotPicker] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "pptx" | null>(null);
  const [rewriting, setRewriting] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [overflowing, setOverflowing] = useState<Set<number>>(() => new Set());
  const [thumbDrag, setThumbDrag] = useState<{ from: number; to: number } | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // The latest deck for handlers that outlive a render (drag listeners) and
  // for two edits in one gesture (Enter: save the point, then add one).
  const deckRef = useRef(deck);
  useEffect(() => {
    deckRef.current = deck;
  }, [deck]);

  const commitDeck = useCallback(
    (next: Deck) => {
      deckRef.current = next;
      onCommit(next);
    },
    [onCommit],
  );
  const commit = useCallback(
    (nextSlides: GeneratedSlide[]) => commitDeck({ ...deckRef.current, slides: nextSlides }),
    [commitDeck],
  );
  const editSlide = useCallback(
    (index: number, update: (slide: GeneratedSlide) => GeneratedSlide) =>
      commit(updateSlideAt(deckRef.current.slides, index, update)),
    [commit],
  );

  // How much each slide's text shrank (by slide id), for the PPTX export.
  const fits = useRef(new Map<number, SlideFit>());
  const onFitChange = useCallback((fit: SlideFit, id: number) => {
    fits.current.set(id, fit);
    setOverflowing((current) => {
      if (current.has(id) === fit.overflow) return current;
      const next = new Set(current);
      if (fit.overflow) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const clearSelection = () => {
    setSelected(null);
    setSelectedField(null);
    setSlotPicker(null);
  };

  const undo = useCallback(() => {
    setSelected(null);
    setSelectedField(null);
    onUndo();
  }, [onUndo]);
  const redo = useCallback(() => {
    setSelected(null);
    setSelectedField(null);
    onRedo();
  }, [onRedo]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]:not([contenteditable=false])")) return;
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // A click anywhere outside the slides and their toolbars drops the selection.
  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if ((event.target as HTMLElement | null)?.closest("[data-editor-keep]")) return;
      setSelectedField(null);
      setSelected(null);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, []);

  const onShelf = photos.filter((photo) => !slides.some((slide) => slide.images.some((img) => img.photoId === photo.id)));

  // ---- photos ----

  const updateImage = useCallback(
    (slideIndex: number, image: SlideImage) =>
      editSlide(slideIndex, (slide) => ({
        ...slide,
        images: slide.images.map((img) => (img.photoId === image.photoId ? image : img)),
      })),
    [editSlide],
  );

  /** Takes a photo off its slide; it shows up on the shelf. */
  const removePhoto = useCallback(
    (photoId: string) => {
      setSelected(null);
      commit(
        deckRef.current.slides.map((slide) => ({
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
      const next = deckRef.current.slides.map((slide, i) => {
        const others = slide.images.filter((img) => img.photoId !== photoId);
        if (i !== targetIndex) return others.length === slide.images.length ? slide : { ...slide, images: others };
        const sizes = [...others.map((img) => img.photoId), photoId]
          .map((id) => photoMap.get(id))
          .filter((photo): photo is UploadedPhoto => Boolean(photo));
        return { ...slide, images: autoLayout(slide, sizes) };
      });
      commit(next);
      setSelected({ slide: targetIndex, photoId });
      setSelectedField(null);
      setShelfMenu(null);
      setSlotPicker(null);
    },
    [commit, photoMap],
  );

  /** Puts one photo back where autoLayout would have it. */
  const resetPhoto = (slideIndex: number, photoId: string) => {
    const slide = deckRef.current.slides[slideIndex];
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

  // ---- text ----

  const textEditing = (index: number): SlideTextEditing => ({
    focus: focusRequest?.slide === index ? focusRequest.field : null,
    onFocusField: (field) => {
      setSelectedField({ slide: index, field });
      setActiveSlide(index);
      setSelected(null);
      setFocusRequest(null);
    },
    onCommit: (field, value) => editSlide(index, (slide) => setField(slide, field, value)),
    onEnterPoint: (point) => {
      editSlide(index, (slide) => insertPoint(slide, point + 1));
      setFocusRequest({ slide: index, field: { kind: "point", index: point + 1 } });
    },
    onBackspacePoint: (point) => {
      editSlide(index, (slide) => removePoint(slide, point));
      setSelectedField(null);
      if (point > 0) setFocusRequest({ slide: index, field: { kind: "point", index: point - 1 } });
    },
    onRemovePoint: (point) => {
      editSlide(index, (slide) => removePoint(slide, point));
      setSelectedField(null);
    },
    onMovePoint: (from, to) => editSlide(index, (slide) => ({ ...slide, points: moveItem(slide.points ?? [], from, to) })),
  });

  const copyText = async (text: string, done = "დაკოპირდა") => {
    const ok = await copyToClipboard(text);
    toast.show(ok ? { text: done } : { text: "ვერ დაკოპირდა", tone: "error" });
  };

  const addPoint = (index: number, after?: number) => {
    const slide = deckRef.current.slides[index];
    const at = after === undefined ? (slide.points?.length ?? 0) : after + 1;
    editSlide(index, (current) => insertPoint({ ...current, layout: "bullets" }, at));
    setFocusRequest({ slide: index, field: { kind: "point", index: at } });
  };

  const rewrite = async (index: number, field: TextField, mode: PresentationRewriteMode) => {
    const slide = deckRef.current.slides[index];
    const wholeList = mode === "prose";
    const source = wholeList ? (slide.points ?? []).join("\n") : getField(slide, field);
    if (!source.trim()) return;
    setRewriting(true);
    try {
      const { text } = await fetchAiJson<{ text: string }>({
        pageType: "presentation-rewrite",
        payload: {
          text: source,
          mode,
          kind: wholeList ? "პუნქტები" : FIELD_LABEL[field.kind],
          topic: topic || deckRef.current.title,
          slideTitle: slide.title,
        },
      });
      if (!text.trim()) return;
      if (wholeList) {
        editSlide(index, (current) => ({ ...current, layout: "prose", body: text }));
        setSelectedField(null);
      } else {
        editSlide(index, (current) => setField(current, field, text));
      }
      toast.show({ text: "გადაიწერა", action: { label: "დაბრუნება", run: undo } });
    } catch (error) {
      toast.show({ text: error instanceof Error ? error.message : "AI ვერ გადაწერა. სცადე ხელახლა.", tone: "error" });
    } finally {
      setRewriting(false);
    }
  };

  // ---- slides ----

  /** New slides go after the slide being worked on; by default before the thank-you slide. */
  const insertAnchor = () => {
    if (activeSlide !== null && activeSlide < slides.length) return activeSlide;
    return slides[slides.length - 1]?.type === "thanks" ? slides.length - 2 : slides.length - 1;
  };

  const scrollToSlide = (index: number) =>
    document.getElementById(`slide-${index}`)?.scrollIntoView({ behavior: "smooth", block: "center" });

  const addSlide = async (kind: NewSlideKind) => {
    const current = deckRef.current.slides;
    const { slides: next, index } = insertSlideAfter(
      current,
      insertAnchor(),
      newSlide(kind, nextSlideId(current), deckLanguage(language)),
    );
    commit(next);
    setActiveSlide(index);
    clearSelection();
    if (kind === "image") setSlotPicker(index);
    await nextPaint();
    scrollToSlide(index);
  };

  const duplicate = (index: number) => {
    commit(duplicateSlide(deckRef.current.slides, index));
    setActiveSlide(index + 1);
    clearSelection();
    toast.show({ text: "სლაიდი დუბლირდა" });
  };

  const removeSlide = (index: number) => {
    commit(deleteSlide(deckRef.current.slides, index));
    setConfirmDelete(null);
    clearSelection();
    setActiveSlide(null);
    toast.show({ text: "სლაიდი წაიშალა", action: { label: "დაბრუნება", run: undo } });
  };

  const moveSlide = (from: number, to: number) => {
    if (to < 0 || to >= deckRef.current.slides.length || from === to) return;
    commit(moveItem(deckRef.current.slides, from, to));
    setActiveSlide(to);
    clearSelection();
  };

  const changeLayout = (index: number, layout: SlideLayout) => {
    editSlide(index, (slide) => convertLayout(slide, layout));
    setSelectedField(null);
  };

  // Reordering in the thumbnail strip with a mouse (touch scrolls the strip;
  // there the slide menu's „ზემოთ / ქვემოთ“ moves slides).
  const thumbPress = useRef<{ from: number; x: number; y: number; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);
  const moveSlideRef = useRef(moveSlide);
  useEffect(() => {
    moveSlideRef.current = moveSlide;
  });
  useEffect(() => {
    const thumbAt = (x: number, y: number) => {
      const element = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-thumb-index]");
      return element ? Number(element.dataset.thumbIndex) : null;
    };
    const onMove = (event: PointerEvent) => {
      const press = thumbPress.current;
      if (!press) return;
      if (!press.dragging && Math.hypot(event.clientX - press.x, event.clientY - press.y) < 6) return;
      press.dragging = true;
      const to = thumbAt(event.clientX, event.clientY);
      setThumbDrag({ from: press.from, to: to ?? press.from });
    };
    const onUp = (event: PointerEvent) => {
      const press = thumbPress.current;
      if (!press) return;
      thumbPress.current = null;
      setThumbDrag(null);
      if (!press.dragging) return;
      suppressClick.current = true;
      const to = thumbAt(event.clientX, event.clientY);
      if (to !== null) moveSlideRef.current(press.from, to);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  // ---- export ----

  const runExport = async (kind: "pdf" | "pptx") => {
    setExporting(kind);
    clearSelection();
    setShelfMenu(null);
    try {
      await nextPaint();
      if (kind === "pdf") await exportToPdf("presentation-preview", deck.title);
      else
        await exportToPptx(
          slides,
          deck.templateId,
          deck.title,
          photos,
          slides.map((slide) => fits.current.get(slide.id)?.scale ?? 1),
        );
    } finally {
      setExporting(null);
    }
  };

  const slideOption = (slide: GeneratedSlide, index: number) => `#${index + 1} ${slide.title}`.slice(0, 60);
  const ghostPhoto = ghost ? photoMap.get(ghost.photoId) : undefined;
  const editing = exporting === null;
  const layoutOptions = (slide: GeneratedSlide) => (slide.type === "cover" || slide.type === "thanks" ? [] : SLIDE_LAYOUTS);

  /** The ⋯ menu of a slide — on the slide and on its thumbnail. */
  const slideMenu = (index: number, trigger: (props: { open: boolean; toggle: () => void }) => ReactNode) => {
    const slide = slides[index];
    const layout = effectiveLayout(slide);
    return (
      <Menu trigger={trigger} panelClassName="w-60">
        {(close) =>
          confirmDelete === index ? (
            <div className="p-2">
              <p className="mb-2 text-sm font-medium text-slate-700 dark:text-zinc-200">წავშალო სლაიდი #{index + 1}?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    removeSlide(index);
                    close();
                  }}
                  className="flex-1 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-500"
                >
                  წაშლა
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-zinc-200"
                >
                  გაუქმება
                </button>
              </div>
            </div>
          ) : (
            <>
              <MenuItem
                icon={<CopyPlus className="h-4 w-4" />}
                onClick={() => {
                  duplicate(index);
                  close();
                }}
              >
                დუბლირება
              </MenuItem>
              <MenuItem icon={<ArrowUp className="h-4 w-4" />} disabled={index === 0} onClick={() => moveSlide(index, index - 1)}>
                ზემოთ გადატანა
              </MenuItem>
              <MenuItem
                icon={<ArrowDown className="h-4 w-4" />}
                disabled={index === slides.length - 1}
                onClick={() => moveSlide(index, index + 1)}
              >
                ქვემოთ გადატანა
              </MenuItem>
              <MenuItem
                icon={<ClipboardCopy className="h-4 w-4" />}
                onClick={() => {
                  void copyText(slidePlainText(slide), "სლაიდის ტექსტი დაკოპირდა");
                  close();
                }}
              >
                სლაიდის ტექსტის კოპირება
              </MenuItem>
              {layoutOptions(slide).length > 0 ? (
                <>
                  <MenuLabel>განლაგება</MenuLabel>
                  <div className="grid grid-cols-2 gap-1">
                    {layoutOptions(slide).map((option) => (
                      <MenuItem
                        key={option}
                        active={option === layout}
                        onClick={() => {
                          changeLayout(index, option);
                          close();
                        }}
                      >
                        {LAYOUT_LABEL[option]}
                      </MenuItem>
                    ))}
                  </div>
                </>
              ) : null}
              <div className="my-1 h-px bg-slate-100 dark:bg-white/10" />
              <MenuItem
                icon={<Trash2 className="h-4 w-4" />}
                danger
                disabled={slides.length <= 1}
                onClick={() => setConfirmDelete(index)}
              >
                სლაიდის წაშლა
              </MenuItem>
            </>
          )
        }
      </Menu>
    );
  };

  const menuTrigger =
    (index: number, className: string, iconClass: string) =>
    function SlideMenuTrigger({ toggle, open }: { open: boolean; toggle: () => void }) {
      return (
        <MenuDots
          open={open}
          onClick={() => {
            setConfirmDelete(null);
            toggle();
          }}
          label={`სლაიდი ${index + 1}: მენიუ`}
          className={className}
          iconClass={iconClass}
        />
      );
    };

  return (
    <section>
      {/* A plain header row (no card): title and chips left, exports right;
          on a phone the buttons drop below the title. */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-pink-100 bg-pink-50 text-pink-600 dark:border-pink-400/15 dark:bg-pink-500/10 dark:text-pink-400">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0" data-editor-keep>
            <EditableText
              as="h2"
              value={deck.title}
              editable={editing}
              label="პრეზენტაციის სათაური"
              placeholder="პრეზენტაციის სათაური"
              onCommit={(title) => commitDeck({ ...deckRef.current, title: title.trim() || deckRef.current.title })}
              className="headline block text-xl font-semibold text-slate-900 dark:text-zinc-100"
            />
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 dark:border-white/[0.1] dark:bg-white/[0.03]">
                {template.name}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 dark:border-white/[0.1] dark:bg-white/[0.03]">
                {slides.length} სლაიდი
              </span>
              {saveStatus}
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
          <button type="button" onClick={onNewPresentation} className={secondaryBtn}>
            <Plus className="mr-1 h-4 w-4" strokeWidth={2} />
            ახალი პრეზენტაცია
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-2 flex flex-wrap items-center gap-2" data-editor-keep>
        <Menu
          align="left"
          panelClassName="w-[min(30rem,calc(100vw-2rem))]"
          trigger={({ toggle, open }) => (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              className={`${secondaryBtn} !border-pink-300 !text-pink-700 dark:!border-pink-400/40 dark:!text-pink-300`}
            >
              <Plus className="mr-1 h-4 w-4" />
              ახალი სლაიდი
            </button>
          )}
        >
          {(close) => (
            <>
              <MenuLabel>ჩაემატება სლაიდი #{insertAnchor() + 1}-ის შემდეგ</MenuLabel>
              <div className="grid grid-cols-2 gap-2 p-1 sm:grid-cols-4">
                {NEW_SLIDE_KINDS.map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => {
                      close();
                      void addSlide(kind);
                    }}
                    className="flex flex-col justify-start rounded-lg p-1 text-left transition hover:bg-pink-50 dark:hover:bg-pink-500/10"
                  >
                    <div className="pointer-events-none">
                      <SlideCard slide={newSlide(kind, 0, deckLanguage(language))} index={-1} template={template} photos={photoMap} />
                    </div>
                    <span className="mt-1 block text-xs font-semibold text-slate-700 dark:text-zinc-200">{NEW_SLIDE_LABEL[kind]}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </Menu>
        <Menu
          align="left"
          panelClassName="w-[min(26rem,calc(100vw-2rem))]"
          trigger={({ toggle, open }) => (
            <button type="button" onClick={toggle} aria-expanded={open} className={secondaryBtn}>
              <Palette className="mr-1 h-4 w-4" />
              დიზაინი
            </button>
          )}
        >
          {(close) => (
            <div className="grid grid-cols-2 gap-2 p-1 sm:grid-cols-3">
              {PRESENTATION_TEMPLATES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    if (option.id !== deckRef.current.templateId) commitDeck({ ...deckRef.current, templateId: option.id });
                    close();
                  }}
                  className={`flex flex-col justify-start rounded-lg p-1 text-left transition ${
                    option.id === deck.templateId
                      ? "bg-pink-50 ring-2 ring-pink-400 dark:bg-pink-500/10"
                      : "hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <TemplatePreview template={option} />
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200">
                    {option.name}
                    {option.isNew ? <NewBadge /> : null}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Menu>
        <button type="button" onClick={() => addInputRef.current?.click()} className={secondaryBtn}>
          <ImagePlus className="mr-1 h-4 w-4" />
          ფოტო
        </button>
        <span className="mx-0.5 hidden h-6 w-px bg-slate-200 sm:block dark:bg-white/10" />
        <button type="button" onClick={undo} disabled={!canUndo} className={secondaryBtn} title="დაბრუნება (Ctrl/Cmd+Z)" aria-label="დაბრუნება">
          <Undo2 className="h-4 w-4 sm:mr-1" />
          <span className="max-sm:hidden">დაბრუნება</span>
        </button>
        <button type="button" onClick={redo} disabled={!canRedo} className={secondaryBtn} title="გამეორება (Ctrl/Cmd+Shift+Z)" aria-label="გამეორება">
          <Redo2 className="h-4 w-4 sm:mr-1" />
          <span className="max-sm:hidden">გამეორება</span>
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
      </div>
      <p className="mb-3 text-xs text-slate-500 dark:text-zinc-500">
        ტექსტზე დააჭირე და იქვე ჩაასწორე · Esc აუქმებს · ფოტო გადაათრიე, კუთხით გაადიდე
      </p>
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
        {/* Slide strip: click to jump, drag (mouse) to reorder, drop a photo to move it there. */}
        <nav aria-label="სლაიდები" className="mb-4 lg:mb-0">
          <ol className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:pr-1">
            {slides.map((slide, index) => {
              const dropHere = thumbDrag !== null && thumbDrag.to === index && thumbDrag.from !== index;
              const after = thumbDrag !== null && thumbDrag.from < index;
              return (
                <li
                  key={slide.id}
                  data-thumb-index={index}
                  className={`group/thumb relative w-28 shrink-0 lg:w-full ${thumbDrag?.from === index ? "opacity-50" : ""}`}
                >
                  {dropHere ? (
                    <span
                      aria-hidden
                      className={`absolute z-10 rounded-full bg-pink-500 max-lg:top-0 max-lg:h-full max-lg:w-1 lg:h-1 lg:w-full ${
                        after ? "max-lg:-right-1.5 lg:-bottom-1.5" : "max-lg:-left-1.5 lg:-top-1.5"
                      }`}
                    />
                  ) : null}
                  <button
                    type="button"
                    data-slide-drop={index}
                    onPointerDown={(event) => {
                      if (event.pointerType !== "mouse" || event.button > 0) return;
                      thumbPress.current = { from: index, x: event.clientX, y: event.clientY, dragging: false };
                    }}
                    onClick={() => {
                      if (suppressClick.current) {
                        suppressClick.current = false;
                        return;
                      }
                      setActiveSlide(index);
                      scrollToSlide(index);
                    }}
                    className={`block w-full rounded-xl text-left transition ${
                      hoverSlide === index
                        ? "ring-2 ring-pink-500 ring-offset-2 dark:ring-offset-[#121214]"
                        : activeSlide === index
                          ? "ring-2 ring-pink-300 ring-offset-1 dark:ring-pink-400/50 dark:ring-offset-[#121214]"
                          : ""
                    }`}
                    aria-label={`სლაიდი ${index + 1}: ${slide.title}`}
                  >
                    <div className="pointer-events-none">
                      <SlideCard slide={slide} index={index} template={template} photos={photoMap} />
                    </div>
                    <span className="mt-1 block text-[10px] font-semibold text-slate-500 dark:text-zinc-500">#{index + 1}</span>
                  </button>
                  <div className="absolute right-1 top-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover/thumb:opacity-100 [@media(hover:none)]:opacity-100">
                    {slideMenu(
                      index,
                      menuTrigger(
                        index,
                        "flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/75",
                        "h-3.5 w-3.5",
                      ),
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>

        <div id="presentation-preview" className="grid gap-5">
          {slides.map((slide, index) => {
            const selection = selected?.slide === index ? selected : null;
            const selectedPhoto = selection ? photoMap.get(selection.photoId) : undefined;
            const fieldSelection = editing && selectedField?.slide === index ? selectedField.field : null;
            const layout = effectiveLayout(slide);
            const isFrame = slide.type === "cover" || slide.type === "thanks";
            return (
              <article key={slide.id} id={`slide-${index}`} data-editor-keep onPointerDown={() => setActiveSlide(index)}>
                <div className="mb-1.5 flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-500">
                  <span
                    className={`mono rounded-full px-2 py-0.5 ${
                      activeSlide === index
                        ? "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300"
                        : "bg-slate-100 dark:bg-white/10"
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <span className="truncate">{slide.slideType || slide.type}</span>
                  {!isFrame ? (
                    <span className="hidden items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 sm:inline-flex dark:border-white/10">
                      <LayoutTemplate className="h-3 w-3" />
                      {LAYOUT_LABEL[layout]}
                    </span>
                  ) : null}
                  <div className="ml-auto">
                    {slideMenu(
                      index,
                      menuTrigger(
                        index,
                        "flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white",
                        "h-4 w-4",
                      ),
                    )}
                  </div>
                </div>
                <div className={hoverSlide === index ? "rounded-xl ring-2 ring-pink-500 ring-offset-2 dark:ring-offset-[#121214]" : ""}>
                  <SlideCard
                    slide={slide}
                    index={index}
                    template={template}
                    photos={photoMap}
                    interactive
                    selectedPhotoId={selection?.photoId ?? null}
                    onSelectPhoto={(photoId) => {
                      setSelected(photoId ? { slide: index, photoId } : null);
                      if (photoId) setSelectedField(null);
                    }}
                    onImageCommit={(image) => updateImage(index, image)}
                    onRemovePhoto={removePhoto}
                    onTransfer={placePhoto}
                    onDragGhost={handleGhost}
                    textEditing={editing ? textEditing(index) : undefined}
                    onFitChange={onFitChange}
                    onPhotoSlot={() => setSlotPicker((open) => (open === index ? null : index))}
                  />
                </div>

                {overflowing.has(slide.id) ? (
                  <p className="mt-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                    ტექსტი სლაიდზე არ ეტევა — შეამოკლე, ან ნაწილი ახალ სლაიდზე გადაიტანე.
                  </p>
                ) : null}

                {fieldSelection ? (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-xl border border-pink-200 bg-pink-50/60 px-2.5 py-2 text-xs dark:border-pink-400/20 dark:bg-pink-500/10">
                    <span className="mr-1 font-semibold text-pink-800 dark:text-pink-200">{FIELD_LABEL[fieldSelection.kind]}</span>
                    <button
                      type="button"
                      className={barBtn}
                      onClick={() => void copyText(getField(deckRef.current.slides[index], fieldSelection))}
                    >
                      <Copy className="h-3 w-3" />
                      კოპირება
                    </button>
                    {fieldSelection.kind === "point" ? (
                      <button
                        type="button"
                        className={barBtn}
                        onClick={() => {
                          const point = fieldSelection.index;
                          editSlide(index, (current) => insertPoint(current, point + 1, getField(current, fieldSelection)));
                          setSelectedField({ slide: index, field: { kind: "point", index: point + 1 } });
                        }}
                      >
                        <CopyPlus className="h-3 w-3" />
                        დუბლირება
                      </button>
                    ) : null}
                    {fieldSelection.kind === "point" ? (
                      <>
                        <button
                          type="button"
                          className={barBtn}
                          aria-label="პუნქტი ზემოთ"
                          disabled={fieldSelection.index === 0}
                          onClick={() => {
                            const point = fieldSelection.index;
                            editSlide(index, (current) => ({ ...current, points: moveItem(current.points ?? [], point, point - 1) }));
                            setSelectedField({ slide: index, field: { kind: "point", index: point - 1 } });
                          }}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          className={barBtn}
                          aria-label="პუნქტი ქვემოთ"
                          disabled={fieldSelection.index >= (slide.points?.length ?? 0) - 1}
                          onClick={() => {
                            const point = fieldSelection.index;
                            editSlide(index, (current) => ({ ...current, points: moveItem(current.points ?? [], point, point + 1) }));
                            setSelectedField({ slide: index, field: { kind: "point", index: point + 1 } });
                          }}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </>
                    ) : null}
                    {layout === "bullets" && !isFrame ? (
                      <button
                        type="button"
                        className={barBtn}
                        onClick={() => addPoint(index, fieldSelection.kind === "point" ? fieldSelection.index : undefined)}
                      >
                        <Plus className="h-3 w-3" />
                        პუნქტი
                      </button>
                    ) : null}
                    {canDeleteField(fieldSelection) ? (
                      <button
                        type="button"
                        className={`${barBtn} hover:!border-rose-300 hover:!text-rose-700`}
                        onClick={() => {
                          editSlide(index, (current) => deleteField(current, fieldSelection));
                          setSelectedField(null);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                        წაშლა
                      </button>
                    ) : null}
                    <Menu
                      align="left"
                      trigger={({ toggle, open }) => (
                        <button type="button" onClick={toggle} aria-expanded={open} disabled={rewriting} className={barBtn}>
                          {rewriting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                          AI-ით გადაწერა
                        </button>
                      )}
                    >
                      {(close) => (
                        <>
                          {(["shorter", "academic", "simpler"] as const).map((mode) => (
                            <MenuItem
                              key={mode}
                              onClick={() => {
                                close();
                                void rewrite(index, fieldSelection, mode);
                              }}
                            >
                              {REWRITE_LABEL[mode]}
                            </MenuItem>
                          ))}
                          {layout === "bullets" && (slide.points?.length ?? 0) > 0 ? (
                            <MenuItem
                              onClick={() => {
                                close();
                                void rewrite(index, fieldSelection, "prose");
                              }}
                            >
                              {REWRITE_LABEL.prose}
                            </MenuItem>
                          ) : null}
                        </>
                      )}
                    </Menu>
                    {layout === "bullets" && (slide.points?.length ?? 0) > 1 ? (
                      <button
                        type="button"
                        className={barBtn}
                        title="პუნქტები ერთ აბზაცად, AI-ის გარეშე"
                        onClick={() => {
                          editSlide(index, (current) => ({ ...current, layout: "prose", body: pointsToProse(current.points ?? []) }));
                          setSelectedField(null);
                        }}
                      >
                        ტექსტად გაერთიანება
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {slotPicker === index && slide.images.length === 0 ? (
                  <div className="mt-2 rounded-xl border border-pink-200 bg-pink-50/60 p-2.5 text-xs dark:border-pink-400/20 dark:bg-pink-500/10">
                    <p className="mb-2 font-semibold text-pink-800 dark:text-pink-200">აირჩიე ფოტო თაროდან</p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {onShelf.map((photo) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => placePhoto(photo.id, index)}
                          className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-white ring-1 ring-black/10 hover:ring-2 hover:ring-pink-500"
                          aria-label={`ჩასმა: ${photo.caption || photo.name}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
                          <img src={photo.dataUrl} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => addInputRef.current?.click()}
                        className="flex h-14 w-20 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-pink-300 font-semibold text-pink-700 dark:border-pink-400/40 dark:text-pink-300"
                      >
                        <ImagePlus className="h-4 w-4" />
                        ატვირთვა
                      </button>
                    </div>
                  </div>
                ) : null}

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
                    <button type="button" onClick={() => resetPhoto(index, selection.photoId)} className={barBtn}>
                      <RotateCcw className="h-3 w-3" />
                      ზომის აღდგენა
                    </button>
                    <button
                      type="button"
                      onClick={() => removePhoto(selection.photoId)}
                      className={`${barBtn} hover:!border-rose-300 hover:!text-rose-700`}
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
      {toast.element}
    </section>
  );
}

function MenuDots({
  open,
  onClick,
  label,
  className,
  iconClass,
}: {
  open: boolean;
  onClick: () => void;
  label: string;
  className: string;
  iconClass: string;
}) {
  return (
    <button type="button" onClick={onClick} aria-expanded={open} aria-label={label} className={className}>
      <MoreHorizontal className={iconClass} />
    </button>
  );
}
