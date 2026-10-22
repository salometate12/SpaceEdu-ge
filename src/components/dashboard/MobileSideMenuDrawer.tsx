"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogOut, MessageSquareText, Moon, Search, Sun, X } from "lucide-react";
import { useWorkingSpace } from "@/hooks/useWorkingSpace";
import { useTheme } from "@/components/ThemeProvider";
import { signOutUser } from "@/lib/auth";
import { useAIChatPanel } from "@/contexts/AIChatPanelContext";
import { useMobileSideMenu } from "@/contexts/MobileSideMenuContext";
import { aiTeacherHrefForSpace, spaceFromPathname } from "@/lib/access-control";
import { setMobileOverlay } from "@/lib/mobile-overlay";
import { buildToolTiles, filterTools, softHyphenate, type ToolTile } from "@/lib/mobile-tools";
import { buildRailGroups } from "./DashboardSideRail";

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

function Tile({ tile, onPick }: { tile: ToolTile; onPick: () => void }) {
  const Icon = tile.icon;
  const className = `flex min-h-[96px] flex-col items-start justify-between gap-2 rounded-[18px] p-3 text-left transition-[transform,background-color] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
    tile.active
      ? // The current page: the neo-brutalist pink mark.
        "border-2 border-[#e11d74] bg-[#16161f] shadow-[3px_3px_0_0_#e11d74]"
      : "border border-white/[0.08] bg-[#16161f] active:bg-[#1e1e2a]"
  }`;
  const content = (
    <>
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ background: `color-mix(in srgb, ${tile.color} 15%, transparent)`, color: tile.color }}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      </span>
      {/* Long Georgian words break at a syllable, with a hyphen, inside the tile. */}
      <span className="line-clamp-2 text-[13.5px] font-semibold leading-[1.3] text-white [overflow-wrap:anywhere]">
        {softHyphenate(tile.label)}
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
 * black sheet rising from the bottom with a search field and one grid of
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
      // Solid black in both themes: nothing of the page shows through.
      className="flex h-full flex-col overflow-y-auto overscroll-contain bg-[#0b0b0f] px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))] text-white"
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
        <h2 className="text-[25px] font-bold leading-tight">ხელსაწყოები</h2>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="მენიუს დახურვა"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08] text-white/80 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#a1a1aa]" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="მოძებნე ხელსაწყო…"
          aria-label="მოძებნე ხელსაწყო"
          enterKeyHint="search"
          // 16px: iOS zooms into smaller fields.
          className="h-12 w-full rounded-full border border-white/[0.08] bg-white/[0.06] pl-11 pr-11 text-[16px] font-medium text-white outline-none placeholder:text-[#a1a1aa] focus:border-white/25 [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="ძებნის გასუფთავება"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#a1a1aa] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {shown.length > 0 ? (
        <div className="mt-4 grid grid-cols-3 gap-[10px]">
          {shown.map((tile) => (
            <Tile key={tile.id} tile={tile} onPick={onClose} />
          ))}
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <p className="text-[15px] font-medium text-white/70">ვერაფერი მოიძებნა</p>
          <button
            type="button"
            onClick={askTeacher}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white/[0.08] px-5 text-[14px] font-semibold text-white transition hover:bg-white/[0.12]"
          >
            <MessageSquareText className="h-4 w-4" aria-hidden />
            AI მასწავლებელს ჰკითხე
          </button>
        </div>
      )}

      <div className="mt-auto space-y-3 pt-6">
        <div
          className="flex items-center justify-between rounded-[18px] border border-white/[0.08] bg-[#16161f] px-4 py-3"
          role="group"
          aria-label="თემა"
        >
          <span className="text-[14px] font-semibold text-white/80">თემა</span>
          <div className="flex rounded-full bg-white/[0.06] p-0.5">
            {(["light", "dark"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTheme(option)}
                aria-pressed={theme === option}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  theme === option ? "bg-white text-[#0b0b0f]" : "text-white/60 hover:text-white"
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
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-[rgba(251,113,133,0.45)] text-[15px] font-semibold text-[#fb7185] transition hover:bg-rose-500/10 disabled:opacity-50"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.9} />
          {signingOut ? "გასვლა..." : "გასვლა"}
        </button>
      </div>
    </div>
  );
}
