"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { exportToPdf } from "@/lib/exportPdf";
import { exportToPptx } from "@/lib/exportPptx";
import type { UploadedPhoto } from "@/lib/presentation-photos";
import {
  deletePresentation,
  duplicatePresentation,
  loadPresentation,
  MAX_PRESENTATIONS,
  renamePresentation,
  type SavedPresentation,
} from "@/lib/presentation-store";
import { presentationTemplate } from "@/lib/presentation-templates";
import type { GeneratedSlide } from "@/lib/presentation-types";
import { relativeTimeKa } from "@/lib/relative-time-ka";
import { Menu, MenuItem, useToast } from "./EditorMenus";
import { SlideCard } from "./SlideCard";

const NO_PHOTOS = new Map<string, UploadedPhoto>();
const RECENT_DRAFT_MS = 24 * 60 * 60 * 1000;

/** The card's picture: the first slide, or the topic on the chosen design for a draft. */
function coverOf(presentation: SavedPresentation): GeneratedSlide {
  const first = presentation.slides?.[0];
  if (first) return { ...first, images: [] };
  return {
    id: 0,
    type: "cover",
    slideType: "",
    title: presentation.form.topic.trim() || "მონახაზი",
    body: presentation.form.subject || undefined,
    images: [],
  };
}

interface MyPresentationsProps {
  presentations: SavedPresentation[];
  onOpen: (id: string) => void;
  onNew: () => void;
  onChanged: () => void;
}

const nextPaint = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

