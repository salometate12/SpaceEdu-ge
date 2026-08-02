import { Star } from "lucide-react";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

interface TestimonialItem {
  id: string;
  text: string;
  author: string;
  role: string;
  initials: string;
  color: string;
  rating: number;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: "t1",
    text: "სასწავლო გეგმამ ყველაფერი მოაწესრიგა. ეროვნულებისთვის მომზადება ნათელი და სტრუქტურირებული გახდა.",
    author: "გიორგი მ.",
    role: "ეროვნულები",
    initials: "გმ",
    color: "linear-gradient(135deg, #a78bfa, #7c3aed)",
    rating: 5,
  },
  {
    id: "t2",
    text: "Quiz რეჟიმმა და კონსპექტების გენერატორმა სემესტრის განმავლობაში ყველაზე სასარგებლო ინსტრუმენტი გამოდგა.",
    author: "მარიამ კ.",
    role: "სტუდენტი",
    initials: "მკ",
    color: "linear-gradient(135deg, #2dd4bf, #0891b2)",
    rating: 5,
  },
  {
    id: "t3",
    text: "ELI5 ახსნები და AI მასწავლებელი რთულ თემებზე ყოველთვის სასარგებლო აღმოჩნდა გამოცდის წინ.",
    author: "ანა გ.",
    role: "აბიტურიენტი",
    initials: "აგ",
    color: "linear-gradient(135deg, #f472b6, #c026d3)",
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
            index < rating ? "fill-amber-400 text-amber-400" : "text-gray-700"
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
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-400/90">
          გამოცდილებები
        </p>
        <h2 className="headline mt-2 text-2xl font-bold text-white sm:text-3xl">
          რას ამბობენ ჩვენი მომხმარებლები
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-400 sm:text-base">
          აბიტურიენტები და სტუდენტები SpaceEdu-ს რეალურ სწავლის პროცესში იყენებენ.
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-3">
        {TESTIMONIALS.map((item, idx) => (
          <RevealOnScroll key={item.id} delayMs={90 * (idx + 1)}>
            <article className="flex h-full flex-col justify-between rounded-2xl border border-white/[0.06] bg-[#121214]/40 p-6 backdrop-blur-xl transition-all duration-300 hover:border-purple-500/30 hover:bg-[#121214]/60">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
                  style={{ background: item.color }}
                  aria-hidden
                >
                  {item.initials}
                </div>
                <StarRating rating={item.rating} />
              </div>
              <p className="mb-4 text-sm leading-relaxed text-gray-300">{item.text}</p>
              <p className="text-xs font-medium tracking-wide text-gray-500">
                {item.author}, {item.role}
              </p>
            </article>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
