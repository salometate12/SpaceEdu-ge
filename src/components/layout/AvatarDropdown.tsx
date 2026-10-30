"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { BarChart3, FolderOpen, LogOut, Settings, Shield, User } from "lucide-react";
import { signOutUser } from "@/lib/auth";
import { useDismiss } from "@/hooks/useDismiss";
import "./profile-menu.css";

export const PROFILE_MENU_ID = "profile-menu";

interface AvatarDropdownProps {
  open: boolean;
  onClose: () => void;
  /** The avatar button: excluded from „outside“, and gets focus back on Esc. */
  triggerRef: RefObject<HTMLElement | null>;
  isAdmin?: boolean;
  profileHref?: string;
  statsHref?: string;
  /** The working space, for the space strip and the avatar's colour. */
  space: string;
  name: string | null;
  email: string | null;
  initial: string;
  photoUrl?: string | null;
}

const SPACE: Record<"student" | "abiturient", { label: string; strip: string; dot: string; avatar: string }> = {
  student: {
    label: "სტუდენტის სივრცე",
    strip: "bg-[var(--pm-student-bg)] text-[var(--pm-student)]",
    dot: "bg-[#ec4899]",
    avatar: "bg-[#fce7f3] text-[#9d174d]",
  },
  abiturient: {
    label: "აბიტურიენტის სივრცე",
    strip: "bg-[var(--pm-abit-bg)] text-[var(--pm-abit)]",
    dot: "bg-[#facc15]",
    avatar: "bg-[#fef9c3] text-[#854d0e]",
  },
};

export function spaceLook(space: string) {
  return space === "abiturient" ? SPACE.abiturient : SPACE.student;
}

/**
 * The header's profile menu: who's signed in, their space with „შეცვლა“,
 * the account links, the admin panel for admins, and „გასვლა“. Closes on a
 * press outside, Esc, a pick, or a route change (handled by the header).
 */
export function AvatarDropdown({
  open,
  onClose,
  triggerRef,
  isAdmin = false,
  profileHref = "/profile",
  statsHref = "/profile/stats",
  space,
  name,
  email,
  initial,
  photoUrl,
}: AvatarDropdownProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const look = spaceLook(space);

  useDismiss(open, onClose, panelRef, triggerRef);

  // Opening puts focus on the first item, so the arrows work at once.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
  }, [open]);

  if (!open) return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOutUser();
    } finally {
      window.localStorage.removeItem("spaceedu_space");
      window.localStorage.removeItem("spaceedu-active-space");
      onClose();
      router.push("/select-space");
      router.refresh();
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = [...(panelRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLElement);
    const move = (next: number) => {
      event.preventDefault();
      items[(next + items.length) % items.length].focus();
    };
    if (event.key === "ArrowDown") move(index + 1);
    else if (event.key === "ArrowUp") move(index - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(items.length - 1);
    // Tab leaves the menu and carries on through the page.
    else if (event.key === "Tab") onClose();
  };

  return (
    <div
      ref={panelRef}
      id={PROFILE_MENU_ID}
      role="menu"
      aria-label="პროფილის მენიუ"
      onKeyDown={onKeyDown}
      className="profile-menu absolute right-0 top-[calc(100%+12px)] z-50 w-[320px] rounded-[22px] p-2"
    >
      <div className="flex items-center gap-3 px-3 pb-3.5 pt-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-[16px] font-bold ${look.avatar}`}>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- user photo from Storage / Google
            <img src={photoUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            initial
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[15.5px] font-bold text-[var(--pm-text)]">{name ?? "შენი ანგარიში"}</span>
          {email ? <span className="block truncate text-[13px] text-[var(--pm-muted)]">{email}</span> : null}
        </span>
      </div>

      <div className={`mx-1 mb-2 flex items-center gap-2 rounded-[14px] px-3 py-2.5 text-[13.5px] font-semibold ${look.strip}`}>
        <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${look.dot}`} />
        <span className="min-w-0 flex-1 truncate">{look.label}</span>
        <Link
          href="/select-space"
          role="menuitem"
          onClick={onClose}
          className="pm-focus inline-flex h-[26px] shrink-0 items-center rounded-full bg-[var(--pm-pill)] px-3 text-[12.5px] font-semibold text-[var(--pm-text)]"
        >
          შეცვლა
        </Link>
      </div>

      <Link href={profileHref} role="menuitem" onClick={onClose} className="pm-item">
        <User aria-hidden />
        პროფილი
      </Link>
      <Link href="/library" role="menuitem" onClick={onClose} className="pm-item">
        <FolderOpen aria-hidden />
        ჩემი მასალები
      </Link>
      <Link href={statsHref} role="menuitem" onClick={onClose} className="pm-item">
        <BarChart3 aria-hidden />
        სტატისტიკა
      </Link>
      <Link href="/settings" role="menuitem" onClick={onClose} className="pm-item">
        <Settings aria-hidden />
        პარამეტრები
      </Link>

      {isAdmin ? (
        <>
          <div className="pm-divider" role="separator" />
          <Link href="/admin" role="menuitem" onClick={onClose} className="pm-item pm-admin">
            <Shield aria-hidden />
            ადმინ პანელი
          </Link>
        </>
      ) : null}

      <div className="pm-divider" role="separator" />
      <button
        type="button"
        role="menuitem"
        onClick={() => void handleSignOut()}
        disabled={signingOut}
        className="pm-item pm-out disabled:opacity-60"
      >
        <LogOut aria-hidden />
        {signingOut ? "გასვლა..." : "გასვლა"}
      </button>
    </div>
  );
}
