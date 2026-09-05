"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
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
      className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all active:scale-90 ${
        active
          ? "bg-[var(--accent-primary)]/12 text-[var(--accent-primary)] dark:bg-[var(--accent-primary)]/20"
          : "text-slate-500 hover:bg-black/[0.04] hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100"
      }`}
    >
      <Icon className="h-[22px] w-[22px] stroke-[1.75]" />
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

  const isAppDock = items.some((item) => item.kind);

  if (!isAppDock) {
    // Landing / pricing keep the simple evenly-spread dock.
    return (
      <nav
        aria-label="მობილური ნავიგაცია"
        className={`fixed inset-x-0 bottom-0 z-50 block px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden transition-[transform,opacity] duration-300 ease-out ${
          visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-md items-center justify-between gap-1 rounded-2xl border border-white/20 bg-white/70 px-2 py-2 shadow-[0_8px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0a0f]/75 dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname ? isDockItemActive(pathname, item) : false;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors ${
                  active
                    ? "bg-violet-500/15 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                    : "text-slate-600 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-300"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0 stroke-[1.75]" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  const bySlot = (kind: MobileDockItem["kind"]) => items.find((item) => item.kind === kind);
  const ai = bySlot("ai");
  const calendar = bySlot("calendar");
  const menu = bySlot("menu");
  const profile = bySlot("profile");

  const activeFor = (item: MobileDockItem | undefined) =>
    item && pathname ? isDockItemActive(pathname, item) : false;

  const ProfileIcon = profile?.icon;
  const MenuIcon = menu?.icon;
  const profileActive = activeFor(profile);

  return (
    <nav
      aria-label="მობილური ნავიგაცია"
      className={`fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden transition-[transform,opacity] duration-300 ease-out ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <div className="flex items-center gap-1.5 rounded-[26px] border border-white/50 bg-white/80 px-2.5 py-2.5 shadow-[0_14px_44px_-10px_rgba(15,23,42,0.28)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#101014]/85 dark:shadow-[0_14px_44px_-8px_rgba(0,0,0,0.6)]">
        {ai && (
          <DockIconLink href={ai.href} label={ai.label} icon={ai.icon} active={activeFor(ai)} />
        )}
        {calendar && (
          <DockIconLink
            href={calendar.href}
            label={calendar.label}
            icon={calendar.icon}
            active={activeFor(calendar)}
          />
        )}

        {menu && MenuIcon && (
          <button
            type="button"
            onClick={() => {
              if (menu.href === DASHBOARD_MOBILE_MENU_HREF) openMobileMenu();
            }}
            aria-label={menu.label}
            className="mx-0.5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-[0_6px_18px_-4px_rgba(15,23,42,0.5)] transition-all active:scale-90 dark:from-white dark:to-zinc-300 dark:text-slate-900"
          >
            <MenuIcon className="h-[21px] w-[21px] stroke-[2]" />
          </button>
        )}

        <div className="flex h-11 w-11 items-center justify-center">
          <ThemeToggle className="!h-11 !w-11 !rounded-2xl !border-0 !bg-transparent !text-slate-500 hover:!bg-black/[0.04] dark:!text-zinc-400 dark:hover:!bg-white/[0.06]" />
        </div>

        {profile && ProfileIcon && (
          <Link
            href={profile.href}
            aria-label={profile.label}
            aria-current={profileActive ? "page" : undefined}
            className={`flex h-12 w-12 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#f5b8ec,#d946ef_55%,#a855f7)] text-white shadow-[0_8px_22px_-4px_rgba(217,70,239,0.65)] transition-all active:scale-90 ${
              profileActive ? "ring-2 ring-white ring-offset-2 ring-offset-white/80 dark:ring-offset-[#101014]" : ""
            }`}
          >
            <ProfileIcon className="h-[21px] w-[21px] stroke-[2]" />
          </Link>
        )}
      </div>
    </nav>
  );
}

export function MobileGlassDockByPath() {
  return <MobileGlassDock />;
}
