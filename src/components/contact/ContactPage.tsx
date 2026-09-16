import Link from "next/link";
import { Handshake, Mail, MessageCircleQuestion, Sparkles } from "lucide-react";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { PaperBackButton } from "@/components/ui/PaperBackButton";
import {
  Flower,
  Mountains,
  Pencil,
  RainbowArc,
  Sparkle,
} from "@/components/landing/notebook/Doodles";

/** The one place users reach us. Written on the same ruled paper as /about,
 *  so the two marketing pages read as one hand. */
const SUPPORT_EMAIL = "support@spaceedu.ge";

/** What people usually write about — sets expectations before they send. */
const TOPICS: { icon: typeof Mail; title: string; body: string }[] = [
  {
    icon: MessageCircleQuestion,
    title: "დახმარება",
    body: "პლატფორმაზე რამე გაგიჭირდა ან შეცდომას წააწყდი? მოგვწერე და მალე გიპასუხებთ.",
  },
  {
    icon: Sparkles,
    title: "იდეები და შენიშვნები",
    body: "რა უნდა დავამატოთ ან გავაუმჯობესოთ? შენი აზრი პირდაპირ ეხმარება SpaceEdu-ს.",
  },
  {
    icon: Handshake,
    title: "თანამშრომლობა",
    body: "სკოლა, რეპეტიტორი თუ ორგანიზაცია ხარ და გინდა ერთად მუშაობა — დაგვიკავშირდი.",
  },
];

export function ContactPage() {
  return (
    <div className="notebook-paper notebook-margin under-site-header relative flex-1 overflow-hidden">
      <div className="mx-auto w-full max-w-3xl px-8 sm:px-12">
        <section className="relative pb-10 pt-10 sm:pb-16 sm:pt-16">
          <RainbowArc className="pointer-events-none absolute right-0 top-24 hidden w-28 -rotate-6 opacity-90 sm:block lg:w-36" />
          <Sparkle className="pointer-events-none absolute right-40 top-32 hidden h-5 w-5 rotate-12 text-amber-400 lg:block" />
          <Flower className="pointer-events-none absolute -left-2 bottom-6 hidden h-12 w-12 -rotate-12 text-pink-400/80 lg:block dark:text-pink-400/60" />

          <div className="flex items-center gap-3">
            <PaperBackButton />
            <span className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-800/80 bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-800 dark:border-white/20 dark:bg-white/[0.06] dark:text-slate-100">
              <Mail className="h-4 w-4 text-sky-500 dark:text-sky-300" />
              კონტაქტი
            </span>
          </div>

          <RevealOnScroll>
            <h1 className="headline mt-7 text-[2rem] font-bold leading-[1.15] tracking-tight text-slate-900 sm:mt-9 sm:text-5xl dark:text-slate-50">
              დაგვიკავშირდი
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-700 sm:text-xl dark:text-slate-300">
              კითხვა, იდეა თუ შენიშვნა — ყველა წერილს ვკითხულობთ. მოგვწერე და
              ჩვეულებრივ{" "}
              <span className="font-semibold text-slate-900 underline decoration-amber-400/70 decoration-[3px] underline-offset-4 dark:text-slate-50">
                1–2 სამუშაო დღეში
              </span>{" "}
              გიპასუხებთ.
            </p>
          </RevealOnScroll>
        </section>

        {/* The email — the one real channel. A big, obvious card, not a form,
            so there is no server to trust with a message and nothing to
            break. */}
        <RevealOnScroll>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="group relative flex flex-col items-start gap-3 rounded-2xl border-2 border-slate-800/80 bg-white/80 p-6 transition-transform hover:-translate-y-0.5 sm:flex-row sm:items-center sm:gap-5 sm:p-7 dark:border-white/20 dark:bg-white/[0.06]"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-800/80 bg-sky-100 text-sky-700 dark:border-white/20 dark:bg-sky-400/15 dark:text-sky-200">
              <Mail className="h-7 w-7" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                მოგვწერე ელ-ფოსტაზე
              </span>
              <span className="headline block break-all text-xl font-bold text-slate-900 underline decoration-sky-400/60 decoration-[3px] underline-offset-[6px] transition-colors group-hover:text-sky-700 sm:text-2xl dark:text-slate-50 dark:group-hover:text-sky-300">
                {SUPPORT_EMAIL}
              </span>
            </span>
          </a>
        </RevealOnScroll>

        <section className="relative py-12 sm:py-16">
          <Pencil className="pointer-events-none absolute -right-4 top-8 hidden h-12 w-12 rotate-12 text-slate-500/70 lg:block dark:text-slate-400/70" />
          <RevealOnScroll>
            <h2 className="headline text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
              რაზე გვწერენ ხოლმე
            </h2>
          </RevealOnScroll>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {TOPICS.map((topic) => {
              const Icon = topic.icon;
              return (
                <RevealOnScroll key={topic.title}>
                  <div className="h-full rounded-2xl border-2 border-slate-800/80 bg-white/70 p-5 dark:border-white/20 dark:bg-white/[0.06]">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-800/80 bg-amber-100 text-amber-700 dark:border-white/20 dark:bg-amber-400/15 dark:text-amber-200">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="headline mt-4 text-lg font-bold text-slate-900 dark:text-slate-50">
                      {topic.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {topic.body}
                    </p>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        </section>

        <section className="relative pb-16 pt-2 sm:pb-24">
          <RevealOnScroll>
            <div className="flex flex-col items-center gap-4 text-center">
              <Mountains className="w-28 text-slate-500 sm:w-36 dark:text-slate-400" />
              <p className="max-w-md text-base leading-relaxed text-slate-700 dark:text-slate-300">
                გმადლობთ, რომ SpaceEdu-ს ირჩევ. შენი წერილი გვეხმარება, უკეთესები
                გავხდეთ.
              </p>
              <Link
                href="/"
                className="headline text-lg font-bold tracking-tight text-slate-900 underline decoration-sky-400/60 decoration-[3px] underline-offset-[6px] transition-colors hover:text-sky-700 dark:text-slate-100 dark:hover:text-sky-300"
              >
                spaceedu.ge
              </Link>
            </div>
          </RevealOnScroll>
        </section>
      </div>
    </div>
  );
}
