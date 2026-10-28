import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { LANDING_CARD, SectionHeading, TILE, type TileColor } from "./SectionHeading";

const STEPS: { id: string; title: string; body: string; color: TileColor }[] = [
  {
    id: "1",
    title: "აირჩიე შენი სივრცე",
    body: "აბიტურიენტი თუ სტუდენტი: SpaceEdu შენს საგნებსა და პროგრამას მოერგება.",
    color: "green",
  },
  {
    id: "2",
    title: "შექმენი სასწავლო გეგმა",
    body: "მიუთითე საგნები და გამოცდის თარიღი, AI კი დღეებად დაგიგეგმავს, რა და როდის ისწავლო.",
    color: "yellow",
  },
  {
    id: "3",
    title: "ისწავლე AI მასწავლებელთან",
    body: "დაუსვი კითხვები, გაიარე ქვიზები და მიიღე მარტივი ახსნა, სანამ თემას ბოლომდე არ გაიგებ.",
    color: "pink",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 py-14 sm:py-20">
      <SectionHeading title="როგორ მუშაობს SpaceEdu" subtitle="სამი მარტივი ნაბიჯი" />
      <ol className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <RevealOnScroll key={step.id} delayMs={100 * (index + 1)} className="h-full">
            <li className={`${LANDING_CARD} h-full p-[26px]`}>
              <span
                aria-hidden
                className={`flex h-10 w-10 items-center justify-center rounded-full text-[16px] font-bold ${TILE[step.color]}`}
              >
                {step.id}
              </span>
              <h3 className="mt-4 text-[19px] font-bold text-[var(--ld-title)]">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--ld-text)]">{step.body}</p>
            </li>
          </RevealOnScroll>
        ))}
      </ol>
    </section>
  );
}
