"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  BriefcaseBusiness,
  Brain,
  CalendarClock,
  ChevronRight,
  FileSearch,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  MessageSquareText,
  Settings,
  Shield,
  Sparkles,
  User,
} from "lucide-react";
import { researchPlatformHref } from "@/lib/space-back-navigation";
import { signOutUser } from "@/lib/auth";
import { useAIChatPanel } from "@/contexts/AIChatPanelContext";

interface RailItem {
  id: string;
  label: string;
  href?: string;
  icon: typeof LayoutDashboard;
  onClick?: () => void;
  active?: boolean;
}

const GENERAL_ITEMS: Omit<RailItem, "onClick" | "active">[] = [
  { id: "dashboard", label: "დეშბორდი", href: "/dashboard-student", icon: LayoutDashboard },
  { id: "study-plan", label: "სასწავლო გეგმა", href: "/study-plan", icon: CalendarClock },
  { id: "quiz", label: "ვიქტორინა", href: "/quiz", icon: Brain },
  { id: "profile", label: "პროფილი", href: "/profile", icon: User },
];

const ACCOUNT_ITEMS: Omit<RailItem, "onClick" | "active">[] = [
  { id: "stats", label: "სტატისტიკა", href: "/profile/stats", icon: BarChart3 },
  { id: "settings", label: "პარამეტრები", href: "/settings", icon: Settings },
  { id: "admin", label: "Admin Panel", href: "/admin", icon: Shield },
];

const TOOL_ITEMS: Omit<RailItem, "onClick" | "active">[] = [
  { id: "ai-teacher", label: "AI მასწავლებელი", href: "/ai-teacher", icon: MessageSquareText },
  { id: "research", label: "მასალა → ანალიზი", href: researchPlatformHref("student"), icon: FileSearch },
  { id: "presentation", label: "AI პრეზენტაცია", href: "/presentation", icon: Sparkles },
  { id: "cv", label: "CV გენერატორი", href: "/cv", icon: BriefcaseBusiness },
  { id: "syllabus", label: "სილაბუსი", href: "/syllabus", icon: GraduationCap },
];

function RailLink({ item, expanded }: { item: RailItem; expanded: boolean }) {
  const Icon = item.icon;
  const className = `group relative flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 ${
    item.active ? "bg-white text-black" : "text-white/60 hover:bg-white/10 hover:text-white"
  }`;
  const content = (
    <>
      <Icon className="h-[18px] w-[18px] shrink-0 stroke-[1.75]" />
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </>
  );

  if (item.onClick) {
    return (
      <button type="button" title={expanded ? undefined : item.label} onClick={item.onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link href={item.href ?? "#"} title={expanded ? undefined : item.label} className={className}>
      {content}
    </Link>
  );
}

function RailGroup({
  title,
  items,
  expanded,
}: {
  title: string;
  items: RailItem[];
  expanded: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-white/30"
          >
            {title}
          </motion.p>
        )}
      </AnimatePresence>
      {items.map((item) => (
        <RailLink key={item.id} item={item} expanded={expanded} />
      ))}
    </div>
  );
}

export function DashboardSideRail() {
  const [expanded, setExpanded] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen: aiChatOpen, toggle: toggleAiChat } = useAIChatPanel();

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

  const generalItems: RailItem[] = GENERAL_ITEMS.map((item) => ({
    ...item,
    active: pathname === item.href,
  }));
  const accountItems: RailItem[] = ACCOUNT_ITEMS.map((item) => ({
    ...item,
    active: pathname === item.href,
  }));
  const toolItems: RailItem[] = [
    { id: "ai-chat", label: "AI ჩატი", icon: MessageSquare, onClick: toggleAiChat, active: aiChatOpen },
    ...TOOL_ITEMS.map((item) => ({ ...item, active: pathname === item.href })),
  ];

  return (
    <motion.aside
      animate={{ width: expanded ? 232 : 76 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="sticky top-24 hidden max-h-[calc(100vh-7rem)] shrink-0 self-start overflow-y-auto overflow-x-hidden rounded-[28px] bg-[#0b0b0e] p-3 shadow-[0_12px_32px_rgba(0,0,0,0.35)] lg:flex lg:flex-col"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mb-3 flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-full bg-white/10 text-white/70 transition-all hover:bg-white/20 hover:text-white"
        aria-label={expanded ? "მენიუს ჩაკეცვა" : "მენიუს გამოწევა"}
      >
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight className="h-4 w-4 stroke-[2]" />
        </motion.span>
      </button>

      <RailGroup title="ზოგადი" items={generalItems} expanded={expanded} />

      <div className="mt-4 border-t border-white/10 pt-4">
        <RailGroup title="ხელსაწყოები" items={toolItems} expanded={expanded} />
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <RailGroup title="ანგარიში" items={accountItems} expanded={expanded} />
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          title={expanded ? undefined : "გასვლა"}
          className="flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold text-rose-400/80 transition-all hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 stroke-[1.75]" />
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden whitespace-nowrap"
              >
                {signingOut ? "გასვლა..." : "გასვლა"}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
