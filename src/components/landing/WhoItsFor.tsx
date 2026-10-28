import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { SectionHeading } from "./SectionHeading";

interface AudienceCard {
  id: string;
  title: string;
  body: string;
  tag: string;
  bar: string;
  /** Not open yet: a „მალე“ pill and the closed card's look. */
  soon?: boolean;
}

/** As on „აირჩიე შენი სივრცე“: a colour bar per space. */
const AUDIENCES: AudienceCard[] = [
  {
    id: "school",
    title: "სკოლა",
    body: "საშინაო დავალებები და გაკვეთილებისთვის მომზადება ერთ ადგილას.",
    tag: "უფროსკლასელებისთვის",
    bar: "bg-[#4ade80] opacity-60",
    soon: true,
  },
  {
    id: "exams",
    title: "გამოცდები",
    body: "მოემზადე ეროვნული გამოცდებისთვის მოწესრიგებული გეგმით.",
    tag: "ეროვნული გამოცდები",
    bar: "bg-[#facc15]",
  },
  {
    id: "university",
    title: "უნივერსიტეტი",
    body: "რთულ საგნებში სწრაფად გაერკვევი AI მასწავლებლითა და კონსპექტებით.",
    tag: "ბაკალავრიატი, მაგისტრატურა",
    bar: "bg-[#ec4899]",
  },
];

export function WhoItsFor() {
  return (
    <section id="audience" className="scroll-mt-24 py-14 sm:py-20">
      <SectionHeading title="ვისთვისაა SpaceEdu" subtitle="ერთი პლატფორმა სწავლის ყველა ეტაპისთვის" />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {AUDIENCES.map((audience, index) => (
          <RevealOnScroll key={audience.id} delayMs={90 * (index + 1)} className="h-full">
            <article
              id={audience.id}
              className={`flex h-full scroll-mt-24 flex-col gap-3.5 rounded-[24px] p-6 ${
                audience.soon
                  ? "border border-dashed border-[var(--ld-off-border)] bg-[var(--ld-off)]"
                  : "border border-[var(--ld-card-border)] bg-[var(--ld-card)]"
              }`}
            >
              <span aria-hidden className={`h-1.5 w-12 rounded-full ${audience.bar}`} />
              <h3
                className={`flex items-center gap-2 text-[22px] font-bold ${
                  audience.soon ? "text-[var(--ld-muted)]" : "text-[var(--ld-title)]"
                }`}
              >
                {audience.title}
                {audience.soon ? (
                  <span className="inline-flex h-6 items-center rounded-full border border-[var(--ld-off-border)] px-2.5 text-[12px] font-semibold text-[var(--ld-muted)]">
                    მალე
                  </span>
                ) : null}
              </h3>
              <p className="text-[15px] leading-relaxed text-[var(--ld-text)]">{audience.body}</p>
              <span
                className={`mt-auto inline-flex h-[26px] w-fit items-center rounded-full px-2.5 text-[12px] font-semibold text-[var(--ld-text)] ${
                  audience.soon ? "bg-[var(--ld-card)]" : "bg-[var(--ld-soft)]"
                }`}
              >
                {audience.tag}
              </span>
            </article>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
