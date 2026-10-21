"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Flame } from "lucide-react";
import { useStreak } from "@/hooks/useStreak";
import { useCurrentUserAvatar } from "@/hooks/useCurrentUserAvatar";
import { buildProfileNav, isProfileNavItemActive } from "@/lib/settings-nav";
import { nbNavClass } from "@/lib/nb-button";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";

interface ProfileShellProps {
  userName: string;
  initials: string;
  planLabel: string;
  /** The working space: the menu's overview / stats links follow it. */
  space: SpaceeduSpace | null;
  /** Where those links go when there is no space at all. */
  isAdmin?: boolean;
  children: React.ReactNode;
}


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
  const { current: streakDays } = useStreak();
  const { photoUrl } = useCurrentUserAvatar();
  const flatItems = groups.flatMap((g) => g.items);
  const activeChipRef = useRef<HTMLAnchorElement>(null);

  // Keep the active chip visible in the mobile row as the section changes.
  useEffect(() => {
    activeChipRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
      {/* Mobile: horizontally scrollable chips (sidebar is hidden below md).
          Room below/right for the active chip's hard shadow. */}
      <nav
        aria-label="პროფილის მენიუ"
        className="mb-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 pr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden"
      >
        {flatItems.map((item) => {
          const active = isProfileNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              ref={active ? activeChipRef : undefined}
              aria-current={active ? "page" : undefined}
              className={nbNavClass({
                active,
                danger: item.danger,
                // Idle chips keep a thin outline on a phone (no hover there).
                className: `shrink-0 px-3 py-1.5 text-xs font-semibold ${active ? "" : "!border-[var(--border)]"}`,
              })}
            >
              <Icon className="h-3.5 w-3.5 stroke-[1.75]" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
        {/* Desktop sidebar */}
        <nav
          aria-label="პროფილის მენიუ"
          className="hidden flex-col gap-1 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 pr-4 md:flex"
        >
          <div className="mb-3 flex items-center gap-2.5 border-b border-[var(--border)] px-2 pb-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#0f0f14] bg-[var(--bg-secondary)] text-[13px] font-semibold text-[var(--text-primary)] dark:border-[#f4f4f5]">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- user photo from Storage / Google
                <img src={photoUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                initials || "მე"
              )}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-[var(--text-primary)]">
                {userName || "მომხმარებელი"}
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-[10px] text-[var(--text-secondary)]">{planLabel}</span>
                {streakDays > 0 && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[10px] font-medium text-amber-600 dark:text-amber-400">
                    <Flame className="h-3 w-3 stroke-[2]" aria-hidden />
                    {streakDays} დღე
                  </span>
                )}
              </div>
            </div>
          </div>

          {groups.map((group) => (
            <div key={group.title} className="flex flex-col gap-0.5">
              <div className="px-2 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                {group.title}
              </div>
              {group.items.map((item) => {
                const active = isProfileNavItemActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={nbNavClass({
                      active,
                      danger: item.danger,
                      className: `px-3 py-1.5 text-[13px] ${active ? "font-semibold" : ""}`,
                    })}
                  >
                    <Icon className="h-[15px] w-[15px] stroke-[1.75]" aria-hidden />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Content */}
        <div className="flex min-w-0 flex-col gap-3.5">{children}</div>
      </div>
    </div>
  );
}
