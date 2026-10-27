"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogOut, MessageSquareText, Moon, Search, Sun, X } from "lucide-react";
import { useWorkingSpace } from "@/hooks/useWorkingSpace";
import { useTheme } from "@/components/ThemeProvider";
import { signOutUser } from "@/lib/auth";
import { useAIChatPanel } from "@/contexts/AIChatPanelContext";
import { useMobileSideMenu } from "@/contexts/MobileSideMenuContext";
import { aiTeacherHrefForSpace, spaceFromPathname } from "@/lib/access-control";
import { setMobileOverlay } from "@/lib/mobile-overlay";
import { buildToolTiles, filterTools, type ToolTile } from "@/lib/mobile-tools";
import { buildRailGroups } from "./DashboardSideRail";
import "./tools-menu.css";

const EASE = [0.22, 1, 0.36, 1] as const;
/** Dragged this far down from the top of the menu, it closes. */
const CLOSE_DISTANCE = 80;

const FOCUSABLE = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

/** Keeps Tab inside the menu. */
function trapFocus(event: ReactKeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab") return;
  const items = [...event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length);
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/** The dock's „ხელსაწყოები“ button, where focus goes back on close. */
const dockToolsButton = () =>
  document.querySelector<HTMLElement>("nav[aria-label='მობილური ნავიგაცია'] button[aria-label='ხელსაწყოები']");

const LABEL_SIZE = 14;
const MIN_LABEL_SIZE = 12;

/**
 * A tile's name is never broken inside a word, so on a narrow phone a long
 * one („მასწავლებელი“) can be wider than the tile. This steps its size down
 * (to 12px at most) until the longest word fits.
 */
function useFittedLabel(text: string) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const fit = () => {
      let size = LABEL_SIZE;
      element.style.fontSize = "";
      while (element.scrollWidth > element.clientWidth + 0.5 && size > MIN_LABEL_SIZE) {
        size -= 0.5;
        element.style.fontSize = `${size}px`;
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    if (element.parentElement) observer.observe(element.parentElement);
    return () => observer.disconnect();
  }, [text]);
  return ref;
}

function Tile({ tile, onPick }: { tile: ToolTile; onPick: () => void }) {
  const Icon = tile.icon;
  const labelRef = useFittedLabel(tile.label);
  // Below 400px the icon and spacing are a little tighter, for the words' sake.
  const className = `tm-focus flex h-[58px] min-w-0 items-center gap-2 rounded-[16px] bg-[var(--tm-surface)] px-2 text-left min-[400px]:gap-2.5 min-[400px]:px-2.5 transition-transform duration-150 active:scale-[0.97] ${
    tile.active
      ? // The current page: a pink outline.
        "border-2 border-[#e11d74]"
      : "border border-[var(--tm-border)]"
  }`;
  const content = (
    <>
      <span
        className="tm-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] min-[400px]:h-9 min-[400px]:w-9 min-[400px]:rounded-[11px]"
        style={{ "--tile": tile.color } as CSSProperties}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      </span>
      {/* Whole words: two lines at most, never broken inside a word. */}
      <span ref={labelRef} className="tm-label line-clamp-2 min-w-0 flex-1 text-[14px] font-semibold leading-[1.25] text-[var(--tm-title)]">
        {tile.label}
      </span>
    </>
  );
  if (tile.onClick) {
    return (
      <button
        type="button"
        onClick={() => {
          tile.onClick?.();
          onPick();
        }}
        aria-current={tile.active ? "page" : undefined}
        className={className}
      >
        {content}
      </button>
    );
  }
  return (
    <Link href={tile.href ?? "#"} onClick={onPick} aria-current={tile.active ? "page" : undefined} className={className}>
      {content}
    </Link>
  );
}

/**
 * The phone's tools menu (opened from the dock's „ხელსაწყოები“): a full
 * sheet (light or dark with the theme) rising from the bottom with a search field and one grid of
 * tiles — the current space's tools, without the dock's dashboard and
 * profile. Closes with ✕, Esc, a pick, or a swipe down from the top.
 * The desktop rail (DashboardSideRail) is separate and unchanged.
 */
