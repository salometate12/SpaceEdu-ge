"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BarChart3, LogOut, Settings, Shield, User } from "lucide-react";
import { signOutUser } from "@/lib/auth";

interface AvatarDropdownProps {
  open: boolean;
  isAdmin?: boolean;
  profileHref?: string;
  statsHref?: string;
}

export function AvatarDropdown({
  open,
  isAdmin = false,
  profileHref = "/profile",
  statsHref = "/profile/stats",
}: AvatarDropdownProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  if (!open) return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOutUser();
    } finally {
      window.localStorage.removeItem("spaceedu_space");
      window.localStorage.removeItem("spaceedu-active-space");
      router.push("/select-space");
      router.refresh();
    }
  };

  return (
    <div className="absolute right-0 top-11 z-50 min-w-[180px] rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] p-1 shadow-[0_8px_24px_rgba(0,0,0,0.4)] animate-[fade-in-up_.15s_ease]">
      <Link
        href={profileHref}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text-primary)]"
      >
        <User className="h-4 w-4" />
        პროფილი
      </Link>
      <Link
        href={statsHref}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text-primary)]"
      >
        <BarChart3 className="h-4 w-4" />
        სტატისტიკა
      </Link>
      <Link
        href="/settings"
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text-primary)]"
      >
        <Settings className="h-4 w-4" />
        პარამეტრები
      </Link>
      {isAdmin && (
        <>
          <div className="my-1 h-px bg-[var(--border)]" />
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-violet-700 transition-colors hover:bg-violet-100 dark:text-[#c4b5fd] dark:hover:bg-[#1a0a2e] dark:hover:text-[#a78bfa]"
          >
            <Shield className="h-4 w-4" />
            Admin Panel
          </Link>
        </>
      )}
      <div className="my-1 h-px bg-[var(--border)]" />
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={signingOut}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-rose-600 transition-colors hover:bg-[var(--nav-hover-bg)] disabled:opacity-60 dark:text-[#f472b6]"
      >
        <LogOut className="h-4 w-4" />
        {signingOut ? "გასვლა..." : "გასვლა"}
      </button>
    </div>
  );
}

