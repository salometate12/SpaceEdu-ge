import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Calculator, Copy, FileText, Lightbulb, MessageSquareText, RotateCw } from "lucide-react";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { LANDING_CARD, SectionHeading, TILE, type TileColor } from "./SectionHeading";

/** Only tools that exist; colours as on the dashboard's tool cards. */
const TOOLS: { id: string; title: string; body: string; icon: LucideIcon; color: TileColor }[] = [
  {
    id: "quiz",
    title: "ქვიზი",
    body: "ატვირთე PDF ან ფაილი და მიიღე ქვიზი, რომელიც სუსტ ადგილებს გაჩვენებს.",
    icon: RotateCw,
    color: "teal",
  },
  {
    id: "ai-teacher",
    title: "AI მასწავლებელი",
    body: "ვერ გაიგე თემა? ჰკითხე და აგიხსნის, ნებისმიერ დროს.",
    icon: MessageSquareText,
    color: "green",
  },
  {
    id: "conspectus",
    title: "კონსპექტი",
    body: "გრძელი მასალიდან მოკლე და მოწესრიგებული კონსპექტი წამებში.",
    icon: FileText,
    color: "yellow",
  },
  {
    id: "eli5",
    title: "ELI5 ახსნა",
    body: "რთული თემა ისე, რომ ბავშვსაც გაეგება.",
    icon: Lightbulb,
    color: "blue",
  },
  {
    id: "flashcards",
    title: "ფლეშქარდები",
    body: "დაიმახსოვრე მთავარი ცნებები ბარათებით, რომლებსაც AI PDF ფაილიდან, ტექსტიდან ან YouTube ვიდეოდან შექმნის.",
    icon: Copy,
    color: "orange",
  },
  {
    id: "score-calculator",
    title: "ქულის კალკულატორი",
    body: "გამოთვალე მოსალოდნელი ქულა და ნახე, რომელ უნივერსიტეტსა და პროგრამაზე გაქვს ჩარიცხვის შანსი.",
    icon: Calculator,
    color: "pink",
  },
];

/** A small static picture of the plan: three days, today outlined. */
const PLAN_DAYS = [
  { day: "ორშ", topic: "ელასტიურობა", hours: "2 სთ", today: false },
  { day: "სამ", topic: "ბაზრის წონასწორობა", hours: "1.5 სთ", today: true },
  { day: "ოთხ", topic: "ქვიზი და გამეორება", hours: "1 სთ", today: false },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 py-14 sm:py-20">
      <SectionHeading
        title={
          <>
            შენი სასწავლო <span className="mark-pink">ხელსაწყოები</span>
          </>
        }
        subtitle="ყველაფერი, რაც სწავლისთვის დაგჭირდება, ერთ სივრცეში"
      />

      <RevealOnScroll>
        <article className={`${LANDING_CARD} grid grid-cols-1 items-center gap-8 p-6 sm:p-8 md:grid-cols-2`}>
          <div className="min-w-0">
            <span className="inline-flex h-8 items-center rounded-full bg-[var(--ld-pink-bg)] px-3.5 text-[13px] font-semibold text-[var(--ld-pink)]">
              მთავარი ხელსაწყო
            </span>
            <h3 className="mt-4 text-[24px] font-bold text-[var(--ld-title)] sm:text-[26px]">სასწავლო გეგმა</h3>
            <p className="mt-2 max-w-md text-[15px] leading-relaxed text-[var(--ld-text)]">
              დაგეგმე სწავლა საგნების მიხედვით და მიჰყევი დღიდან დღემდე. ყოველთვის ხედავ, რა გელოდება დღეს, ამ კვირაში და
              გამოცდამდე.
            </p>
            <Link
              href="/select-space"
              className="ld-primary ld-focus mt-5 inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-semibold transition-colors"
            >
              გეგმის შექმნა
              <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
            </Link>
          </div>
          <div aria-hidden className="flex flex-col gap-2.5">
            {PLAN_DAYS.map((item) => (
              <div
                key={item.day}
                className={`flex items-center gap-3 rounded-[16px] bg-[var(--ld-bg)] px-4 py-3 ${
                  item.today ? "border-2 border-[var(--ld-title)]" : "border border-[var(--ld-card-border)]"
                }`}
              >
                <span className="w-9 shrink-0 text-[13px] font-semibold text-[var(--ld-muted)]">{item.day}</span>
                <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[var(--ld-title)]">{item.topic}</span>
                <span className="shrink-0 text-[13px] text-[var(--ld-muted)]">{item.hours}</span>
              </div>
            ))}
          </div>
        </article>
      </RevealOnScroll>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <RevealOnScroll key={tool.id} delayMs={60 * (index + 1)} className="h-full">
              <article className={`${LANDING_CARD} h-full p-6`}>
                <span aria-hidden className={`flex h-11 w-11 items-center justify-center rounded-[12px] ${TILE[tool.color]}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-4 text-[17px] font-bold text-[var(--ld-title)]">{tool.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--ld-text)]">{tool.body}</p>
              </article>
            </RevealOnScroll>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href="/select-space"
          className="ld-secondary ld-focus inline-flex h-12 items-center gap-2 rounded-full px-7 text-[15px] font-semibold transition-colors"
        >
          ყველა ხელსაწყო
          <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
