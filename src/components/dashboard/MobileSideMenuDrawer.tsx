"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, MessageSquare, Rocket, X } from "lucide-react";
import { signOutUser } from "@/lib/auth";
import { useAIChatPanel } from "@/contexts/AIChatPanelContext";
import { useMobileSideMenu } from "@/contexts/MobileSideMenuContext";
import {
  ACCOUNT_ITEMS,
  GENERAL_ITEMS,
  RailGroup,
  TOOL_ITEMS,
  type RailItem,
} from "./DashboardSideRail";

export function MobileSideMenuDrawer() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, close } = useMobileSideMenu();
  const { isOpen: aiChatOpen, toggle: toggleAiChat } = useAIChatPanel();
  const [signingOut, setSigningOut] = useState(false);

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

  const generalItems: RailItem[] = GENERAL_ITEMS.map((item) => ({
    ...item,
    active: pathname === item.href,
  }));
  const accountItems: RailItem[] = ACCOUNT_ITEMS.map((item) => ({
    ...item,
    active: pathname === item.href,
  }));
  const toolItems: RailItem[] = [
    {
      id: "ai-chat",
      label: "AI ჩატი",
      icon: MessageSquare,
      onClick: () => {
        toggleAiChat();
        close();
      },
      active: aiChatOpen,
    },
    ...TOOL_ITEMS.map((item) => ({ ...item, active: pathname === item.href })),
  ];

  return (
    <div
      className={`fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#0b0b0e] transition-transform duration-300 ease-in-out will-change-transform md:hidden ${
        isOpen ? "translate-x-0" : "pointer-events-none -translate-x-full"
      }`}
      aria-hidden={!isOpen}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <Link href="/select-space" className="flex items-center gap-2" onClick={close}>
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#7C3AED]">
            <Rocket className="h-4 w-4 text-white" />
          </div>
          <span className="headline text-base font-medium text-white">SpaceEdu</span>
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
        <RailGroup title="ზოგადი" items={generalItems} expanded />

        <div className="mt-4 border-t border-white/10 pt-4">
          <RailGroup title="ხელსაწყოები" items={toolItems} expanded />
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          <RailGroup title="ანგარიში" items={accountItems} expanded />
        </div>
      </div>

      <div className="border-t border-white/10 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
