import type { LucideIcon } from "lucide-react";
import {
  Calculator,
  Calendar,
  Copy,
  FileCheck2,
  FileText,
  GraduationCap,
  Lightbulb,
  MessageSquare,
  RotateCw,
  Video,
} from "lucide-react";
import Link from "next/link";
import { MoveRight } from "lucide-react";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Pencil, Sparkle } from "./notebook/Doodles";
import { ACCENT_CARD, ACCENT_TEXT, type NotebookAccent } from "./notebook/accents";

interface ToolCard {
  id: string;
  kicker?: string;
  title: string;
  body: string;
  icon: LucideIcon;
  accent: NotebookAccent;
  featured?: boolean;
}

const SIDE_TOOLS: ToolCard[] = [
  {
    id: "quiz",
    title: "Active Recall Quiz",
    body: "ქვიზები, რომლებიც გახსოვნებას ამყარებენ და სუსტ ადგილებს გაჩვენებენ.",
    icon: RotateCw,
    accent: "blue",
  },
  {
    id: "ai-teacher",
    title: "AI მასწავლებელი",
    body: "პასუხობს კითხვებს ბუნებრივ ენაზე, ნებისმიერ საათზე.",
    icon: MessageSquare,
    accent: "green",
  },
];

const MID_TOOLS: ToolCard[] = [
  {
    id: "conspectus",
    title: "კონსპექტი",
    body: "გრძელი მასალიდან მოკლე, სტრუქტურირებული კონსპექტი წამებში.",
    icon: FileText,
    accent: "amber",
  },
  {
    id: "eli5",
    title: "ELI5",
    body: "რთული თემები ახსნილი უმარტივესად, გასაგები ენით.",
    icon: Lightbulb,
    accent: "pink",
  },
  {
    id: "flashcards",
    title: "ფლეშქარდები",
    body: "ავტომატურად გენერირებული ბარათები გამეორებისთვის.",
    icon: Copy,
    accent: "green",
  },
];

const SMALL_TOOLS: ToolCard[] = [
  {
    id: "pdf-to-test",
    title: "PDF → ტესტი",
    body: "ატვირთე PDF და AI ავტომატურად შეადგენს ტესტურ კითხვებს მისი შინაარსიდან.",
    icon: FileCheck2,
    accent: "violet",
  },
  {
    id: "flashcards-any-source",
    title: "ფლეშქარდები ნებისმიერი წყაროდან",
    body: "დაამატე PDF, ბმული ან YouTube ვიდეო — AI გამოყოფს საკვანძო საკითხებს ბარათებად.",
    icon: Video,
    accent: "pink",
  },
  {
    id: "score-calculator",
    title: "გამოცდის ქულის კალკულატორი",
    body: "გამოთვალე მოსალოდნელი ჯამური ქულა საგნების მიხედვით და თარგმნე ის ჩარიცხვის შანსში.",
    icon: Calculator,
    accent: "green",
  },
  {
    id: "program-picker",
    title: "პროგრამის შესარჩევი",
    body: "შენი ქულების მიხედვით ხედავ, რომელ უნივერსიტეტსა და პროგრამაზე გაქვს ჩარიცხვის საშუალება.",
    icon: GraduationCap,
    accent: "amber",
  },
];

function ToolTile({ tool, className = "" }: { tool: ToolCard; className?: string }) {
  const Icon = tool.icon;
  return (
    <article
      className={`flex h-full flex-col justify-between rounded-2xl border-2 p-6 transition-transform duration-300 hover:-translate-y-1 ${ACCENT_CARD[tool.accent]} ${className}`}
    >
      <div>
        <div
          className={`mb-4 flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white/70 dark:bg-white/[0.08] ${ACCENT_CARD[tool.accent]}`}
        >
          <Icon
            className={`h-4 w-4 stroke-[2] ${ACCENT_TEXT[tool.accent]}`}
            aria-hidden
          />
        </div>
        {tool.kicker && (
          <p
            className={`mono mb-1 text-[10px] font-bold uppercase tracking-wider ${ACCENT_TEXT[tool.accent]}`}
          >
            {tool.kicker}
          </p>
        )}
        <h3
          className={`mb-2 font-bold text-slate-900 dark:text-slate-50 ${tool.featured ? "text-xl" : "text-sm"}`}
        >
          {tool.title}
        </h3>
        <p className="text-xs leading-relaxed text-slate-700 sm:text-sm dark:text-slate-300">
          {tool.body}
        </p>
      </div>
    </article>
  );
}

export function Features() {
  return (
    <section id="features" className="relative mx-auto w-full max-w-7xl py-16 sm:py-20">
      <Pencil className="pointer-events-none absolute left-6 top-14 hidden h-12 w-12 rotate-12 text-amber-600/70 xl:block dark:text-amber-400/60" />
      <Sparkle className="pointer-events-none absolute right-8 top-16 hidden h-5 w-5 -rotate-12 text-sky-400 xl:block" />

      <div className="mx-auto mb-10 max-w-2xl px-4 text-center sm:px-6">
        <h2 className="headline text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-50">
          შენი სასწავლო არსენალი
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base dark:text-slate-300">
          ყველა ინსტრუმენტი, რომელიც დაგჭირდება — ერთ სივრცეში
        </p>
      </div>

      <div className="mx-auto max-w-6xl space-y-4 px-4">
        <RevealOnScroll>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.7fr_1fr]">
            <ToolTile
              tool={{
                id: "study-plan",
                kicker: "მთავარი ინსტრუმენტი",
                title: "სასწავლო გეგმა",
                body: "კვირეული გეგმა შენი მიზნების მიხედვით, ავტომატურად განახლებადი — ხედავ ზუსტად რა გელოდება დღეს, კვირაში და გამოცდამდე.",
                icon: Calendar,
                accent: "violet",
                featured: true,
              }}
              className="min-h-[220px]"
            />
            <div className="grid grid-cols-1 gap-4">
              {SIDE_TOOLS.map((tool) => (
                <ToolTile key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delayMs={80}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {MID_TOOLS.map((tool) => (
              <ToolTile key={tool.id} tool={tool} />
            ))}
          </div>
        </RevealOnScroll>

        <RevealOnScroll delayMs={140}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SMALL_TOOLS.map((tool) => (
              <ToolTile key={tool.id} tool={tool} />
            ))}
          </div>
        </RevealOnScroll>
      </div>

      <div className="mt-12 flex justify-center">
        <Link
          href="/select-space"
          className="group flex items-center gap-2 rounded-full border-2 border-slate-400 bg-white/60 px-8 py-4 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-600 hover:text-slate-900 dark:border-white/20 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:border-white/40 dark:hover:text-white"
        >
          ყველა ფუნქციის ნახვა
          <MoveRight
            className="h-4 w-4 stroke-[2] transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden
          />
        </Link>
      </div>
    </section>
  );
}
