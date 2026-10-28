"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTheme, type ThemePreference } from "@/components/ThemeProvider";
import {
  SETTINGS_APPEARANCE_HREF,
  SETTINGS_PLAN_HREF,
  SETTINGS_PROFILE_HREF,
  SETTINGS_SPACE_HREF,
  type ProfileNavGroup,
} from "@/lib/settings-nav";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";
import { SpaceAvatar } from "./SpaceAvatar";

const THEME_SHORT: Record<ThemePreference, string> = {
  light: "ღია",
  dark: "მუქი",
  system: "სისტემური",
};

export function spaceName(space: SpaceeduSpace | null | undefined): string | null {
  if (space === "student") return "სტუდენტი";
  if (space === "abiturient" || space === "school") return "აბიტურიენტი";
  return null;
}

/**
 * Phones: the profile menu as a screen of its own — who you are, the two
 * progress pages as tiles, then the settings as grouped lists with their
 * current value on the right, and the danger zone apart in red.
 */
export function ProfileMenuScreen({
  groups,
  space,
  name,
  initials,
  photoUrl,
  planLabel,
  streakDays,
}: {
  groups: ProfileNavGroup[];
  space: SpaceeduSpace | null;
  name: string;
  initials: string;
  photoUrl: string | null;
  planLabel: string;
  /** null until read on the client. */
  streakDays: number | null;
}) {
  const { preference } = useTheme();
  const [progress, ...rest] = groups;
  const lists = rest.filter((group) => group.title);
  const danger = rest.filter((group) => !group.title).flatMap((group) => group.items);
  const space_ = spaceName(space);

  const valueFor = (href: string): string | null => {
    if (href === SETTINGS_SPACE_HREF) return space_;
    if (href === SETTINGS_APPEARANCE_HREF) return `${THEME_SHORT[preference]} · ქართ.`;
    if (href === SETTINGS_PLAN_HREF) return planLabel;
    return null;
  };

  // „სტუდენტი“ → „სტუდენტის სივრცე“.
  const meta = [space_ ? `${space_.slice(0, -1)}ის სივრცე` : null, streakDays !== null ? `${streakDays} დღე სტრიქი` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-5 md:hidden">
      <h1 className="text-[26px] font-bold tracking-tight text-[var(--ps-title)]">პროფილი</h1>

      <Link href={SETTINGS_PROFILE_HREF} className="ps-card ps-focus flex items-center gap-3 p-4">
        <SpaceAvatar space={space} initials={initials} photoUrl={photoUrl} className="h-12 w-12 rounded-full text-[17px]" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-bold text-[var(--ps-title)]">{name}</span>
          {meta ? <span className="block truncate text-[13px] text-[var(--ps-muted)]">{meta}</span> : null}
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-[var(--ps-muted)]" aria-hidden />
      </Link>

      <div className="grid grid-cols-2 gap-3">
        {progress.items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="ps-card ps-focus flex flex-col gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--ps-active-bg)] text-[var(--ps-active)]">
                <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
              </span>
              <span className="text-[15px] font-semibold text-[var(--ps-title)]">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {lists.map((group) => {
        // The card above already opens the profile form.
        const items = group.items.filter((item) => item.href !== SETTINGS_PROFILE_HREF);
        if (items.length === 0) return null;
        return (
          <section key={group.title} aria-label={group.title}>
            <h2 className="px-1 pb-2 text-[12.5px] font-semibold text-[var(--ps-muted)]">{group.title}</h2>
            <div className="overflow-hidden rounded-[18px] border border-[var(--ps-border)] bg-[var(--ps-card)]">
              {items.map((item) => {
                const Icon = item.icon;
                const value = valueFor(item.href);
                return (
                  <Link key={item.href} href={item.href} className="ps-row ps-focus">
                    <Icon className="ps-row-icon" strokeWidth={1.8} aria-hidden />
                    <span className="flex-1">{item.label}</span>
                    {value ? <span className="min-w-0 max-w-[45%] truncate text-[13.5px] text-[var(--ps-muted)]">{value}</span> : null}
                    <ChevronRight className="h-4 w-4 shrink-0 text-[var(--ps-muted)]" aria-hidden />
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      {danger.length > 0 ? (
        <div className="overflow-hidden rounded-[18px] border border-[var(--ps-danger-border)] bg-[var(--ps-card)]">
          {danger.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="ps-row ps-focus !text-[var(--ps-danger)]">
                <Icon className="ps-row-icon !text-[var(--ps-danger)]" strokeWidth={1.8} aria-hidden />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
