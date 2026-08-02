import type { CSSProperties } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { DECOR_3D_ICON_PX, decor3dIconClassName } from "@/lib/decor-3d-icon";

interface TestimonialItem {
  id: string;
  text: string;
  author: string;
  initials: string;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: "t1",
    text: "AI მასწავლებელმა ბიოლოგიაში 5-ზე გადამიყვანა. კონსპექტები და ქვიზები ზუსტად ჩემს სივრცეზეა მორგებული.",
    author: "ნინო ბ., მე-12 კლასი",
    initials: "ნბ",
  },
  {
    id: "t2",
    text: "სასწავლო გეგმა ყველაფერი მოაწესრიგა. ეროვნულებისთვის მომზადება ნათელი და სტრუქტურირებული გახდა.",
    author: "გიორგი მ., ეროვნულები",
    initials: "გმ",
  },
  {
    id: "t3",
    text: "Quiz რეჟიმი და PDF ანალიზი სემესტრის განმავლობაში ყველაზე სასარგებლო ინსტრუმენტი გამოვიდა.",
    author: "მარიამ კ., სტუდენტი",
    initials: "მკ",
  },
  {
    id: "t4",
    text: "ლიტერატურის ასისტენტი და პარალელების მატრიცა გამოცდის მომზადებაში ძალიან სასარგებლოა.",
    author: "ანა გ., აბიტურიენტი",
    initials: "აგ",
  },
  {
    id: "t5",
    text: "სილაბუსის ანალიზატორმა კვირების დაგეგმვა ავტომატურად გაამარტივა. კალენდარში ყველაფერი ერთი ხელის მოძრაობით.",
    author: "ლუკა თ., სტუდენტი",
    initials: "ლთ",
  },
];

/** Duplicated inline for seamless -50% marquee loop */
const MARQUEE_ITEMS = [...TESTIMONIALS, ...TESTIMONIALS];

function StarRating() {
  return (
    <div className="flex items-center gap-0.5" aria-label="5 ვარსკვლავი">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className="h-4 w-4 fill-amber-400 text-amber-400"
          aria-hidden
        />
      ))}
    </div>
  );
}

function TestimonialCard({ item }: { item: TestimonialItem }) {
  return (
    <article className="mx-3 flex w-[360px] max-w-[85vw] shrink-0 flex-col justify-between rounded-2xl border border-white/[0.06] bg-[#121214]/30 p-6 backdrop-blur-xl transition-all duration-300 hover:border-purple-500/30 hover:bg-[#121214]/50">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 p-2.5 text-sm font-semibold text-purple-400"
          aria-hidden
        >
          {item.initials}
        </div>
        <StarRating />
      </div>
      <p className="mb-4 text-sm font-normal leading-relaxed text-gray-300">
        {item.text}
      </p>
      <p className="text-xs font-medium tracking-wide text-gray-500">{item.author}</p>
    </article>
  );
}

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="relative z-10 mx-auto w-full max-w-7xl overflow-hidden px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="relative mx-auto mb-16 min-h-[200px] max-w-6xl overflow-visible px-4 pb-6 pt-10 sm:px-8">
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[200px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/5 blur-[100px]"
          aria-hidden
        />

        <Image
          src="/3d-icons/dashboard-cap.png"
          alt=""
          width={DECOR_3D_ICON_PX}
          height={DECOR_3D_ICON_PX}
          aria-hidden
          className={`${decor3dIconClassName} absolute -bottom-2 -left-1 z-0 hidden transition-transform duration-300 animate-float-soft md:block`}
        />

        <Image
          src="/3d-icons/study-books.png"
          alt=""
          width={DECOR_3D_ICON_PX}
          height={DECOR_3D_ICON_PX}
          aria-hidden
          className={`${decor3dIconClassName} absolute -bottom-2 -right-1 z-0 hidden transition-transform duration-300 animate-float-soft-delayed md:block`}
        />

        <div className="relative z-10 mx-auto max-w-2xl px-2 text-center sm:px-16 md:px-28">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-400/90">
            გამოცდილებები
          </p>
          <h2 className="headline mb-4 mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            რას ამბობენ ჩვენი მომხმარებლები
          </h2>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-gray-400">
            აბიტურიენტები და სტუდენტები SpaceEdu-ს რეალურ სწავლის პროცესში იყენებენ.
          </p>
        </div>
      </div>

      <div className="relative z-10 w-full overflow-hidden">
        <div
          className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-[#09090b] to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-[#09090b] to-transparent"
          aria-hidden
        />

        <div
          className="animate-marquee flex w-max hover:[animation-play-state:paused]"
          style={{ "--marquee-duration": "48s" } as CSSProperties}
        >
          {MARQUEE_ITEMS.map((item, index) => (
            <TestimonialCard key={`${item.id}-${index}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
