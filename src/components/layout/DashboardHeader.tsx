"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Flame, LayoutDashboard, MessageSquare, Rocket, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAIChatPanel } from "@/contexts/AIChatPanelContext";
import { useCurrentUserFirstName } from "@/hooks/useCurrentUserFirstName";
import { getCurrentStreak, STREAK_UPDATED_EVENT } from "@/lib/daily-streak";
import {
  ensureDailyStudyPlanNotification,
  getUnreadCount,
  NOTIFICATIONS_UPDATED_EVENT,
} from "@/lib/notifications";
import { AvatarDropdown } from "./AvatarDropdown";
import { SpaceChip } from "./SpaceChip";

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

  useEffect(() => {
    const saved = window.localStorage.getItem("spaceedu_space");
    if (saved === "school" || saved === "abiturient" || saved === "student") {
      setSpaceLabel(saved);
    }
  }, []);

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
    { label: "Dashboard", href: "/dashboard-abit", icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
    { label: "გეგმა", href: "/study-plan/abit", icon: <Rocket className="h-3.5 w-3.5" /> },
    { label: "Quiz", href: "/quiz", icon: <Flame className="h-3.5 w-3.5" /> },
    { label: "AI", href: "/ai-teacher", icon: <MessageSquare className="h-3.5 w-3.5" /> },
    { label: "პროფილი", href: "/profile", icon: <UserRound className="h-3.5 w-3.5" /> },
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
          <SpaceChip space={spaceLabel} />
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
                      ? "bg-[#1a0a2e] text-[#a78bfa]"
                      : "text-[var(--text-secondary)] hover:bg-[#1a0a2e] hover:text-[#a78bfa]"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[#1a0a2e] hover:text-[#a78bfa]"
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
          <span className="hidden items-center gap-1 rounded-full border border-[#f59e0b] bg-[#2d1a00] px-2.5 py-1 text-xs text-[#fcd34d] sm:inline-flex dark:border-[#f59e0b] dark:bg-[#2d1a00]">
            <Flame className="h-3.5 w-3.5" />
            {streak} სტრიქი
          </span>
          <Link
            href="/notifications"
            className="relative rounded-lg border border-[var(--border)] p-2 text-[var(--text-secondary)] hover:text-white"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
            )}
          </Link>
          {!hasOwnNav && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAvatarOpen((prev) => !prev)}
                className="h-9 w-9 rounded-full border border-[#7C3AED] bg-[#1a0a2e] text-sm font-semibold text-[#c4b5fd]"
              >
                {avatarInitial}
              </button>
              <AvatarDropdown open={avatarOpen} />
            </div>
          )}
        </div>
      </div>

    </header>
  );
}