export function MyPresentations({ presentations, onOpen, onNew, onChanged }: MyPresentationsProps) {
  const [query, setQuery] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  // Deleted, but still undoable for a few seconds.
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const pendingDeletes = useRef(new Map<string, number>());
  const [exportJob, setExportJob] = useState<{ presentation: SavedPresentation; photos: UploadedPhoto[] } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();
  // eslint-disable-next-line react-hooks/purity -- „X წუთის წინ“ is relative to the render
  const now = Date.now();

  // Leaving the page doesn't cancel a delete the user didn't undo.
  useEffect(() => {
    const pending = pendingDeletes.current;
    return () => {
      for (const [id, timer] of pending) {
        window.clearTimeout(timer);
        void deletePresentation(id);
      }
    };
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return presentations.filter((p) => !hidden.has(p.id) && (!needle || p.title.toLowerCase().includes(needle)));
  }, [presentations, hidden, query]);

  const recentDraft = useMemo(
    () => presentations.find((p) => !hidden.has(p.id) && p.status === "draft" && now - p.updatedAt < RECENT_DRAFT_MS),
    [presentations, hidden, now],
  );

  const remove = (presentation: SavedPresentation) => {
    setConfirmDelete(null);
    setHidden((current) => new Set(current).add(presentation.id));
    const timer = window.setTimeout(() => {
      pendingDeletes.current.delete(presentation.id);
      void deletePresentation(presentation.id).then(onChanged);
    }, 5000);
    pendingDeletes.current.set(presentation.id, timer);
    toast.show({
      text: `„${presentation.title.slice(0, 40)}“ წაიშალა`,
      duration: 5000,
      action: {
        label: "გაუქმება",
        run: () => {
          window.clearTimeout(pendingDeletes.current.get(presentation.id));
          pendingDeletes.current.delete(presentation.id);
          setHidden((current) => {
            const next = new Set(current);
            next.delete(presentation.id);
            return next;
          });
        },
      },
    });
  };

  const duplicate = async (presentation: SavedPresentation) => {
    setBusy(presentation.id);
    try {
      if (presentations.length >= MAX_PRESENTATIONS) {
        toast.show({ text: `მაქსიმუმ ${MAX_PRESENTATIONS} პრეზენტაცია — ჯერ ძველი წაშალე`, tone: "error" });
        return;
      }
      await duplicatePresentation(presentation.id);
      onChanged();
      toast.show({ text: "დუბლირდა" });
    } finally {
      setBusy(null);
    }
  };

  const rename = async (presentation: SavedPresentation, title: string) => {
    setRenaming(null);
    const clean = title.trim();
    if (!clean || clean === presentation.title) return;
    await renamePresentation(presentation.id, clean);
    onChanged();
  };

  const runExport = async (presentation: SavedPresentation, kind: "pptx" | "pdf") => {
    if (!presentation.slides?.length) return;
    setBusy(presentation.id);
    try {
      const loaded = await loadPresentation(presentation.id);
      if (!loaded?.presentation.slides) return;
      if (kind === "pptx") {
        await exportToPptx(loaded.presentation.slides, loaded.presentation.templateId, loaded.presentation.title, loaded.photos);
      } else {
        // The PDF is a capture of the slides, so render them off-screen first.
        setExportJob(loaded);
        await nextPaint();
        await exportToPdf("presentation-list-export", loaded.presentation.title);
        setExportJob(null);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="space-y-4">
      {recentDraft ? (
        <button
          type="button"
          onClick={() => onOpen(recentDraft.id)}
          className="flex w-full items-center gap-3 rounded-2xl border border-pink-200 bg-pink-50/70 px-4 py-3 text-left transition hover:border-pink-300 dark:border-pink-400/20 dark:bg-pink-500/10"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-600 text-white dark:bg-pink-500">
            <ArrowRight className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-pink-800 dark:text-pink-200">გააგრძელე: {recentDraft.title}</span>
            <span className="block text-xs text-pink-700/80 dark:text-pink-300/80">მონახაზი · {relativeTimeKa(recentDraft.updatedAt, now)}</span>
          </span>
        </button>
      ) : null}

      <div className="dashboard-tool-card rounded-[28px] p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="headline mr-auto text-xl font-semibold text-slate-900 dark:text-zinc-100">ჩემი პრეზენტაციები</h2>
          <label className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ძებნა სათაურით"
              aria-label="ძებნა სათაურით"
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-100 dark:focus:ring-pink-500/10"
            />
          </label>
          <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center gap-1.5 rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-500 dark:bg-pink-500 dark:hover:bg-pink-400"
          >
            <Plus className="h-4 w-4" />
            ახალი პრეზენტაცია
          </button>
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-white/10">
            <FileText className="h-6 w-6 text-slate-400" />
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              {query ? "ასეთი სათაურით პრეზენტაცია ვერ მოიძებნა." : "აქ გამოჩნდება შენი პრეზენტაციები. ყველაფერი ავტომატურად ინახება."}
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((presentation) => {
              const template = presentationTemplate(presentation.templateId);
              const ready = presentation.status === "generated" && Boolean(presentation.slides?.length);
              return (
                <li
                  key={presentation.id}
                  className="group relative rounded-2xl border border-slate-200 bg-white p-2.5 transition hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-lg dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:border-pink-400/30"
                >
                  <button
                    type="button"
                    onClick={() => onOpen(presentation.id)}
                    className="block w-full text-left"
                    aria-label={`გახსნა: ${presentation.title}`}
                  >
                    <div className="pointer-events-none">
                      <SlideCard slide={coverOf(presentation)} index={-1} template={template} photos={NO_PHOTOS} />
                    </div>
                  </button>
                  <div className="mt-2.5 flex items-start gap-2 px-1">
                    <div className="min-w-0 flex-1">
                      {renaming === presentation.id ? (
                        <input
                          autoFocus
                          defaultValue={presentation.title}
                          aria-label="ახალი სახელი"
                          onBlur={(event) => void rename(presentation, event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") event.currentTarget.blur();
                            if (event.key === "Escape") setRenaming(null);
                          }}
                          className="w-full rounded-lg border border-pink-300 bg-white px-2 py-1 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-pink-400/40 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpen(presentation.id)}
                          className="block w-full truncate text-left text-sm font-semibold text-slate-900 hover:text-pink-700 dark:text-zinc-100 dark:hover:text-pink-300"
                        >
                          {presentation.title}
                        </button>
                      )}
                      <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500 dark:text-zinc-500">
                        <span
                          className={`rounded-full px-1.5 py-0.5 font-semibold ${
                            ready
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                          }`}
                        >
                          {ready ? "მზადაა" : "მონახაზი"}
                        </span>
                        <span>{presentation.form.level}</span>
                        {ready ? <span>· {presentation.slides?.length} სლაიდი</span> : null}
                        <span>· {relativeTimeKa(presentation.updatedAt, now)}</span>
                      </p>
                    </div>
                    {busy === presentation.id ? (
                      <Loader2 className="mt-1 h-4 w-4 shrink-0 animate-spin text-slate-400" />
                    ) : (
                      <Menu
                        panelClassName="w-52"
                        trigger={({ toggle, open }) => (
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDelete(null);
                              toggle();
                            }}
                            aria-expanded={open}
                            aria-label={`${presentation.title}: მენიუ`}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        )}
                      >
                        {(close) =>
                          confirmDelete === presentation.id ? (
                            <div className="p-2">
                              <p className="mb-2 text-sm font-medium text-slate-700 dark:text-zinc-200">წავშალო პრეზენტაცია?</p>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    close();
                                    remove(presentation);
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
                                  არა
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <MenuItem icon={<ExternalLink className="h-4 w-4" />} onClick={() => onOpen(presentation.id)}>
                                გახსნა
                              </MenuItem>
                              <MenuItem
                                icon={<Pencil className="h-4 w-4" />}
                                onClick={() => {
                                  close();
                                  setRenaming(presentation.id);
                                }}
                              >
                                სახელის შეცვლა
                              </MenuItem>
                              <MenuItem
                                icon={<Copy className="h-4 w-4" />}
                                onClick={() => {
                                  close();
                                  void duplicate(presentation);
                                }}
                              >
                                დუბლირება
                              </MenuItem>
                              <MenuItem
                                icon={<Download className="h-4 w-4" />}
                                disabled={!ready}
                                onClick={() => {
                                  close();
                                  void runExport(presentation, "pptx");
                                }}
                              >
                                PPTX გადმოწერა
                              </MenuItem>
                              <MenuItem
                                icon={<Download className="h-4 w-4" />}
                                disabled={!ready}
                                onClick={() => {
                                  close();
                                  void runExport(presentation, "pdf");
                                }}
                              >
                                PDF გადმოწერა
                              </MenuItem>
                              <div className="my-1 h-px bg-slate-100 dark:bg-white/10" />
                              <MenuItem icon={<Trash2 className="h-4 w-4" />} danger onClick={() => setConfirmDelete(presentation.id)}>
                                წაშლა
                              </MenuItem>
                            </>
                          )
                        }
                      </Menu>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 text-center text-xs text-slate-500 dark:text-zinc-500">
          პრეზენტაციები ინახება ამ მოწყობილობაზე · მაქსიმუმ {MAX_PRESENTATIONS}
        </p>
      </div>

      {exportJob ? (
        <div id="presentation-list-export" aria-hidden className="pointer-events-none fixed left-[-12000px] top-0 grid w-[960px] gap-4">
          {exportJob.presentation.slides?.map((slide, index) => (
            <SlideCard
              key={slide.id}
              slide={slide}
              index={index}
              template={presentationTemplate(exportJob.presentation.templateId)}
              photos={new Map(exportJob.photos.map((photo) => [photo.id, photo]))}
            />
          ))}
        </div>
      ) : null}
      {toast.element}
    </section>
  );
}
