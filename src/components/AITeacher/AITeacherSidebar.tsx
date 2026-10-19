"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  ArrowLeft,
  Check,
  MessageSquare,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  SquarePen,
  Trash2,
  X,
} from "lucide-react";
import {
  groupConversationsByDate,
  type AiTeacherConversation,
} from "@/lib/ai-teacher-history";

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const mod = () => (isMac() ? "⌘" : "Ctrl");

interface AITeacherSidebarProps {
  title: string;
  subtitle: string;
  conversations: AiTeacherConversation[];
  activeId: string | null;
  /** Desktop only: the 56px icon strip. */
  collapsed?: boolean;
  /** "drawer" = the mobile slide-in version (no collapse, has ✕). */
  variant: "desktop" | "drawer";
  onToggleCollapse?: () => void;
  onClose?: () => void;
  onBack: () => void;
  onNewChat: () => void;
  onOpen: (conversation: AiTeacherConversation) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

const iconButton =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]";

/** One conversation row: title, and on hover a „…“ menu to rename or
 * delete (with an inline confirmation instead of `confirm()`). */
function ConversationRow({
  conversation,
  active,
  onOpen,
  onRename,
  onDelete,
}: {
  conversation: AiTeacherConversation;
  active: boolean;
  onOpen: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const [mode, setMode] = useState<"view" | "rename" | "confirm">("view");
  const [draft, setDraft] = useState(conversation.title);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenu(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [menu]);

  if (mode === "rename") {
    const commit = () => {
      onRename(draft);
      setMode("view");
    };
    return (
      <div className="flex items-center gap-1 rounded-lg bg-[var(--bg-secondary)] px-1.5 py-1">
        <input
          autoFocus
          value={draft}
          maxLength={80}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
            if (event.key === "Escape") setMode("view");
          }}
          aria-label="საუბრის სახელი"
          className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40"
        />
        <button type="button" onClick={commit} aria-label="შენახვა" className={iconButton}>
          <Check className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (mode === "confirm") {
    return (
      <div className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs dark:bg-rose-500/10">
        <span className="min-w-0 flex-1 truncate text-rose-700 dark:text-rose-200">წავშალო?</span>
        <button
          type="button"
          autoFocus
          onClick={onDelete}
          className="rounded-md bg-rose-600 px-2 py-1 font-semibold text-white hover:bg-rose-500"
        >
          წაშლა
        </button>
        <button
          type="button"
          onClick={() => setMode("view")}
          className="rounded-md px-2 py-1 font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-card)]"
        >
          გაუქმება
        </button>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex items-center rounded-lg transition ${
        active ? "bg-[var(--bg-secondary)]" : "hover:bg-[var(--bg-secondary)]/70"
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-current={active ? "true" : undefined}
        title={conversation.title}
        className={`min-w-0 flex-1 truncate rounded-lg px-2.5 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
          active ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
        }`}
      >
        {conversation.title}
      </button>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenu((open) => !open)}
          aria-label={`მოქმედებები: ${conversation.title}`}
          aria-expanded={menu}
          aria-haspopup="menu"
          className={`mr-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] transition hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
            menu ? "opacity-100" : "opacity-0 group-hover:opacity-100 max-md:opacity-100"
          }`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menu ? (
          <div
            role="menu"
            className="absolute right-1 top-8 z-20 w-40 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-1 text-sm shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenu(false);
                setDraft(conversation.title);
                setMode("rename");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            >
              <Pencil className="h-3.5 w-3.5" /> სახელის შეცვლა
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenu(false);
                setMode("confirm");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> წაშლა
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The AI teacher's conversation sidebar: title row, „ახალი ჩატი“, and
 * conversations grouped by date. On desktop it collapses to an icon strip;
 * on a phone it is the content of the slide-in drawer.
 */
export function AITeacherSidebar({
  title,
  subtitle,
  conversations,
  activeId,
  collapsed = false,
  variant,
  onToggleCollapse,
  onClose,
  onBack,
  onNewChat,
  onOpen,
  onRename,
  onDelete,
}: AITeacherSidebarProps) {
  const groups = groupConversationsByDate(conversations);
  const narrow = variant === "desktop" && collapsed;
  // Text fades rather than being cut off mid-word while the width animates.
  const fade = `transition-opacity duration-200 ease-out motion-reduce:transition-none ${
    narrow ? "pointer-events-none opacity-0" : "opacity-100"
  }`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`flex items-center gap-1 px-2.5 pb-1 pt-3 ${narrow ? "flex-col" : ""}`}>
        {narrow ? (
          <button type="button" onClick={onToggleCollapse} aria-label="მენიუს გაშლა" aria-expanded={false} title={`გაშლა (${mod()}+B)`} className={iconButton}>
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        ) : null}
        <button type="button" onClick={onBack} aria-label="უკან" title="უკან" className={iconButton}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        {!narrow ? (
          <div className={`min-w-0 flex-1 px-1 ${fade}`}>
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{title}</p>
            <p className="truncate text-xs text-[var(--text-muted)]">{subtitle}</p>
          </div>
        ) : null}
        {variant === "desktop" && !narrow ? (
          <button type="button" onClick={onToggleCollapse} aria-label="მენიუს ჩაკეცვა" aria-expanded title={`ჩაკეცვა (${mod()}+B)`} className={iconButton}>
            <PanelLeftClose className="h-4 w-4" />
          </button>
        ) : null}
        {variant === "drawer" ? (
          <button type="button" onClick={onClose} aria-label="მენიუს დახურვა" className={iconButton}>
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="px-2.5 pt-2">
        {narrow ? (
          <button type="button" onClick={onNewChat} aria-label="ახალი ჩატი" title={`ახალი ჩატი (${mod()}+Shift+O)`} className={`${iconButton} mx-auto flex`}>
            <SquarePen className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onNewChat}
            title={`ახალი ჩატი (${mod()}+Shift+O)`}
            className="flex h-10 w-full items-center gap-2.5 rounded-xl border border-[var(--border)] px-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
          >
            <SquarePen className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
            <span className={`truncate ${fade}`}>ახალი ჩატი</span>
          </button>
        )}
      </div>

      <nav
        aria-label="საუბრები"
        className={`scrollbar-thin mt-3 min-h-0 flex-1 overflow-y-auto px-2.5 pb-4 ${fade}`}
        aria-hidden={narrow}
      >
        {groups.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-8 text-center text-xs text-[var(--text-muted)]">
            <MessageSquare className="h-5 w-5 opacity-60" />
            აქ გამოჩნდება შენი საუბრები
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.label} className="mb-3">
              <h3 className="px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                {group.label}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    active={conversation.id === activeId}
                    onOpen={() => onOpen(conversation)}
                    onRename={(name) => onRename(conversation.id, name)}
                    onDelete={() => onDelete(conversation.id)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </nav>
    </div>
  );
}

/** Keeps Tab inside the drawer while it's open. */
export function trapFocus(event: ReactKeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab") return;
  const focusable = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>("button, input, [href], [tabindex]:not([tabindex='-1'])"),
  ).filter((el) => !el.hasAttribute("disabled") && el.getClientRects().length > 0);
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
