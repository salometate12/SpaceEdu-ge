import type { LucideIcon } from "lucide-react";
import {
  Brain,
  Calendar,
  FileText,
  Layers,
  MessageSquare,
  MoveRight,
  PenTool,
} from "lucide-react";
import Link from "next/link";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

interface FeatureCard {
  id: string;
  title: string;
  body: string;
  icon: LucideIcon;
  colSpan: "md:col-span-2" | "md:col-span-1";
  cardClass: string;
  iconClass: string;
}

const FEATURES: FeatureCard[] = [
  {
    id: "study-plan",
    title: "სასწავლო გეგმა",
    body: "შეიყვანე გამოცდის თარიღი და მიიღე დღეებზე გაწერილი პერსონალური გეგმა.",
    icon: Calendar,
    colSpan: "md:col-span-2",
    cardClass:
      "border-purple-500/20 hover:border-purple-500/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]",
    iconClass: "text-purple-400 group-hover:text-purple-300 group-hover:border-purple-500/30",
  },
  {
    id: "quiz",
    title: "Active Recall Quiz",
    body: "ავტომატურად გენერირებული კითხვები შენივე მასალებიდან სუსტი წერტილების აღმოსაჩენად.",
    icon: Brain,
    colSpan: "md:col-span-1",
    cardClass:
      "border-cyan-500/20 hover:border-cyan-500/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]",
    iconClass: "text-cyan-400 group-hover:text-cyan-300 group-hover:border-cyan-500/30",
  },
  {
    id: "ai-teacher",
    title: "AI მასწავლებელი",
    body: "24/7 ინტერაქტიული კითხვა-პასუხი ქართულად, რეალური მაგალითებითა და დეტალური ახსნით.",
    icon: MessageSquare,
    colSpan: "md:col-span-1",
    cardClass:
      "border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]",
    iconClass:
      "text-emerald-400 group-hover:text-emerald-300 group-hover:border-emerald-500/30",
  },
  {
    id: "conspectus-eli5",
    title: "კონსპექტი + ELI5",
    body: "ნებისმიერი სირთულის PDF მასალის მომენტალური შეჯამება და უმარტივეს ენაზე ახსნა.",
    icon: FileText,
    colSpan: "md:col-span-2",
    cardClass:
      "border-amber-500/20 hover:border-amber-500/50 hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]",
    iconClass: "text-amber-400 group-hover:text-amber-300 group-hover:border-amber-500/30",
  },
  {
    id: "arguments-bank",
    title: "არგუმენტების ბანკი",
    body: "ყველა საჭირო ლიტერატურული პარალელი და მყარი არგუმენტი ერთ სივრცეში, თემების მიხედვით ორგანიზებული.",
    icon: Layers,
    colSpan: "md:col-span-2",
    cardClass:
      "border-fuchsia-500/20 hover:border-fuchsia-500/50 hover:shadow-[0_0_25px_rgba(217,70,239,0.15)]",
    iconClass:
      "text-fuchsia-400 group-hover:text-fuchsia-300 group-hover:border-fuchsia-500/30",
  },
  {
    id: "essay-simulator",
    title: "ესეების სიმულატორი",
    body: "დაწერე ესე, მიიღე მომენტალური შეფასება კრიტერიუმების მიხედვით და გაასწორე შეცდომები რეალურ დროში.",
    icon: PenTool,
    colSpan: "md:col-span-1",
    cardClass:
      "border-indigo-500/20 hover:border-indigo-500/50 hover:shadow-[0_0_25px_rgba(99,102,241,0.15)]",
    iconClass: "text-indigo-400 group-hover:text-indigo-300 group-hover:border-indigo-500/30",
  },
];

function FeatureBentoCard({ feature, delayMs }: { feature: FeatureCard; delayMs: number }) {
  const Icon = feature.icon;

  return (
    <RevealOnScroll delayMs={delayMs} className={feature.colSpan}>
      <article
        className={`group relative flex h-full min-h-[200px] flex-col justify-between overflow-hidden rounded-2xl border bg-[#121214]/30 p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${feature.cardClass}`}
      >
        <div>
          <div
            className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-inherit transition-colors ${feature.iconClass}`}
          >
            <Icon className="h-5 w-5 stroke-[1.5]" aria-hidden />
          </div>
          <h3 className="mb-2 text-lg font-bold text-white">{feature.title}</h3>
          <p className="text-sm leading-relaxed text-gray-400">{feature.body}</p>
        </div>
      </article>
    </RevealOnScroll>
  );
}

export function Features() {
  return (
    <section id="features" className="relative mx-auto w-full max-w-7xl py-16 sm:py-20">
      <div className="mx-auto mb-10 max-w-2xl px-4 text-center sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-400/90">
          ინსტრუმენტები
        </p>
        <h2 className="headline mt-2 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
          ფუნქციები
        </h2>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 md:grid-cols-3">
        {FEATURES.map((feature, idx) => (
          <FeatureBentoCard key={feature.id} feature={feature} delayMs={90 * (idx + 1)} />
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <Link
          href="/select-space"
          className="group relative flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-8 py-4 text-sm font-semibold text-gray-200 backdrop-blur-md transition-all duration-300 hover:border-purple-500/40 hover:bg-white/[0.05] hover:text-white hover:shadow-[0_0_25px_rgba(168,85,247,0.2)]"
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
