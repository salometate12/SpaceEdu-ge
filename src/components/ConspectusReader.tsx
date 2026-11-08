"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  ChevronDown,
  Copy,
  Download,
  FileText,
  FileType,
  Hash,
  Layers,
  MoreHorizontal,
  Pencil,
  Presentation,
  Printer,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { Toast } from "@/components/ui/Toast";
import { SkippedFilesChip } from "@/components/conspectus/NoTextNotice";
import { ConspectusDocument } from "@/components/conspectus/ConspectusDocument";
import { AskInput, AskThread, useConspectusAsk, type ConspectusAskState } from "@/components/conspectus/ConspectusAsk";
import { useDismiss } from "@/hooks/useDismiss";
import { useKeyboardInset } from "@/hooks/useKeyboardInset";
import { deleteConspectus, renameConspectus, type Conspectus } from "@/lib/conspectus-storage";
import {
  documentContents,
  documentItems,
  longDate,
  readingMinutes,
  safeFileName,
  sourceLine,
  type ContentsEntry,
} from "@/lib/conspectus-document";
import { conspectusBackHref, conspectusSubjectName, openConspectusTool, type ConspectusTool } from "@/lib/conspectus-tools";
import { setDockHidden, setMobileOverlay } from "@/lib/mobile-overlay";
import "@/components/conspectus/conspectus-page.css";

