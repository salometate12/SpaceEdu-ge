import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { FileCheck, Languages, ListChecks } from "lucide-react";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { LANDING_CARD, SectionHeading, TILE, type TileColor } from "./SectionHeading";

interface Reason {
  id: string;
  title: string;
  body: string;
  icon: LucideIcon;
  color: TileColor;
}

const REASONS: Reason[] = [
  {
    id: "georgian",
    title: "ქართულად, ქართული პროგრამისთვის",
    body: "ყველა ხელსაწყო ქართულად მუშაობს და ეროვნული გამოცდებისა და ქართული უნივერსიტეტების პროგრამას ეყრდნობა.",
    icon: Languages,
    color: "green",
  },
  {
    // The past papers in src/data are transcribed from the NAEC booklets
    // and their scoring schemes.
    id: "real-exams",
    title: "ნამდვილი საგამოცდო მასალა",
    body: "წინა წლების ტესტები და შეფასების სქემები ოფიციალური საგამოცდო მასალიდან.",
    icon: FileCheck,
    color: "yellow",
  },
  {
    id: "scheme",
    title: "AI, რომელიც სქემით ამოწმებს",
    body: "ღია დავალებებს AI შეფასების სქემის კრიტერიუმებით ამოწმებს და გიხსნის, სად დაკარგე ქულა.",
    icon: ListChecks,
    color: "pink",
  },
];

const FOUNDER_NOTE =
  "გამარჯობა! მე სალომე ვარ, SpaceEdu-ს დამფუძნებელი. ეს საიტი იმისთვის შევქმენი, რომ სწავლა უფრო მარტივი გახდეს. მინდოდა, რომ სწავლისთვის საჭირო ყველაფერი ერთ ადგილას ყოფილიყო და თან ქართულად: სასწავლო გეგმა, მასალები და გასაგები ახსნები. ჯერ დასაწყისში ვართ და საიტს ყოველდღე ვაუმჯობესებთ, ამიტომ შენი აზრი ძალიან მნიშვნელოვანია. თუ რამე არ მოგეწონება ან იდეა გაგიჩნდება, მომწერე. ყველა წერილს თავად ვკითხულობ.";

/** „რატომ SpaceEdu“: three reasons and a note from the founder. */
export function WhySpaceEdu() {
  return (
    <section id="why" className="scroll-mt-24 py-14 sm:py-20">
      <SectionHeading
        title={
          <>
            რატომ <span className="mark-pink">SpaceEdu</span>
          </>
        }
        subtitle="ვქმნით ხელსაწყოებს, რომლებიც ქართველ სტუდენტსა და აბიტურიენტს რეალურად სჭირდება."
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {REASONS.map((reason, index) => {
          const Icon = reason.icon;
          return (
            <RevealOnScroll key={reason.id} delayMs={90 * (index + 1)} className="h-full">
              <article className={`${LANDING_CARD} h-full p-6`}>
                <span aria-hidden className={`flex h-11 w-11 items-center justify-center rounded-[12px] ${TILE[reason.color]}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-4 text-[17px] font-bold text-[var(--ld-title)]">{reason.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--ld-text)]">{reason.body}</p>
              </article>
            </RevealOnScroll>
          );
        })}
      </div>

      <RevealOnScroll delayMs={120}>
        <figure className="mx-auto mt-8 max-w-[720px] rounded-[24px] bg-[#fce7f3] p-7 dark:bg-[rgba(236,72,153,0.12)]">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e11d74] text-[16px] font-bold text-white"
            >
              ს
            </span>
            <span className="inline-flex h-7 items-center rounded-full bg-white px-3 text-[12.5px] font-semibold text-[#9d174d] dark:bg-white/10 dark:text-[#f9a8d4]">
              ადრეული წვდომა
            </span>
          </div>
          <blockquote className="mt-5 text-[17px] leading-[1.6] text-[#1c1a17] dark:text-[#fafaf9]">{FOUNDER_NOTE}</blockquote>
          <Link
            href="/contact"
            className="ld-focus mt-5 inline-flex items-center gap-1 rounded-sm text-[15px] font-semibold text-[#be185d] underline-offset-4 hover:underline dark:text-[#f9a8d4]"
          >
            მომწერე →
          </Link>
        </figure>
      </RevealOnScroll>
    </section>
  );
}
