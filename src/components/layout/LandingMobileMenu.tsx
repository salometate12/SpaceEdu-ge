"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LANDING_MENU_LINKS, LANDING_MENU_SPACES, menuLinkAction, sheetClosesOnRelease } from "@/lib/landing-menu";
import { setMobileOverlay } from "@/lib/mobile-overlay";
import { nbButtonClass } from "@/lib/nb-button";

const EASE = [0.22, 1, 0.36, 1] as const;

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keeps Tab inside the sheet. */
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

/**
 * The landing's phone menu: a sheet rising from the bottom over a solid dark
 * ground (nothing of the page shows behind it). Spaces as three tiles, the
 * other links in one list, then „შესვლა“ and „დაიწყე უფასოდ“. Closes with
 * ✕, Esc, the ground, a link, or a swipe down. While open the page doesn't
 * scroll and the dock steps aside (lib/mobile-overlay).
 */
export function LandingMobileMenu({
  open,
  onClose,
  returnFocusTo,
}: {
  open: boolean;
  onClose: () => void;
  /** The header's menu button: focus goes back there on close. */
  returnFocusTo: RefObject<HTMLButtonElement | null>;
}) {
  const pathname = usePathname() ?? "/";
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [drag, setDrag] = useState(0);
  const dragStart = useRef<{ y: number; t: number } | null>(null);
  const dragged = useRef(false);

  // The latest onClose, without re-running the open/close effect for it.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    setMobileOverlay("landing-menu", open);
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 30);
    const returnTarget = returnFocusTo.current;
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
      setMobileOverlay("landing-menu", false);
      returnTarget?.focus({ preventScroll: true });
    };
  }, [open, returnFocusTo]);

  /** In-page links scroll once the menu has closed and the page is free. */
  const follow = (href: string) => (event: MouseEvent) => {
    if (dragged.current) {
      event.preventDefault();
      return;
    }
    const action = menuLinkAction(href, pathname);
    if (action.kind === "scroll") {
      event.preventDefault();
      onClose();
      window.setTimeout(() => {
        window.history.pushState(null, "", href);
        document.getElementById(action.id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }, 0);
    } else {
      onClose();
    }
  };

  const duration = reduceMotion ? 0 : 0.28;

  return (
    <AnimatePresence>
      {open ? (
        <>
          {/* A solid dark ground: the page's dots and hero don't show through. */}
          <motion.div
            key="ground"
            data-menu-backdrop
            aria-hidden
            onClick={onClose}
            className="fixed inset-0 touch-none bg-[#0b0b0f] nav:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          />
          <motion.div
            key="sheet"
            id="landing-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="მენიუ"
            onKeyDown={trapFocus}
            // Always dark, like the header bar; its own ink for the pill buttons.
            className="dark fixed inset-x-0 bottom-0 z-20 touch-none rounded-t-[28px] border-t border-white/[0.08] bg-[#16161f] px-5 pb-[max(28px,calc(env(safe-area-inset-bottom)+16px))] pt-2.5 text-white nav:hidden [--nb-ink:#f4f4f5] [--nb-shadow:#f4f4f5]"
            initial={{ y: "100%" }}
            animate={{ y: drag }}
            exit={{ y: "100%" }}
            // Follows the finger while dragged; animates in, out and back.
            transition={drag > 0 ? { duration: 0 } : { duration, ease: EASE }}
            onPointerDown={(event) => {
              dragStart.current = { y: event.clientY, t: event.timeStamp };
              dragged.current = false;
            }}
            onPointerMove={(event) => {
              if (!dragStart.current) return;
              const distance = Math.max(0, event.clientY - dragStart.current.y);
              if (distance > 6) dragged.current = true;
              setDrag(distance);
            }}
            onPointerUp={(event) => {
              const start = dragStart.current;
              dragStart.current = null;
              if (!start) return;
              const distance = Math.max(0, event.clientY - start.y);
              const velocity = distance / Math.max(1, event.timeStamp - start.t);
              setDrag(0);
              if (sheetClosesOnRelease(distance, velocity)) onClose();
            }}
            onPointerCancel={() => {
              dragStart.current = null;
              setDrag(0);
            }}
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-white/20" aria-hidden />
            <div className="mt-3 flex items-center justify-between">
              <h2 className="text-[18px] font-bold">მენიუ</h2>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="მენიუს დახურვა"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-white/80 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <X className="h-5 w-5" strokeWidth={1.9} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {LANDING_MENU_SPACES.map(({ href, label, icon: Icon, color }) => (
                <a
                  key={href}
                  href={href}
                  onClick={follow(href)}
                  className="flex flex-col items-start gap-2.5 rounded-[18px] border border-white/[0.08] bg-white/[0.05] px-3 py-3.5 transition-[transform,background-color] duration-150 active:scale-[0.97] active:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                  </span>
                  <span className="text-[14px] font-semibold leading-tight">{label}</span>
                </a>
              ))}
            </div>

            <div className="mt-3 overflow-hidden rounded-[18px] border border-white/[0.08] bg-white/[0.03]">
              {LANDING_MENU_LINKS.map(({ href, label }, index) => {
                const className = `flex min-h-[48px] items-center justify-between px-4 text-[15px] font-medium transition-colors active:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-none ${
                  index > 0 ? "border-t border-white/[0.08]" : ""
                }`;
                const content = (
                  <>
                    {label}
                    <ChevronRight className="h-[18px] w-[18px] text-[#71717a]" aria-hidden />
                  </>
                );
                return href.startsWith("/#") ? (
                  <a key={href} href={href} onClick={follow(href)} className={className}>
                    {content}
                  </a>
                ) : (
                  <Link key={href} href={href} onClick={follow(href)} className={className}>
                    {content}
                  </Link>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between px-1 py-1.5">
              <span className="text-[14px] font-medium text-white/70">თემა</span>
              <ThemeToggle showLabel className="!border-white/[0.12] !bg-white/[0.05] !text-white/80" />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link
                href="/login"
                onClick={follow("/login")}
                className="flex h-[50px] items-center justify-center rounded-full border-2 border-white/[0.22] text-[15px] font-semibold text-white transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                შესვლა
              </Link>
              <Link
                href="/select-space"
                onClick={follow("/select-space")}
                className={nbButtonClass({ variant: "primary", block: true })}
                style={{ height: 50, fontSize: 15, fontWeight: 700 }}
              >
                დაიწყე უფასოდ
              </Link>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
