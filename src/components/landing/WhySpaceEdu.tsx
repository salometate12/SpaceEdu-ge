import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { FileCheck, Languages, ListChecks } from "lucide-react";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { ACCENT_CARD, ACCENT_PILL, ACCENT_TEXT, type NotebookAccent } from "./notebook/accents";

interface Reason {
  id: string;
  title: string;
  body: string;
  icon: LucideIcon;
  accent: NotebookAccent;
}

const REASONS: Reason[] = [
  {
    id: "georgian",
    title: "ქართულად, ქართული პროგრამისთვის",
    body: "ყველა ხელსაწყო ქართულად მუშაობს და ეროვნული გამოცდებისა და ქართული უნივერსიტეტების პროგრამას ეყრდნობა.",
    icon: Languages,
    accent: "green",
  },
  {
    // The past papers in src/data are transcribed from the NAEC booklets
    // and their scoring schemes.
    id: "real-exams",
    title: "ნამდვილი საგამოცდო მასალა",
    body: "წინა წლების ტესტები და შეფასების სქემები ოფიციალური საგამოცდო მასალიდან.",
    icon: FileCheck,
    accent: "amber",
  },
  {
    id: "scheme",
    title: "AI, რომელიც სქემით ამოწმებს",
    body: "ღია დავალებებს AI შეფასების სქემის კრიტერიუმებით ამოწმებს და გიხსნის, სად დაკარგე ქულა.",
    icon: ListChecks,
    accent: "pink",
  },
];

const FOUNDER_NOTE =
  "გამარჯობა! მე სალომე ვარ, SpaceEdu-ს დამფუძნებელი. ეს საიტი იმისთვის შევქმენი, რომ სწავლა უფრო მარტივი გახდეს. მინდოდა, რომ სწავლისთვის საჭირო ყველაფერი ერთ ადგილას ყოფილიყო და თან ქართულად: სასწავლო გეგმა, მასალები და გასაგები ახსნები. ჯერ დასაწყისში ვართ და საიტს ყოველდღე ვაუმჯობესებთ, ამიტომ შენი აზრი ძალიან მნიშვნელოვანია. თუ რამე არ მოგეწონება ან იდეა გაგიჩნდება, მომწერე. ყველა წერილს თავად ვკითხულობ.";

/** „რატომ SpaceEdu“: three reasons and a note from the founder. */
export function WhySpaceEdu() {
  return (
    <section id="why" className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="headline text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-50">
          რატომ <span className={ACCENT_TEXT.green}>SpaceEdu</span>
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base dark:text-slate-300">
          ვქმნით ხელსაწყოებს, რომლებიც ქართველ სტუდენტსა და აბიტურიენტს რეალურად სჭირდება.
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-3">
        {REASONS.map((reason, index) => {
          const Icon = reason.icon;
          return (
            <RevealOnScroll key={reason.id} delayMs={90 * (index + 1)}>
              <article className={`h-full rounded-2xl border-2 p-7 ${ACCENT_CARD[reason.accent]}`}>
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white/70 dark:bg-white/[0.08] ${ACCENT_CARD[reason.accent]}`}
                >
                  <Icon className={`h-6 w-6 stroke-[2] ${ACCENT_TEXT[reason.accent]}`} aria-hidden />
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-50">{reason.title}</h3>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{reason.body}</p>
              </article>
            </RevealOnScroll>
          );
        })}
      </div>

      <RevealOnScroll delayMs={120}>
        <figure className="mx-auto mt-10 max-w-[720px] rounded-[24px] bg-[#fdf2f8] p-7 dark:bg-[rgba(236,72,153,0.10)]">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-600 text-[16px] font-bold text-white dark:bg-pink-500"
            >
              ს
            </span>
            <span className={`inline-flex rounded-full border-2 px-3 py-1 text-xs font-bold ${ACCENT_PILL.pink}`}>
              ადრეული წვდომა
            </span>
          </div>
          <blockquote className="mt-5 text-[17px] leading-[1.6] text-slate-800 dark:text-slate-200">{FOUNDER_NOTE}</blockquote>
          <Link
            href="/contact"
            className={`mt-5 inline-flex items-center gap-1 rounded-sm text-[15px] font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/40 ${ACCENT_TEXT.pink}`}
          >
            მომწერე →
          </Link>
        </figure>
      </RevealOnScroll>
    </section>
  );
}
