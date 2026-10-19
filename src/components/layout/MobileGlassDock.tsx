"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAIChatPanel } from "@/contexts/AIChatPanelContext";
import { useFocusMode } from "@/contexts/FocusModeContext";
import { useCurrentUserAvatar, type UserAvatar } from "@/hooks/useCurrentUserAvatar";
import { useMobileSideMenu } from "@/contexts/MobileSideMenuContext";
import { useWorkingSpace } from "@/hooks/useWorkingSpace";
import {
  isDockItemActive,
  mobileDockHidden,
  mobileDockItems,
  type MobileDockItem,
} from "@/lib/mobile-nav";

const SCROLL_DOWN_THRESHOLD = 8;
const SCROLL_UP_THRESHOLD = 4;
const MIN_SCROLL_Y = 48;

const TAB_BASE =
  "group flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-2xl outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/40 motion-reduce:transition-none";

function TabContent({ item, active, avatar }: { item: MobileDockItem; active: boolean; avatar: UserAvatar }) {
  const Icon = item.icon;
  return (
    <>
      {item.avatar ? (
        <span
          className={`flex h-[23px] w-[23px] items-center justify-center overflow-hidden rounded-full bg-[#3f3f46] text-[11px] font-semibold text-white ring-1 ${
            active ? "ring-white" : "ring-transparent"
          }`}
          aria-hidden
        >
          {avatar.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- provider avatar, tiny
            <img src={avatar.photoUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : avatar.initial ? (
            avatar.initial
          ) : (
            <Icon className="h-[14px] w-[14px] stroke-[2]" />
          )}
        </span>
      ) : (
        <Icon className={`h-[21px] w-[21px] stroke-[1.8] ${active ? "text-white" : "text-[#a1a1aa]"}`} aria-hidden />
      )}
      <span
        // On the narrowest phones (360px) „ხელსაწყოები“ needs a hair less room.
        className={`whitespace-nowrap text-[10.5px] leading-none max-[379px]:text-[10px] max-[379px]:tracking-[-0.02em] ${active ? "font-semibold text-white" : "text-[#a1a1aa]"}`}
      >
        {item.label}
      </span>
      <span
        className={`h-1 w-1 rounded-full transition-colors duration-200 ${active ? "bg-[#f472b6]" : "bg-transparent"}`}
        aria-hidden
      />
    </>
  );
}

export function MobileGlassDock() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const { open: openMobileMenu } = useMobileSideMenu();
  const { available: chatAvailable, isOpen: chatOpen, open: openChat } = useAIChatPanel();
  const avatar = useCurrentUserAvatar();
  // URL → remembered working space → account → this device's last space,
  // the same order as the header (see useWorkingSpace).
  const { space: effectiveSpace, isAdmin } = useWorkingSpace();
  const items = mobileDockItems(pathname, effectiveSpace, { isAdmin });
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
    // While the chat sheet is open the dock stays put.
    if (hidden || chatOpen) return;

    lastScrollY.current = window.scrollY;

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        window.requestAnimationFrame(handleScroll);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hidden, chatOpen, handleScroll]);

  useEffect(() => {
    const resetOnNav = () => {
      setVisible(true);
      lastScrollY.current = window.scrollY;
    };
    resetOnNav();
  }, [pathname]);

  if (hidden) return null;

  const activeFor = (item: MobileDockItem) => (pathname ? isDockItemActive(pathname, item) : false);
  const shown = visible || chatOpen;

  const renderTab = (item: MobileDockItem) => {
    const active = activeFor(item);
    if (item.action === "menu") {
      return (
        <button key={item.slot} type="button" onClick={openMobileMenu} aria-label={item.label} className={TAB_BASE}>
          <TabContent item={item} active={false} avatar={avatar} />
        </button>
      );
    }
    return (
      <Link
        key={item.slot}
        href={item.href}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        className={TAB_BASE}
      >
        <TabContent item={item} active={active} avatar={avatar} />
      </Link>
    );
  };

  const center = items.find((item) => item.slot === "center");
  const CenterIcon = center?.icon;
  const centerActive = center ? activeFor(center) : false;
  // The AI button opens the chat sheet in place; on the AI teacher pages
  // (where the sheet is unavailable) it is simply the current page.
  const centerOpensChat = center?.action === "ai-chat" && chatAvailable;
  const ringed = (center?.action === "ai-chat" && chatOpen) || centerActive;
  const circleClass = `box-content flex h-14 w-14 items-center justify-center rounded-full border-4 border-[var(--bg-primary)] bg-[var(--accent-primary)] text-white transition-[transform,box-shadow] duration-200 active:scale-[0.94] motion-reduce:transition-none ${
    ringed
      ? "shadow-[0_0_0_6px_rgba(216,24,120,0.22),0_10px_24px_-8px_rgba(216,24,120,0.5)]"
      : "shadow-[0_10px_24px_-8px_rgba(216,24,120,0.5)]"
  }`;
  const centerInner =
    center && CenterIcon ? (
      <>
        <span className={circleClass}>
          <CenterIcon className="h-[23px] w-[23px] stroke-[2]" aria-hidden />
        </span>
        <span className="mt-1 whitespace-nowrap text-[10.5px] font-semibold leading-none text-white">{center.label}</span>
      </>
    ) : null;

  return (
    <nav
      aria-label="მობილური ნავიგაცია"
      className={`fixed inset-x-3 bottom-[max(22px,calc(env(safe-area-inset-bottom)+10px))] z-50 md:hidden transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[140%] opacity-0"
      }`}
    >
      {/* Same surface as the header pill — see `.header-pill` in globals.css.
          The bar is dark in both themes, so its children render their
          night-mode styling; hence the `dark` class. */}
      <div className="header-pill dark flex h-[66px] items-center rounded-full border border-white/[0.08] px-1 shadow-[0_18px_44px_-14px_rgba(2,6,23,0.75)]">
        {items.filter((item) => item.slot === "tab1" || item.slot === "tab2").map(renderTab)}
        {center ? (
          <div className="relative flex w-[60px] shrink-0 justify-center">
            {centerOpensChat ? (
              <button
                type="button"
                onClick={openChat}
                aria-label="AI მასწავლებელი"
                aria-expanded={chatOpen}
                aria-controls="ai-chat-window"
                className="-mt-[30px] flex flex-col items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                {centerInner}
              </button>
            ) : (
              <Link
                href={center.href}
                aria-label={center.label}
                aria-current={centerActive ? "page" : undefined}
                className="-mt-[30px] flex flex-col items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                {centerInner}
              </Link>
            )}
          </div>
        ) : null}
        {items.filter((item) => item.slot === "tab4" || item.slot === "tab5").map(renderTab)}
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
