import { BookOpen, PenLine, RotateCcw, Timer, TrendingUp } from "lucide-react";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

const SECONDARY_CARDS = [
  {
    title: "თემის წერის დახვეწა",
    body: "AI ანალიზებს არგუმენტაციას, სტრუქტურასა და სტილს და გთავაზობს კონკრეტულ შესწორებებს.",
    icon: PenLine,
    color: "#f59e0b",
  },
  {
    title: "სისტემური გამეორება",
    body: "სუსტი თემები ბრუნდება ზუსტად მაშინ, სანამ დაგავიწყდება — Spaced Repetition ალგორითმით.",
    icon: RotateCcw,
    color: "#22d3ee",
  },
  {
    title: "ბიბლიოთეკა და მასალები",
    body: "წარსული წლების ტესტები, სახელმძღვანელოები და თემატური მასალა საგნების მიხედვით.",
    icon: BookOpen,
    color: "#f472b6",
  },
  {
    title: "პროგრესის თრექინგი",
    body: "ხედავ ზუსტად რომელ საგანსა თუ თემაში გჭირდება საჯირო, გამოცდამდე.",
    icon: TrendingUp,
    color: "#f59e0b",
  },
];

export function AbiturientCenter() {
  return (
    <section id="exam" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto mb-10 max-w-2xl">
        <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/[0.06] px-4 py-1.5 text-xs font-semibold text-amber-300">
          ერთიანი ეროვნული გამოცდები
        </span>
        <h2 className="headline mt-4 text-2xl font-bold text-white sm:text-3xl">
          აბიტურიენტის ცენტრი
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-400 sm:text-base">
          ყველაფერი, რაც დაგჭირდება ერთიან ეროვნულებზე მოსამზადებლად — ერთ სივრცეში
        </p>
      </div>

      <RevealOnScroll>
        <article className="relative mb-6 overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] via-[#121214]/50 to-[#121214]/50 p-8 backdrop-blur-xl transition-all duration-300 hover:border-amber-500/40">
          <div
            className="pointer-events-none absolute -right-10 top-1/2 -z-0 h-[220px] w-[280px] -translate-y-1/2 rounded-full bg-amber-500/15 blur-[90px]"
            aria-hidden
          />
          <div className="relative z-[1]">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <Timer className="h-5 w-5 stroke-[1.75]" aria-hidden />
            </div>
            <p className="mono text-xs font-bold uppercase tracking-wider text-amber-400">
              MOCK EXAM
            </p>
            <h3 className="mt-1.5 text-xl font-bold text-amber-200 sm:text-2xl">
              გამოცდის სრული იმიტირება
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
              გაიარე რეალური ფორმატისა და დროის მიმდევრობის საცდელი გამოცდები საგნების
              მიხედვით — შეაფასე შენი მზადყოფნა ზუსტად ისეთ პირობებში, როგორშიც ჩააბარებ.
            </p>
          </div>
        </article>
      </RevealOnScroll>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SECONDARY_CARDS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <RevealOnScroll key={card.title} delayMs={80 * (idx + 1)}>
              <article
                className="group h-full rounded-2xl border bg-[#121214]/40 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1"
                style={{ borderColor: `${card.color}30` }}
              >
                <div
                  className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `${card.color}40`,
                    backgroundColor: `${card.color}14`,
                    color: card.color,
                  }}
                >
                  <Icon className="h-4 w-4 stroke-[1.75]" aria-hidden />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white">{card.title}</h3>
                <p className="text-xs leading-relaxed text-gray-400">{card.body}</p>
              </article>
            </RevealOnScroll>
          );
        })}
      </div>
    </section>
  );
}
