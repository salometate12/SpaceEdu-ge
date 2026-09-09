import { Star } from "lucide-react";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Sparkle } from "./notebook/Doodles";
import {
  ACCENT_PILL,
  ACCENT_TEXT,
  PLAIN_CARD,
  type NotebookAccent,
} from "./notebook/accents";

interface TestimonialItem {
  id: string;
  text: string;
  author: string;
  role: string;
  initials: string;
  accent: NotebookAccent;
  rating: number;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: "t1",
    text: "სასწავლო გეგმამ ყველაფერი მოაწესრიგა. ეროვნულებისთვის მომზადება ნათელი და სტრუქტურირებული გახდა.",
    author: "გიორგი მ.",
    role: "ეროვნულები",
    initials: "გმ",
    accent: "violet",
    rating: 5,
  },
  {
    id: "t2",
    text: "Quiz რეჟიმმა და კონსპექტების გენერატორმა სემესტრის განმავლობაში ყველაზე სასარგებლო ინსტრუმენტი გამოდგა.",
    author: "მარიამ კ.",
    role: "სტუდენტი",
    initials: "მკ",
    accent: "green",
    rating: 5,
  },
  {
    id: "t3",
    text: "ELI5 ახსნები და AI მასწავლებელი რთულ თემებზე ყოველთვის სასარგებლო აღმოჩნდა გამოცდის წინ.",
    author: "ანა გ.",
    role: "აბიტურიენტი",
    initials: "აგ",
    accent: "pink",
    rating: 4,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} ვარსკვლავი`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < rating
              ? "fill-amber-400 text-amber-500"
              : "text-slate-300 dark:text-slate-600"
          }`}
          aria-hidden
        />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20"
    >
      <Sparkle className="pointer-events-none absolute left-8 top-14 hidden h-5 w-5 rotate-12 text-violet-400 xl:block" />

      <div className="mx-auto mb-12 max-w-2xl text-center">
        <p
          className={`text-[10px] font-bold uppercase tracking-wider ${ACCENT_TEXT.violet}`}
        >
          გამოცდილებები
        </p>
        <h2 className="headline mt-2 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-50">
          რას ამბობენ ჩვენი მომხმარებლები
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-700 sm:text-base dark:text-slate-300">
          აბიტურიენტები და სტუდენტები SpaceEdu-ს რეალურ სწავლის პროცესში იყენებენ.
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-3">
        {TESTIMONIALS.map((item, index) => (
          <RevealOnScroll key={item.id} delayMs={90 * (index + 1)}>
            <article
              className={`flex h-full flex-col justify-between rounded-2xl border-2 p-6 transition-transform duration-300 hover:-translate-y-1 ${PLAIN_CARD}`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${ACCENT_PILL[item.accent]}`}
                  aria-hidden
                >
                  {item.initials}
                </div>
                <StarRating rating={item.rating} />
              </div>
              <p className="mb-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {item.text}
              </p>
              <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                {item.author}, {item.role}
              </p>
            </article>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