/** Where a heading counts as the one being read: just under the sticky header. */
const SPY_OFFSET = 140;

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The `##` heading being read: the last one above the offset (the first before any). */
function useActiveSection(contents: ContentsEntry[]): string | null {
  const [active, setActive] = useState<string | null>(contents[0]?.id ?? null);
  useEffect(() => {
    if (!contents.length) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = contents[0].id;
      for (const entry of contents) {
        const element = document.getElementById(entry.id);
        if (element && element.getBoundingClientRect().top <= SPY_OFFSET) current = entry.id;
      }
      // At the very end, the last section (it may be too short to reach the top).
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        const last = contents[contents.length - 1].id;
        const element = document.getElementById(last);
        if (element && element.getBoundingClientRect().top < window.innerHeight) current = last;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [contents]);
  return active;
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* --- Download menu ------------------------------------------------------ */

function DownloadMenu({ round, onPdf, onDocx, onMarkdown }: { round: boolean; onPdf: () => void; onDocx: () => void; onMarkdown: () => void }) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useDismiss(open, () => setOpen(false), panel, trigger);
  const pick = (action: () => void) => () => {
    setOpen(false);
    action();
  };
  return (
    <div className="relative">
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="ჩამოტვირთვა"
        className={`${round ? "cs-round" : "cs-outline"} cs-focus`}
      >
        <Download className="h-4 w-4" aria-hidden />
        {round ? null : (
          <>
            ჩამოტვირთვა
            <ChevronDown className="h-3.5 w-3.5 text-[var(--cs-muted)]" aria-hidden />
          </>
        )}
      </button>
      {open ? (
        <div ref={panel} role="menu" className="cs-menu right-0 top-[calc(100%+8px)]">
          <button type="button" role="menuitem" onClick={pick(onPdf)} className="cs-menu-item">
            <FileText className="h-4 w-4 shrink-0 text-red-500" aria-hidden />
            <span>
              PDF
              <small>ბეჭდვის ფანჯარაში აირჩიე „PDF-ად შენახვა“</small>
            </span>
          </button>
          <button type="button" role="menuitem" onClick={pick(onDocx)} className="cs-menu-item">
            <FileType className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
            <span>Word (.docx)</span>
          </button>
          <button type="button" role="menuitem" onClick={pick(onMarkdown)} className="cs-menu-item">
            <Hash className="h-4 w-4 shrink-0 text-[var(--cs-muted)]" aria-hidden />
            <span>Markdown (.md)</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** The phone's „⋯“: print, rename, delete. */
function MoreMenu({ onPrint, onRename, onDelete }: { onPrint: () => void; onRename: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useDismiss(open, () => setOpen(false), panel, trigger);
  const pick = (action: () => void) => () => {
    setOpen(false);
    action();
  };
  return (
    <div className="relative">
      <button ref={trigger} type="button" onClick={() => setOpen((value) => !value)} aria-haspopup="menu" aria-expanded={open} aria-label="სხვა მოქმედებები" className="cs-round cs-focus">
        <MoreHorizontal className="h-5 w-5" aria-hidden />
      </button>
      {open ? (
        <div ref={panel} role="menu" className="cs-menu right-0 top-[calc(100%+8px)] min-w-[200px]">
          <button type="button" role="menuitem" onClick={pick(onPrint)} className="cs-menu-item">
            <Printer className="h-4 w-4 shrink-0" aria-hidden />
            ბეჭდვა
          </button>
          <button type="button" role="menuitem" onClick={pick(onRename)} className="cs-menu-item">
            <Pencil className="h-4 w-4 shrink-0" aria-hidden />
            გადარქმევა
          </button>
          <button type="button" role="menuitem" onClick={pick(onDelete)} className="cs-menu-item !text-red-600 dark:!text-red-400">
            <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
            წაშლა
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* --- Rename and delete -------------------------------------------------- */

function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="დახურვა" onClick={onClose} className="absolute inset-0 bg-black/45" />
      <div className="cs-card relative w-full max-w-sm p-6 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.45)]">
        <h2 className="text-[18px] font-bold text-[var(--cs-title)]">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function RenameDialog({ title, onSave, onClose }: { title: string; onSave: (title: string) => void; onClose: () => void }) {
  const [value, setValue] = useState(title);
  return (
    <Dialog title="გადარქმევა" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (value.trim()) onSave(value.trim());
        }}
      >
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoFocus
          maxLength={120}
          aria-label="კონსპექტის სახელი"
          className="mt-4 h-12 w-full rounded-2xl border border-[var(--cs-field-border)] bg-[var(--cs-card)] px-4 text-[15px] text-[var(--cs-title)] outline-none focus:border-pink-400"
        />
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="cs-outline cs-focus">
            გაუქმება
          </button>
          <button type="submit" disabled={!value.trim()} className="cs-focus inline-flex h-[42px] items-center rounded-full bg-[#e11d74] px-5 text-[14px] font-semibold text-white disabled:opacity-50">
            შენახვა
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function DeleteDialog({ onDelete, onClose }: { onDelete: () => void; onClose: () => void }) {
  return (
    <Dialog title="წავშალო კონსპექტი?" onClose={onClose}>
      <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--cs-muted)]">ის „ჩემი მასალებიდან“ და ყველა მოწყობილობიდან წაიშლება.</p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="cs-outline cs-focus" autoFocus>
          გაუქმება
        </button>
        <button type="button" onClick={onDelete} className="cs-focus inline-flex h-[42px] items-center rounded-full bg-red-600 px-5 text-[14px] font-semibold text-white">
          წაშლა
        </button>
      </div>
    </Dialog>
  );
}

/* --- Side column -------------------------------------------------------- */

const TOOLS: { tool: ConspectusTool; label: string; className: string; Icon: typeof Brain }[] = [
  { tool: "quiz", label: "ქვიზი", className: "cs-tool-quiz", Icon: Brain },
  { tool: "cards", label: "ფლეშბარათები", className: "cs-tool-cards", Icon: Layers },
  { tool: "presentation", label: "პრეზენტაცია", className: "cs-tool-deck", Icon: Presentation },
];

function ContentsList({ contents, active, onPick }: { contents: ContentsEntry[]; active: string | null; onPick: (id: string) => void }) {
  return (
    <ol className="space-y-0.5">
      {contents.map((entry) => (
        <li key={entry.id}>
          <button type="button" onClick={() => onPick(entry.id)} aria-current={active === entry.id ? "true" : undefined} className="cs-toc-link cs-focus">
            {entry.text}
          </button>
        </li>
      ))}
    </ol>
  );
}

function SideColumn({ contents, active, onTool, ask }: { contents: ContentsEntry[]; active: string | null; onTool: (tool: ConspectusTool) => void; ask: ConspectusAskState }) {
  const label = "text-[12px] font-semibold uppercase tracking-wider text-[var(--cs-muted)]";
  return (
    <aside className="scrollbar-thin sticky top-24 hidden max-h-[calc(100vh-112px)] space-y-4 overflow-y-auto pb-2 lg:block print:hidden">
      {contents.length ? (
        <nav className="cs-card p-4" aria-label="შინაარსი">
          <h2 className={`${label} mb-2 px-3`}>შინაარსი</h2>
          <ContentsList contents={contents} active={active} onPick={scrollToSection} />
        </nav>
      ) : null}
      <section className="cs-card p-4">
        <h2 className={`${label} mb-3 px-1`}>ამ კონსპექტიდან</h2>
        <div className="space-y-2">
          {TOOLS.map(({ tool, label: name, className, Icon }) => (
            <button key={tool} type="button" onClick={() => onTool(tool)} className={`cs-tool cs-focus ${className}`}>
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              {name}
            </button>
          ))}
        </div>
      </section>
      <section className="cs-card p-4">
        <h2 className="mb-3 flex items-center gap-2 px-1 text-[15px] font-bold text-[var(--cs-title)]">
          <Sparkles className="h-4 w-4 text-[#e11d74]" aria-hidden />
          ჰკითხე კონსპექტს
        </h2>
        <AskInput ask={ask} />
        <div data-ask-scroll className="scrollbar-thin mt-3 max-h-[320px] overflow-y-auto px-1">
          <AskThread ask={ask} empty="პასუხი ამ კონსპექტის ტექსტიდან იქნება." />
        </div>
      </section>
    </aside>
  );
}

/* --- Phone: contents, bottom bar, ask sheet ------------------------------ */

function MobileContents({ contents, active }: { contents: ContentsEntry[]; active: string | null }) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useDismiss(open, () => setOpen(false), panel, trigger);
  if (!contents.length) return null;
  const current = contents.find((entry) => entry.id === active) ?? contents[0];
  return (
    <div className="sticky top-[calc(env(safe-area-inset-top)+8px)] z-30 mt-4 md:top-[calc(var(--site-header-h)+8px)] lg:hidden print:hidden">
      <button ref={trigger} type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="cs-bar cs-focus flex h-12 w-full items-center gap-2 rounded-full px-4 text-left">
        <span className="shrink-0 text-[12.5px] font-semibold text-[var(--cs-muted)]">შინაარსი</span>
        <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--cs-muted)]" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[var(--cs-title)]">{current.text}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--cs-muted)] transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open ? (
        <div ref={panel} className="cs-menu left-0 right-0 top-[calc(100%+8px)] max-h-[60vh] overflow-y-auto">
          <ContentsList
            contents={contents}
            active={active}
            onPick={(id) => {
              setOpen(false);
              scrollToSection(id);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function MobileBar({ onTool, onAsk }: { onTool: (tool: ConspectusTool) => void; onAsk: () => void }) {
  // The bar takes the bottom edge: the dock steps aside while the page is open.
  useEffect(() => {
    setDockHidden("conspectus-page", true);
    return () => setDockHidden("conspectus-page", false);
  }, []);
  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-40 mx-auto max-w-[560px] lg:hidden print:hidden">
      <div className="cs-bar flex items-center gap-1 rounded-full p-1.5">
        <button type="button" onClick={() => onTool("quiz")} className="cs-tool cs-tool-quiz cs-focus h-11 min-w-0 flex-1 justify-center !gap-1.5 whitespace-nowrap !rounded-full !px-2 !text-[13.5px]">
          <Brain className="h-4 w-4 shrink-0" aria-hidden />
          ქვიზი
        </button>
        <button type="button" onClick={() => onTool("cards")} className="cs-tool cs-tool-cards cs-focus h-11 min-w-0 flex-1 justify-center !gap-1.5 whitespace-nowrap !rounded-full !px-2 !text-[13.5px]">
          <Layers className="h-4 w-4 shrink-0" aria-hidden />
          ბარათები
        </button>
        <button type="button" onClick={onAsk} className="cs-focus inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[#e11d74] px-2 text-[13.5px] font-semibold text-white">
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
          ჰკითხე
        </button>
      </div>
    </div>
  );
}

function AskSheet({ ask, onClose }: { ask: ConspectusAskState; onClose: () => void }) {
  const keyboard = useKeyboardInset();
  useEffect(() => {
    setMobileOverlay("conspectus-ask", true);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      setMobileOverlay("conspectus-ask", false);
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-labelledby="cs-ask-title">
      <button type="button" aria-label="დახურვა" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="cs-sheet absolute inset-x-0 flex flex-col" style={{ bottom: keyboard, maxHeight: `calc(100dvh - ${keyboard}px - 40px)` }}>
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-[var(--cs-border)]" aria-hidden />
        <div className="flex items-center gap-3 px-4 pb-2 pt-2">
          <h2 id="cs-ask-title" className="flex flex-1 items-center gap-2 text-[16px] font-bold text-[var(--cs-title)]">
            <Sparkles className="h-4 w-4 text-[#e11d74]" aria-hidden />
            ჰკითხე კონსპექტს
          </h2>
          <button type="button" onClick={onClose} aria-label="დახურვა" className="cs-round cs-focus !h-9 !w-9">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div data-ask-scroll className="min-h-[9rem] flex-1 overflow-y-auto border-t border-[var(--cs-border)] px-4 py-4">
          <AskThread ask={ask} empty="ჰკითხე ნებისმიერი რამ ამ კონსპექტზე: პასუხი მისი ტექსტიდან იქნება." />
        </div>
        <div className="border-t border-[var(--cs-border)] px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3" style={keyboard ? { paddingBottom: 12 } : undefined}>
          <AskInput ask={ask} autoFocus />
        </div>
      </div>
    </div>
  );
}

/* --- The page ----------------------------------------------------------- */

export function ConspectusReader({ conspectus }: { conspectus: Conspectus }) {
  const router = useRouter();
  const items = useMemo(() => documentItems(conspectus.content), [conspectus.content]);
  const contents = useMemo(() => documentContents(items), [items]);
  const active = useActiveSection(contents);
  const [subjectName, setSubjectName] = useState<string | null>(null);
  useEffect(() => {
    void Promise.resolve().then(() => setSubjectName(conspectusSubjectName(conspectus)));
  }, [conspectus]);
  const ask = useConspectusAsk(conspectus, subjectName);
  const [toast, setToast] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"rename" | "delete" | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeToast = useCallback(() => setToast(null), []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const closeDialog = useCallback(() => setDialog(null), []);

  const minutes = readingMinutes(conspectus.content);
  const source = sourceLine(conspectus.sourceLabel);
  const meta = [source, subjectName, longDate(conspectus.createdAt), `${minutes} წთ საკითხავი`].filter((part): part is string => Boolean(part));
  const fileName = safeFileName(conspectus.title);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(conspectus.content);
      setToast("დაკოპირდა");
    } catch {
      setToast("კოპირება ვერ მოხერხდა");
    }
  };
  const print = () => window.print();
  const downloadMarkdown = () => saveBlob(new Blob([conspectus.content], { type: "text/markdown;charset=utf-8" }), `${fileName}.md`);
  const downloadDocx = async () => {
    try {
      const { conspectusDocx } = await import("@/lib/conspectus-docx");
      saveBlob(await conspectusDocx(conspectus.title, ["კონსპექტი", ...meta].join(" · "), conspectus.content), `${fileName}.docx`);
    } catch {
      setToast("Word ფაილი ვერ შეიქმნა");
    }
  };
  const openTool = (tool: ConspectusTool) => router.push(openConspectusTool(tool, conspectus));

  return (
    <div className="cs mx-auto w-full max-w-[1240px] px-4 pb-[calc(env(safe-area-inset-bottom)+104px)] pt-4 sm:px-6 md:pt-6 lg:px-8 lg:pb-16 print:max-w-none print:p-0">
      {/* Back, the title with its meta line, and the document's actions. */}
      <div className="flex flex-wrap items-center gap-3 md:flex-nowrap md:items-start md:gap-4">
        <div className="print:hidden">
          <BackButton fallbackHref={conspectusBackHref(conspectus)} size="lg" />
        </div>
        <div className="order-last min-w-0 basis-full md:order-none md:flex-1 md:basis-auto md:pt-0.5">
          <h1 className="text-[23px] font-bold leading-tight tracking-tight text-[var(--cs-title)] md:text-[28px] print:text-[22pt]">{conspectus.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-[var(--cs-muted)] md:text-[13.5px]">
            <span className="rounded-full bg-[var(--cs-chip-bg)] px-2.5 py-0.5 text-[12px] font-semibold text-[var(--cs-chip)]">კონსპექტი</span>
            {meta.map((part, index) => (
              <span key={index} className="inline-flex items-center gap-2">
                {index > 0 ? <span className="h-1 w-1 rounded-full bg-current opacity-60" aria-hidden /> : null}
                {part}
              </span>
            ))}
          </p>
        </div>
        <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex print:hidden">
          <button type="button" onClick={copy} className="cs-outline cs-focus">
            <Copy className="h-4 w-4" aria-hidden />
            კოპირება
          </button>
          <DownloadMenu round={false} onPdf={print} onDocx={downloadDocx} onMarkdown={downloadMarkdown} />
          <button type="button" onClick={print} className="cs-outline cs-focus">
            <Printer className="h-4 w-4" aria-hidden />
            ბეჭდვა
          </button>
        </div>
        <div className="ml-auto flex items-center gap-2 md:hidden print:hidden">
          <button type="button" onClick={copy} aria-label="კოპირება" className="cs-round cs-focus">
            <Copy className="h-[18px] w-[18px]" aria-hidden />
          </button>
          <DownloadMenu round onPdf={print} onDocx={downloadDocx} onMarkdown={downloadMarkdown} />
          <MoreMenu onPrint={print} onRename={() => setDialog("rename")} onDelete={() => setDialog("delete")} />
        </div>
      </div>

      {conspectus.skippedFiles?.length ? (
        <div className="mt-4 print:hidden">
          <SkippedFilesChip files={conspectus.skippedFiles} bare />
        </div>
      ) : null}

      <MobileContents contents={contents} active={active} />

      <div className="mt-4 md:mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-8">
        <article className="cs-card cs-doc-card !rounded-[24px] px-5 py-7 sm:px-10 sm:py-10 md:!rounded-[28px] lg:px-14 lg:py-11">
          <ConspectusDocument items={items} />
        </article>
        <SideColumn contents={contents} active={active} onTool={openTool} ask={ask} />
      </div>

      <MobileBar onTool={openTool} onAsk={() => setSheetOpen(true)} />
      {sheetOpen ? <AskSheet ask={ask} onClose={closeSheet} /> : null}

      {dialog === "rename" ? (
        <RenameDialog
          title={conspectus.title}
          onClose={closeDialog}
          onSave={(title) => {
            renameConspectus(conspectus.id, title);
            setDialog(null);
            setToast("სახელი შეიცვალა");
          }}
        />
      ) : null}
      {dialog === "delete" ? (
        <DeleteDialog
          onClose={closeDialog}
          onDelete={() => {
            deleteConspectus(conspectus.id);
            router.replace(conspectusBackHref(conspectus));
          }}
        />
      ) : null}

      {toast ? <Toast message={toast} onClose={closeToast} duration={2400} /> : null}
    </div>
  );
}
