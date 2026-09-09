import { BookOpen, PenLine, RotateCcw, Timer, TrendingUp } from "lucide-react";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Mountains, Sparkle } from "./notebook/Doodles";
import {
  ACCENT_CARD,
  ACCENT_PILL,
  ACCENT_TEXT,
  type NotebookAccent,
} from "./notebook/accents";

const SECONDARY_CARDS: {
  title: string;
  body: string;
  icon: typeof PenLine;
  accent: NotebookAccent;
}[] = [
  {
    title: "თემის წერის დახვეწა",
    body: "AI ანალიზებს არგუმენტაციას, სტრუქტურასა და სტილს და გთავაზობს კონკრეტულ შესწორებებს.",
    icon: PenLine,
    accent: "amber",
  },
  {
    title: "სისტემური გამეორება",
    body: "სუსტი თემები ბრუნდება ზუსტად მაშინ, სანამ დაგავიწყდება — Spaced Repetition ალგორითმით.",
    icon: RotateCcw,
    accent: "blue",
  },
  {
    title: "ბიბლიოთეკა და მასალები",
    body: "წარსული წლების ტესტები, სახელმძღვანელოები და თემატური მასალა საგნების მიხედვით.",
    icon: BookOpen,
    accent: "pink",
  },
  {
    title: "პროგრესის თრექინგი",
    body: "ხედავ ზუსტად რომელ საგანსა თუ თემაში გჭირდება საჯირო, გამოცდამდე.",
    icon: TrendingUp,
    accent: "green",
  },
];

export function AbiturientCenter() {
  return (
    <section
      id="exam"
      className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20"
    >
      <Mountains className="pointer-events-none absolute right-6 top-12 hidden w-28 text-slate-400 xl:block dark:text-slate-500" />
      <Sparkle className="pointer-events-none absolute left-6 top-24 hidden h-5 w-5 rotate-12 text-amber-400 xl:block" />

      <div className="mx-auto mb-10 max-w-2xl">
        <span
          className={`inline-flex items-center rounded-full border-2 px-4 py-1.5 text-xs font-bold ${ACCENT_PILL.amber}`}
        >
          ერთიანი ეროვნული გამოცდები
        </span>
        <h2 className="headline mt-4 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-50">
          აბიტურიენტის ცენტრი
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base dark:text-slate-300">
          ყველაფერი, რაც დაგჭირდება ერთიან ეროვნულებზე მოსამზადებლად — ერთ სივრცეში
        </p>
      </div>

      <RevealOnScroll>
        <article
          className={`mb-5 rounded-2xl border-2 p-8 transition-transform duration-300 hover:-translate-y-1 ${ACCENT_CARD.amber}`}
        >
          <div
            className={`mb-5 flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white/70 dark:bg-white/[0.08] ${ACCENT_CARD.amber}`}
          >
            <Timer className={`h-5 w-5 stroke-[2] ${ACCENT_TEXT.amber}`} aria-hidden />
          </div>
          <p
            className={`mono text-xs font-bold uppercase tracking-wider ${ACCENT_TEXT.amber}`}
          >
            MOCK EXAM
          </p>
          <h3 className="mt-1.5 text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
            გამოცდის სრული იმიტირება
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            გაიარე რეალური ფორმატისა და დროის მიმდევრობის საცდელი გამოცდები საგნების
            მიხედვით — შეაფასე შენი მზადყოფნა ზუსტად ისეთ პირობებში, როგორშიც ჩააბარებ.
          </p>
        </article>
      </RevealOnScroll>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SECONDARY_CARDS.map((card, index) => {
          const Icon = card.icon;
          return (
            <RevealOnScroll key={card.title} delayMs={80 * (index + 1)}>
              <article
                className={`h-full rounded-2xl border-2 p-6 transition-transform duration-300 hover:-translate-y-1 ${ACCENT_CARD[card.accent]}`}
              >
                <div
                  className={`mb-4 flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white/70 dark:bg-white/[0.08] ${ACCENT_CARD[card.accent]}`}
                >
                  <Icon
                    className={`h-4 w-4 stroke-[2] ${ACCENT_TEXT[card.accent]}`}
                    aria-hidden
                  />
                </div>
                <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-slate-50">
                  {card.title}
                </h3>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {card.body}
                </p>
              </article>
            </RevealOnScroll>
          );
        })}
      </div>
    </section>
  );
}
