"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useStreak } from "@/hooks/useStreak";
import { useCurrentUserAvatar } from "@/hooks/useCurrentUserAvatar";
import {
  activeProfileNavItem,
  buildProfileNav,
  isProfileNavItemActive,
  SETTINGS_MENU_HREF,
} from "@/lib/settings-nav";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";
import { ProfileMenuScreen } from "./ProfileMenuScreen";
import { SpaceAvatar } from "./SpaceAvatar";
import "./profile-shell.css";

interface ProfileShellProps {
  userName: string;
  initials: string;
  planLabel: string;
  /** The working space: the menu's overview / stats links and the avatar's colour follow it. */
  space: SpaceeduSpace | null;
  /** Where those links go when there is no space at all. */
  isAdmin?: boolean;
  children: React.ReactNode;
}

/**
 * The profile and settings pages: a sticky side menu beside the page on
 * desktop. On a phone the menu is its own screen (/settings) and every other
 * page opens with a back bar to it.
 */
export function ProfileShell({
  userName,
  initials,
  planLabel,
  space,
  isAdmin = false,
  children,
}: ProfileShellProps) {
  const pathname = usePathname() ?? "";
  const groups = buildProfileNav(space, { isAdmin });
  // Same source as the header and the overview's streak card.
  const streak = useStreak();
  const { photoUrl } = useCurrentUserAvatar();
  const onMenuScreen = pathname === SETTINGS_MENU_HREF;
  const current = activeProfileNavItem(groups, pathname);
  const name = userName || "მომხმარებელი";

  return (
    <div className="pshell under-site-header min-h-dvh max-md:-mt-[var(--safe-top)] max-md:-mb-36 max-md:pb-36">
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-[calc(var(--safe-top)+12px)] sm:px-6 md:pt-8">
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
          <nav
            aria-label="პროფილის მენიუ"
            className="ps-card sticky top-[calc(var(--site-header-h)+16px)] hidden p-3 md:block"
          >
            <div className="flex items-center gap-3 px-2 pb-4 pt-2">
              <SpaceAvatar
                space={space}
                initials={initials}
                photoUrl={photoUrl}
                className="h-11 w-11 rounded-full text-[15px]"
              />
              <div className="min-w-0">
                <div className="truncate text-[15px] font-bold text-[var(--ps-title)]">{name}</div>
                <div className="mt-0.5 text-[12.5px] leading-snug text-[var(--ps-muted)]">
                  {streak.ready ? `${planLabel} · ${streak.current} დღე სტრიქი` : planLabel}
                </div>
              </div>
            </div>

            {groups.map((group) => (
              <div
                key={group.title || "danger"}
                className={group.title ? "pb-2" : "mt-1 border-t border-[var(--ps-divider)] pt-3"}
              >
                {group.title ? (
                  <div className="px-3 pb-1.5 pt-2 text-[12px] font-semibold text-[var(--ps-muted)]">
                    {group.title}
                  </div>
                ) : null}
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const active = isProfileNavItemActive(pathname, item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`ps-nav-item ps-focus ${item.danger ? "ps-nav-item--danger" : ""}`}
                      >
                        <Icon aria-hidden strokeWidth={1.8} />
                        <span className="min-w-0">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="flex min-w-0 flex-col gap-5">
            {onMenuScreen ? (
              <ProfileMenuScreen
                groups={groups}
                space={space}
                name={name}
                initials={initials}
                photoUrl={photoUrl}
                planLabel={planLabel}
                streakDays={streak.ready ? streak.current : null}
              />
            ) : (
              <div className="flex items-center gap-3 md:hidden">
                <Link
                  href={SETTINGS_MENU_HREF}
                  aria-label="უკან, მენიუში"
                  className="ps-focus flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--ps-border)] bg-[var(--ps-card)] text-[var(--ps-title)]"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
                </Link>
                <h1 className="truncate text-[20px] font-bold text-[var(--ps-title)]">{current?.label ?? "პროფილი"}</h1>
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
