import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, BookOpen, Calculator, ClipboardCheck, Clock, PenLine } from "lucide-react";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { LANDING_CARD, SectionHeading, TILE, type TileColor } from "./SectionHeading";

const CARDS: { title: string; body: string; icon: LucideIcon; color: TileColor }[] = [
  {
    title: "თემის შეფასება",
    body: "AI შეაფასებს არგუმენტაციას, სტრუქტურასა და სტილს და კონკრეტულ შესწორებებს შემოგთავაზებს.",
    icon: PenLine,
    color: "yellow",
  },
  {
    title: "ღია დავალებების შემოწმება",
    body: "ისტორიაში, მათემატიკაში და სხვა საგნებში AI შენს პასუხს შეფასების სქემით ამოწმებს.",
    icon: ClipboardCheck,
    color: "green",
  },
  {
    title: "წინა წლების ტესტები",
    body: "წარსული წლების საგამოცდო ტესტები საგნების მიხედვით, ერთ ადგილას.",
    icon: BookOpen,
    color: "pink",
  },
  {
    title: "ქულის კალკულატორი",
    body: "გამოთვალე მოსალოდნელი ქულა და ნახე, რომელ პროგრამაზე გაქვს ჩარიცხვის შანსი.",
    icon: Calculator,
    color: "blue",
  },
];

function SmallCard({ card }: { card: (typeof CARDS)[number] }) {
  const Icon = card.icon;
  return (
    <article className={`${LANDING_CARD} h-full p-6`}>
      <span aria-hidden className={`flex h-11 w-11 items-center justify-center rounded-[12px] ${TILE[card.color]}`}>
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <h3 className="mt-4 text-[17px] font-bold text-[var(--ld-title)]">{card.title}</h3>
      <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--ld-text)]">{card.body}</p>
    </article>
  );
}

export function AbiturientCenter() {
  return (
    <section id="exam" className="scroll-mt-24 py-14 sm:py-20">
      <SectionHeading
        eyebrow={
          <span className="inline-flex h-8 items-center rounded-full bg-[var(--ld-yellow-bg)] px-3.5 text-[13px] font-semibold text-[var(--ld-yellow)]">
            ერთიანი ეროვნული გამოცდები
          </span>
        }
        title={
          <>
            აბიტურიენტის <span className="mark-yellow">ცენტრი</span>
          </>
        }
        subtitle="ყველაფერი, რაც ეროვნულებისთვის მოსამზადებლად დაგჭირდება, ერთ სივრცეში."
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <RevealOnScroll className="md:col-span-2">
          <article className="flex h-full flex-col justify-between gap-6 rounded-[24px] bg-[#fef9c3] p-7 text-[#1c1a17] sm:p-8 dark:bg-[rgba(250,204,21,0.14)] dark:text-[#fafaf9]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-[#854d0e] dark:text-[#fde68a]">საცდელი გამოცდა</p>
                <h3 className="mt-1.5 text-[24px] font-bold leading-tight sm:text-[28px]">გამოცდის სიმულაცია</h3>
              </div>
              <span
                aria-hidden
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-semibold tabular-nums text-[#1c1a17]"
              >
                <Clock className="h-3.5 w-3.5" strokeWidth={2.2} />
                02:14:30
              </span>
            </div>
            <p className="max-w-xl text-[15px] leading-relaxed text-[#57534e] dark:text-[#d4d4d8]">
              გაიარე საცდელი გამოცდა საგნების მიხედვით, რეალური ფორმატითა და დროით, და ნახე, რამდენად მზად ხარ.
            </p>
            <Link
              href="/subject/history/past-exams"
              className="ld-primary ld-focus inline-flex h-12 w-fit items-center gap-2 rounded-full px-6 text-[15px] font-semibold transition-colors"
            >
              სცადე სიმულაცია
              <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
            </Link>
          </article>
        </RevealOnScroll>
        {CARDS.map((card, index) => (
          <RevealOnScroll key={card.title} delayMs={80 * (index + 1)} className="h-full">
            <SmallCard card={card} />
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
