"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Moon, Sun, X } from "lucide-react";
import { BrandLogo } from "@/components/layout/HeaderPill";
import { useWorkingSpace } from "@/hooks/useWorkingSpace";
import { brandHomeHref } from "@/lib/dashboard-routes";
import { useTheme } from "@/components/ThemeProvider";
import { signOutUser } from "@/lib/auth";
import { useAIChatPanel } from "@/contexts/AIChatPanelContext";
import { useMobileSideMenu } from "@/contexts/MobileSideMenuContext";
import { spaceFromPathname } from "@/lib/access-control";
import { buildRailGroups, RailGroup } from "./DashboardSideRail";

export function MobileSideMenuDrawer() {
  const { theme, setTheme } = useTheme();
  const { space: workingSpace } = useWorkingSpace();
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, close } = useMobileSideMenu();
  const { isOpen: aiChatOpen, toggle: toggleAiChat } = useAIChatPanel();
  const [signingOut, setSigningOut] = useState(false);

  const space = spaceFromPathname(pathname ?? "") ?? undefined;

  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOutUser();
    } finally {
      window.localStorage.removeItem("spaceedu_space");
      window.localStorage.removeItem("spaceedu-active-space");
      close();
      router.push("/select-space");
      router.refresh();
    }
  };

  const groups = buildRailGroups({
    space,
    pathname,
    onAiChat: () => {
      toggleAiChat();
      close();
    },
    aiChatOpen,
  });

  return (
    <div
      className={`fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#0b0b0e] transition-transform duration-300 ease-in-out will-change-transform md:hidden ${
        isOpen ? "translate-x-0" : "pointer-events-none -translate-x-full"
      }`}
      aria-hidden={!isOpen}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        {/* The menu is dark in both themes, so the -dark logo (see BrandLogo). */}
        <Link href={brandHomeHref(workingSpace)} className="flex items-center rounded-lg" onClick={close}>
          <BrandLogo className="h-8 w-auto" />
        </Link>
        <button
          type="button"
          onClick={close}
          aria-label="მენიუს დახურვა"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition-all hover:bg-white/20 hover:text-white"
        >
          <X className="h-5 w-5 stroke-[2]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group, index) => (
          <div
            key={group.title}
            className={index > 0 ? "mt-4 border-t border-white/10 pt-4" : ""}
          >
            <RailGroup title={group.title} items={group.items} expanded />
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* The theme switch lives here now that the dock is five tabs. */}
        <div className="mb-1 flex items-center justify-between rounded-full px-3 py-1.5" role="group" aria-label="თემა">
          <span className="text-sm font-semibold text-white/70">თემა</span>
          <div className="flex rounded-full bg-white/[0.06] p-0.5">
            {(["light", "dark"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTheme(option)}
                aria-pressed={theme === option}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  theme === option ? "bg-white text-[#0b0b0e]" : "text-white/60 hover:text-white"
                }`}
              >
                {option === "light" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                {option === "light" ? "ღია" : "მუქი"}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold text-rose-400/80 transition-all hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 stroke-[1.75]" />
          {signingOut ? "გასვლა..." : "გასვლა"}
        </button>
      </div>
    </div>
  );
}
