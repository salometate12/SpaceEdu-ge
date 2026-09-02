"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Flame, LayoutDashboard, MessageSquare, Rocket, UserRound } from "lucide-react";
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
    { label: "Dashboard", href: dashboardHrefForSpace(effectiveSpace), icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
    { label: "გეგმა", href: studyPlanHrefForSpace(effectiveSpace), icon: <Rocket className="h-3.5 w-3.5" /> },
    { label: "Quiz", href: "/quiz", icon: <Flame className="h-3.5 w-3.5" /> },
    { label: "AI", href: "/ai-teacher", icon: <MessageSquare className="h-3.5 w-3.5" /> },
    { label: "პროფილი", href: profileHrefForSpace(effectiveSpace), icon: <UserRound className="h-3.5 w-3.5" /> },
  ];

  return (
    <header
      className={`sticky top-0 z-40 border-b px-4 transition-colors sm:px-6 ${
        scrolled
          ? "border-[var(--border-hover)] bg-[var(--header-scrolled-bg)] backdrop-blur-md"
          : "border-[var(--border)] bg-[var(--bg-primary)]"
      }`}
    >
      <div className="mx-auto flex h-12 w-full max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/select-space" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#7C3AED]">
              <Rocket className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="headline text-base font-medium text-[var(--text-primary)]">
              SpaceEdu
            </span>
          </Link>
          <SpaceChip space={effectiveSpace} />
        </div>

        {!hasOwnNav && (
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) =>
              item.href === "/ai-teacher" ? (
                <button
                  key={item.href}
                  type="button"
                  onClick={toggleAiChat}
                  aria-pressed={aiChatOpen}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                    aiChatOpen
                      ? "bg-violet-100 text-violet-700 dark:bg-[#1a0a2e] dark:text-[#a78bfa]"
                      : "text-[var(--text-secondary)] hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-[#1a0a2e] dark:hover:text-[#a78bfa]"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-[#1a0a2e] dark:hover:text-[#a78bfa]"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="hidden items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs text-amber-700 sm:inline-flex dark:border-[#f59e0b] dark:bg-[#2d1a00] dark:text-[#fcd34d]">
            <Flame className="h-3.5 w-3.5" />
            {streak} სტრიქი
          </span>
          <Link
            href="/notifications"
            className="relative rounded-lg border border-[var(--border)] p-2 text-[var(--text-secondary)] transition-colors hover:border-violet-300 hover:text-violet-700 dark:hover:text-white"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
            )}
          </Link>
          <div className={`relative ${hasOwnNav ? "md:hidden" : ""}`}>
            <button
              type="button"
              onClick={() => setAvatarOpen((prev) => !prev)}
              className="h-9 w-9 rounded-full border border-violet-300 bg-violet-100 text-sm font-semibold text-violet-700 dark:border-[#7C3AED] dark:bg-[#1a0a2e] dark:text-[#c4b5fd]"
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
      </div>

    </header>
  );
}
