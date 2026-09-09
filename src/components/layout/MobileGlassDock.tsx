"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useFocusMode } from "@/contexts/FocusModeContext";
import { useMobileSideMenu } from "@/contexts/MobileSideMenuContext";
import { useCurrentUserAccess } from "@/hooks/useCurrentUserAccess";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";
import { spaceFromPathname } from "@/lib/access-control";
import {
  DASHBOARD_MOBILE_MENU_HREF,
  isDockItemActive,
  mobileDockHidden,
  mobileDockItems,
  type MobileDockItem,
} from "@/lib/mobile-nav";

const SCROLL_DOWN_THRESHOLD = 8;
const SCROLL_UP_THRESHOLD = 4;
const MIN_SCROLL_Y = 48;

/** A plain icon slot, styled like a link in the header's nav. */
function DockIconLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors active:scale-90 ${
        active
          ? "bg-white/[0.14] text-white"
          : "text-white/65 hover:bg-white/[0.08] hover:text-white"
      }`}
    >
      <Icon className="h-[21px] w-[21px] stroke-[1.75]" />
    </Link>
  );
}

export function MobileGlassDock() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const { open: openMobileMenu } = useMobileSideMenu();
  const { space: accountSpace } = useCurrentUserAccess();
  const [localSpace, setLocalSpace] = useState<SpaceeduSpace | null>(null);

  useEffect(() => {
    const readSpace = () => {
      const saved = window.localStorage.getItem("spaceedu_space");
      if (saved === "school" || saved === "abiturient" || saved === "student") {
        setLocalSpace(saved);
      }
    };
    readSpace();
  }, []);

  // The current URL wins when it's space-specific, so an admin browsing
  // another space's page still gets nav links for the page they're on
  // rather than jumping back to their own registered space.
  const effectiveSpace = spaceFromPathname(pathname) ?? accountSpace ?? localSpace;
  const items = mobileDockItems(pathname, effectiveSpace);
  const hidden = mobileDockHidden(pathname) || items.length === 0;

  const handleScroll = useCallback(() => {
    const currentY = window.scrollY;
    const delta = currentY - lastScrollY.current;

    if (delta > SCROLL_DOWN_THRESHOLD && currentY > MIN_SCROLL_Y) {
      setVisible(false);
    } else if (delta < -SCROLL_UP_THRESHOLD) {
      setVisible(true);
    }

    lastScrollY.current = currentY;
    ticking.current = false;
  }, []);

  useEffect(() => {
    if (hidden) return;

    lastScrollY.current = window.scrollY;

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        window.requestAnimationFrame(handleScroll);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hidden, handleScroll]);

  useEffect(() => {
    const resetOnNav = () => {
      setVisible(true);
      lastScrollY.current = window.scrollY;
    };
    resetOnNav();
  }, [pathname]);

  if (hidden) return null;

  const bySlot = (slot: MobileDockItem["slot"]) =>
    items.find((item) => item.slot === slot);
  const first = bySlot("first");
  const second = bySlot("second");
  const primary = bySlot("primary");
  const accent = bySlot("accent");

  const activeFor = (item: MobileDockItem | undefined) =>
    item && pathname ? isDockItemActive(pathname, item) : false;

  const PrimaryIcon = primary?.icon;
  const AccentIcon = accent?.icon;
  const accentActive = activeFor(accent);

  // The primary slot is the drawer on app pages and an ordinary link on the
  // marketing ones; both wear the header's white call-to-action.
  const primaryClass =
    "mx-0.5 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0f0f14] shadow-[0_6px_18px_-6px_rgba(0,0,0,0.65)] transition-transform active:scale-90";

  return (
    <nav
      aria-label="მობილური ნავიგაცია"
      className={`fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden transition-[transform,opacity] duration-300 ease-out ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      {/* Same surface as the header pill — see `.header-pill` in globals.css.
          The bar is dark in both themes, so its children render their
          night-mode styling; hence the `dark` class. */}
      <div className="header-pill dark flex items-center gap-1 rounded-full border border-white/[0.08] px-2 py-2 shadow-[0_18px_44px_-14px_rgba(2,6,23,0.75)]">
        {first && (
          <DockIconLink
            href={first.href}
            label={first.label}
            icon={first.icon}
            active={activeFor(first)}
          />
        )}
        {second && (
          <DockIconLink
            href={second.href}
            label={second.label}
            icon={second.icon}
            active={activeFor(second)}
          />
        )}

        {primary &&
          PrimaryIcon &&
          (primary.href === DASHBOARD_MOBILE_MENU_HREF ? (
            <button
              type="button"
              onClick={openMobileMenu}
              aria-label={primary.label}
              className={primaryClass}
            >
              <PrimaryIcon className="h-[21px] w-[21px] stroke-[2]" />
            </button>
          ) : (
            <Link href={primary.href} aria-label={primary.label} className={primaryClass}>
              <PrimaryIcon className="h-[21px] w-[21px] stroke-[2]" />
            </Link>
          ))}

        <div className="flex h-11 w-11 items-center justify-center">
          <ThemeToggle className="!h-11 !w-11 !rounded-full !border-0 !bg-transparent !text-white/65 hover:!bg-white/[0.08] hover:!text-white" />
        </div>

        {accent && AccentIcon && (
          <Link
            href={accent.href}
            aria-label={accent.label}
            aria-current={accentActive ? "page" : undefined}
            className={`flex h-12 w-12 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#f5b8ec,#d946ef_55%,#a855f7)] text-white shadow-[0_8px_22px_-4px_rgba(217,70,239,0.65)] transition-transform active:scale-90 ${
              accentActive ? "ring-2 ring-white/80" : ""
            }`}
          >
            <AccentIcon className="h-[21px] w-[21px] stroke-[2]" />
          </Link>
        )}
      </div>
    </nav>
  );
}

export function MobileGlassDockByPath() {
  const { focusMode } = useFocusMode();
  return (
    <AnimatePresence initial={false}>
      {!focusMode && (
        <motion.div
          key="mobile-glass-dock"
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <MobileGlassDock />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
