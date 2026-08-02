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

interface ToolCard {
  id: string;
  kicker?: string;
  title: string;
  body: string;
  icon: LucideIcon;
  color: string;
  featured?: boolean;
}

const SIDE_TOOLS: ToolCard[] = [
  {
    id: "quiz",
    title: "Active Recall Quiz",
    body: "ქვიზები, რომლებიც გახსოვნებას ამყარებენ და სუსტ ადგილებს გაჩვენებენ.",
    icon: RotateCw,
    color: "#22d3ee",
  },
  {
    id: "ai-teacher",
    title: "AI მასწავლებელი",
    body: "პასუხობს კითხვებს ბუნებრივ ენაზე, ნებისმიერ საათზე.",
    icon: MessageSquare,
    color: "#10b981",
  },
];

const MID_TOOLS: ToolCard[] = [
  {
    id: "conspectus",
    title: "კონსპექტი",
    body: "გრძელი მასალიდან მოკლე, სტრუქტურირებული კონსპექტი წამებში.",
    icon: FileText,
    color: "#f59e0b",
  },
  {
    id: "eli5",
    title: "ELI5",
    body: "რთული თემები ახსნილი უმარტივესად, გასაგები ენით.",
    icon: Lightbulb,
    color: "#f472b6",
  },
  {
    id: "flashcards",
    title: "ფლეშქარდები",
    body: "ავტომატურად გენერირებული ბარათები გამეორებისთვის.",
    icon: Copy,
    color: "#2dd4bf",
  },
];

const SMALL_TOOLS: ToolCard[] = [
  {
    id: "pdf-to-test",
    title: "PDF → ტესტი",
    body: "ატვირთე PDF და AI ავტომატურად შეადგენს ტესტურ კითხვებს მისი შინაარსიდან.",
    icon: FileCheck2,
    color: "#6366f1",
  },
  {
    id: "flashcards-any-source",
    title: "ფლეშქარდები ნებისმიერი წყაროდან",
    body: "დაამატე PDF, ბმული ან YouTube ვიდეო — AI გამოყოფს საკვანძო საკითხებს ბარათებად.",
    icon: Video,
    color: "#fb7185",
  },
  {
    id: "score-calculator",
    title: "გამოცდის ქულის კალკულატორი",
    body: "გამოთვალე მოსალოდნელი ჯამური ქულა საგნების მიხედვით და თარგმნე ის ჩარიცხვის შანსში.",
    icon: Calculator,
    color: "#a3e635",
  },
  {
    id: "program-picker",
    title: "პროგრამის შესარჩევი",
    body: "შენი ქულების მიხედვით ხედავ, რომელ უნივერსიტეტსა და პროგრამაზე გაქვს ჩარიცხვის საშუალება.",
    icon: GraduationCap,
    color: "#f59e0b",
  },
];

function ToolTile({ tool, className = "" }: { tool: ToolCard; className?: string }) {
  const Icon = tool.icon;
  return (
    <article
      className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border bg-[#121214]/40 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${className}`}
      style={{ borderColor: `${tool.color}30` }}
    >
      <div>
        <div
          className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border"
          style={{
            borderColor: `${tool.color}45`,
            backgroundColor: `${tool.color}14`,
            color: tool.color,
          }}
        >
          <Icon className="h-4 w-4 stroke-[1.75]" aria-hidden />
        </div>
        {tool.kicker && (
          <p
            className="mono mb-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: tool.color }}
          >
            {tool.kicker}
          </p>
        )}
        <h3
          className={`mb-2 font-bold text-white ${tool.featured ? "text-xl" : "text-sm"}`}
        >
          {tool.title}
        </h3>
        <p className="text-xs leading-relaxed text-gray-400 sm:text-sm">{tool.body}</p>
      </div>
    </article>
  );
}

export function Features() {
  return (
    <section id="features" className="relative mx-auto w-full max-w-7xl py-16 sm:py-20">
      <div className="mx-auto mb-10 max-w-2xl px-4 text-center sm:px-6">
        <h2 className="headline text-2xl font-bold text-white sm:text-3xl">
          შენი სასწავლო არსენალი
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-400 sm:text-base">
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
                color: "#a78bfa",
                featured: true,
              }}
              className="min-h-[220px] bg-gradient-to-br from-purple-500/[0.1] via-[#121214]/40 to-[#121214]/40"
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
          className="group relative flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-8 py-4 text-sm font-semibold text-gray-200 backdrop-blur-md transition-all duration-300 hover:border-purple-500/40 hover:bg-white/[0.05] hover:text-white hover:shadow-[0_0_25px_rgba(168,85,247,0.2)]"
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
