"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BriefcaseBusiness,
  Brain,
  CalendarClock,
  ChevronRight,
  FileSearch,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Sparkles,
  User,
} from "lucide-react";
import { researchPlatformHref } from "@/lib/space-back-navigation";
import { signOutUser } from "@/lib/auth";

interface RailItem {
  id: string;
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const GENERAL_ITEMS: RailItem[] = [
  { id: "dashboard", label: "დეშბორდი", href: "/dashboard-student", icon: LayoutDashboard },
  { id: "study-plan", label: "სასწავლო გეგმა", href: "/study-plan", icon: CalendarClock },
  { id: "quiz", label: "ვიქტორინა", href: "/quiz", icon: Brain },
  { id: "profile", label: "პროფილი", href: "/profile", icon: User },
];

const TOOL_ITEMS: RailItem[] = [
  { id: "ai-teacher", label: "AI მასწავლებელი", href: "/ai-teacher", icon: MessageSquareText },
  { id: "research", label: "მასალა → ანალიზი", href: researchPlatformHref("student"), icon: FileSearch },
  { id: "presentation", label: "AI პრეზენტაცია", href: "/presentation", icon: Sparkles },
  { id: "cv", label: "CV გენერატორი", href: "/cv", icon: BriefcaseBusiness },
  { id: "syllabus", label: "სილაბუსი", href: "/syllabus", icon: GraduationCap },
];

function RailLink({ item, expanded, active }: { item: RailItem; expanded: boolean; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={expanded ? undefined : item.label}
      className={`group relative flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-white text-black"
          : "text-white/60 hover:bg-white/10 hover:text-white"
      }`}
    >
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
    </Link>
  );
}

export function DashboardSideRail() {
  const [expanded, setExpanded] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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
    <motion.aside
      animate={{ width: expanded ? 232 : 76 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="sticky top-24 hidden h-fit shrink-0 self-start overflow-hidden rounded-[28px] bg-[#0b0b0e] p-3 shadow-[0_12px_32px_rgba(0,0,0,0.35)] lg:flex lg:flex-col"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mb-3 flex h-10 w-10 items-center justify-center self-start rounded-full bg-white/10 text-white/70 transition-all hover:bg-white/20 hover:text-white"
        aria-label={expanded ? "მენიუს ჩაკეცვა" : "მენიუს გამოწევა"}
      >
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight className="h-4 w-4 stroke-[2]" />
        </motion.span>
      </button>

      <div className="flex flex-col gap-1">
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-white/30"
            >
              ზოგადი
            </motion.p>
          )}
        </AnimatePresence>
        {GENERAL_ITEMS.map((item) => (
          <RailLink key={item.id} item={item} expanded={expanded} active={pathname === item.href} />
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-1 border-t border-white/10 pt-4">
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-white/30"
            >
              ხელსაწყოები
            </motion.p>
          )}
        </AnimatePresence>
        {TOOL_ITEMS.map((item) => (
          <RailLink key={item.id} item={item} expanded={expanded} active={pathname === item.href} />
        ))}
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
