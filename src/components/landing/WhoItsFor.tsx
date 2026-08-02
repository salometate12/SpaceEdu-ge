import type { LucideIcon } from "lucide-react";
import { GraduationCap, Target } from "lucide-react";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

interface AudienceCard {
  id: string;
  title: string;
  body: string;
  icon: LucideIcon;
  tag: string;
  color: string;
}

const AUDIENCES: AudienceCard[] = [
  {
    id: "school",
    title: "სკოლა",
    body: "დაეხმარე თავს ყოველდღიურ საშინაო დავალებებსა და გაკვეთილების მომზადებაში.",
    icon: GraduationCap,
    tag: "I–XII კლასი",
    color: "#a78bfa",
  },
  {
    id: "exams",
    title: "გამოცდები",
    body: "მოემზადე ეროვნული და საერთაშორისო გამოცდებისთვის სტრუქტურირებული გეგმით.",
    icon: Target,
    tag: "ეროვნული გამოცდები, SAT, IELTS",
    color: "#2dd4bf",
  },
  {
    id: "university",
    title: "უნივერსიტეტი",
    body: "გართულებულ საგნებში სწრაფად გაერკვე AI ასისტენტითა და კონსპექტებით.",
    icon: GraduationCap,
    tag: "ბაკალავრიატი, მაგისტრატურა",
    color: "#e879f9",
  },
];

export function WhoItsFor() {
  return (
    <section id="audience" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="headline text-2xl font-bold text-white sm:text-3xl">
          ვისთვის არის SpaceEdu
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-400 sm:text-base">
          ერთი პლატფორმა — სწავლის ყველა საფეხურისთვის
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-3">
        {AUDIENCES.map((audience, idx) => {
          const Icon = audience.icon;
          return (
            <RevealOnScroll key={audience.id} delayMs={90 * (idx + 1)}>
              <article
                id={audience.id}
                className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#17131f]/80 to-[#121214]/40 p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30"
              >
                <div
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    color: audience.color,
                    filter: `drop-shadow(0 0 14px ${audience.color}55)`,
                  }}
                >
                  <Icon className="h-7 w-7 stroke-[1.5]" aria-hidden />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{audience.title}</h3>
                <p className="mb-5 text-sm leading-relaxed text-gray-400">{audience.body}</p>
                <span
                  className="inline-flex rounded-full border px-3.5 py-1.5 text-xs font-medium"
                  style={{
                    borderColor: `${audience.color}40`,
                    backgroundColor: `${audience.color}12`,
                    color: audience.color,
                  }}
                >
                  {audience.tag}
                </span>
              </article>
            </RevealOnScroll>
          );
        })}
      </div>
    </section>
  );
}