export function MobileSideMenuDrawer() {
  const { isOpen, close } = useMobileSideMenu();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="tools-menu"
          className="fixed inset-0 z-[70] md:hidden"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: reduceMotion ? 0 : 0.28, ease: EASE }}
        >
          <ToolsSheet onClose={close} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ToolsSheet({ onClose }: { onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  const { isAdmin } = useWorkingSpace();
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen: aiChatOpen, toggle: toggleAiChat } = useAIChatPanel();
  const [query, setQuery] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [drag, setDrag] = useState(0);
  const dragStart = useRef<{ y: number; t: number } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const space = spaceFromPathname(pathname ?? "") ?? undefined;

  // Open: the dock steps aside, the page stays put, Esc closes, focus starts
  // on ✕ (not the search field — no surprise keyboard) and goes back to the
  // dock's button on close.
  useEffect(() => {
    setMobileOverlay("tools-menu", true);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 30);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
      setMobileOverlay("tools-menu", false);
      dockToolsButton()?.focus({ preventScroll: true });
    };
  }, []);

  const tiles = buildToolTiles(
    buildRailGroups({
      space,
      pathname,
      onAiChat: toggleAiChat,
      aiChatOpen,
    }),
    { isAdmin },
  );
  const shown = filterTools(tiles, query);

  const askTeacher = () => {
    const prompt = query.trim();
    onClose();
    router.push(`${aiTeacherHrefForSpace(space ?? null)}?prompt=${encodeURIComponent(prompt)}`);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOutUser();
    } finally {
      window.localStorage.removeItem("spaceedu_space");
      window.localStorage.removeItem("spaceedu-active-space");
      onClose();
      router.push("/select-space");
      router.refresh();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ხელსაწყოები"
      onKeyDown={trapFocus}
      // Solid in both themes: nothing of the page shows through.
      className="tools-menu flex h-full flex-col overflow-y-auto overscroll-contain px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))]"
      style={drag ? { transform: `translateY(${drag}px)` } : undefined}
      onTouchStart={(event) => {
        // Only from the top: otherwise a swipe down is just scrolling.
        dragStart.current = event.currentTarget.scrollTop <= 0 ? { y: event.touches[0].clientY, t: event.timeStamp } : null;
      }}
      onTouchMove={(event) => {
        if (!dragStart.current) return;
        setDrag(Math.max(0, event.touches[0].clientY - dragStart.current.y));
      }}
      onTouchEnd={(event) => {
        const start = dragStart.current;
        dragStart.current = null;
        if (!start) return;
        const distance = Math.max(0, event.changedTouches[0].clientY - start.y);
        const fast = distance > 12 && distance / Math.max(1, event.timeStamp - start.t) > 0.5;
        setDrag(0);
        if (distance >= CLOSE_DISTANCE || fast) onClose();
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[26px] font-bold leading-tight text-[var(--tm-title)]">ხელსაწყოები</h2>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="მენიუს დახურვა"
          className="tm-focus flex h-11 w-11 items-center justify-center rounded-full border border-[var(--tm-control-border)] bg-[var(--tm-surface)] text-[var(--tm-icon)] transition-colors hover:text-[var(--tm-title)]"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--tm-placeholder)]" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="მოძებნე ხელსაწყო…"
          aria-label="მოძებნე ხელსაწყო"
          enterKeyHint="search"
          // 16px: iOS zooms into smaller fields.
          className="h-12 w-full rounded-full border border-[var(--tm-control-border)] bg-[var(--tm-surface)] pl-11 pr-11 text-[16px] font-medium text-[var(--tm-title)] outline-none placeholder:text-[var(--tm-placeholder)] focus:border-[#e11d74] [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="ძებნის გასუფთავება"
            className="tm-focus absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--tm-placeholder)] hover:text-[var(--tm-title)]"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {shown.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {shown.map((tile) => (
            <Tile key={tile.id} tile={tile} onPick={onClose} />
          ))}
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <p className="text-[15px] font-medium text-[var(--tm-label)]">ვერაფერი მოიძებნა</p>
          <button
            type="button"
            onClick={askTeacher}
            className="tm-focus inline-flex h-11 items-center gap-2 rounded-full border border-[var(--tm-control-border)] bg-[var(--tm-surface)] px-5 text-[14px] font-semibold text-[var(--tm-title)] transition-colors hover:border-[var(--tm-placeholder)]"
          >
            <MessageSquareText className="h-4 w-4" aria-hidden />
            AI მასწავლებელს ჰკითხე
          </button>
        </div>
      )}

      <div className="mt-auto space-y-3 pt-6">
        <div
          className="flex items-center justify-between rounded-[18px] border border-[var(--tm-border)] bg-[var(--tm-surface)] px-4 py-3"
          role="group"
          aria-label="თემა"
        >
          <span className="text-[14px] font-semibold text-[var(--tm-label)]">თემა</span>
          <div className="flex rounded-full bg-[var(--tm-switch)] p-0.5">
            {(["light", "dark"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTheme(option)}
                aria-pressed={theme === option}
                className={`tm-focus inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  theme === option
                    ? "bg-[var(--tm-switch-on)] text-[var(--tm-switch-on-text)] shadow-[var(--tm-switch-on-shadow)]"
                    : "text-[var(--tm-switch-off)] hover:text-[var(--tm-title)]"
                }`}
              >
                {option === "light" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                {option === "light" ? "ღია" : "მუქი"}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="tm-focus flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[var(--tm-out-border)] bg-[var(--tm-out-bg)] text-[15px] font-semibold text-[var(--tm-out-text)] transition-colors hover:bg-rose-500/10 disabled:opacity-50"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.9} />
          {signingOut ? "გასვლა..." : "გასვლა"}
        </button>
      </div>
    </div>
  );
}
