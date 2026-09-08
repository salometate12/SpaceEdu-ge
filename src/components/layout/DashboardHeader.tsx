"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAIChatPanel } from "@/contexts/AIChatPanelContext";
import { useCurrentUserFirstName } from "@/hooks/useCurrentUserFirstName";
import { useCurrentUserAccess } from "@/hooks/useCurrentUserAccess";
import { getCurrentStreak, STREAK_UPDATED_EVENT } from "@/lib/daily-streak";
import {
  ensureDailyStudyPlanNotification,
  getUnreadCount,
  NOTIFICATIONS_UPDATED_EVENT,
} from "@/lib/notifications";
import { AvatarDropdown } from "./AvatarDropdown";
import { FocusModeToggle } from "./FocusModeToggle";
import { HeaderBrand, HeaderNav, HeaderPill, headerNavItemClass } from "./HeaderPill";
import { SpaceChip } from "./SpaceChip";
import { dashboardHrefForSpace } from "@/lib/dashboard-routes";
import { profileHrefForSpace, spaceFromPathname, statsHrefForSpace, studyPlanHrefForSpace } from "@/lib/access-control";

interface DashboardHeaderProps {
  scrolled: boolean;
  mobileOpen: boolean;
  onToggleMobile: () => void;
}

export function DashboardHeader({
  scrolled,
}: DashboardHeaderProps) {
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [spaceLabel, setSpaceLabel] = useState<"school" | "abiturient" | "student">(
    "student",
  );
  const [streak, setStreak] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isOpen: aiChatOpen, toggle: toggleAiChat } = useAIChatPanel();
  const firstName = useCurrentUserFirstName();
  const avatarInitial = firstName ? firstName.charAt(0).toUpperCase() : "მ";
  const pathname = usePathname();
  const hasOwnNav = pathname === "/dashboard-student";
  const { space: accountSpace, isAdmin } = useCurrentUserAccess();

  useEffect(() => {
    const saved = window.localStorage.getItem("spaceedu_space");
    if (saved === "school" || saved === "abiturient" || saved === "student") {
      setSpaceLabel(saved);
    }
  }, []);

  // The current URL wins when it's a space-specific route (e.g.
  // /dashboard-student), so an admin browsing another space's page sees
  // a chip/nav that matches what's actually on screen. Otherwise fall
  // back to the account's real space (Supabase), then localStorage for
  // anonymous/dev use.
  const pathSpace = spaceFromPathname(pathname);
  const effectiveSpace = pathSpace ?? accountSpace ?? spaceLabel;

  useEffect(() => {
    const sync = () => setStreak(getCurrentStreak());
    sync();
    window.addEventListener(STREAK_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STREAK_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    ensureDailyStudyPlanNotification();
    const sync = () => setUnreadCount(getUnreadCount());
    sync();
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const navItems = [
    { label: "Dashboard", href: dashboardHrefForSpace(effectiveSpace) },
    { label: "გეგმა", href: studyPlanHrefForSpace(effectiveSpace) },
    { label: "Quiz", href: "/quiz" },
    { label: "AI", href: "/ai-teacher" },
    { label: "პროფილი", href: profileHrefForSpace(effectiveSpace) },
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(`${href}/`));

  return (
    <HeaderPill scrolled={scrolled}>
      <HeaderBrand href="/select-space" />
      <SpaceChip space={effectiveSpace} />

      {!hasOwnNav && (
        <HeaderNav>
          {navItems.map((item) =>
            item.href === "/ai-teacher" ? (
              <button
                key={item.href}
                type="button"
                onClick={toggleAiChat}
                aria-pressed={aiChatOpen}
                className={headerNavItemClass(aiChatOpen)}
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={headerNavItemClass(Boolean(isActive(item.href)))}
              >
                {item.label}
              </Link>
            ),
          )}
        </HeaderNav>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
        <span className="hidden items-center gap-1 rounded-full border border-amber-400/35 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300 xl:inline-flex">
          <Flame className="h-3.5 w-3.5" />
          {streak} სტრიქი
        </span>
        <FocusModeToggle compact />
        <ThemeToggle />
        <Link
          href="/notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-hover)] hover:text-white"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
          )}
        </Link>
        <div className={`relative ${hasOwnNav ? "md:hidden" : ""}`}>
          <button
            type="button"
            onClick={() => setAvatarOpen((prev) => !prev)}
            className="h-9 w-9 rounded-full border border-[#7C3AED] bg-[#1a0a2e] text-sm font-semibold text-[#c4b5fd] transition-colors hover:bg-[#25103f]"
          >
            {avatarInitial}
          </button>
          <AvatarDropdown
            open={avatarOpen}
            isAdmin={isAdmin}
            profileHref={profileHrefForSpace(effectiveSpace)}
            statsHref={statsHrefForSpace(effectiveSpace)}
          />
        </div>
      </div>
    </HeaderPill>
  );
}
