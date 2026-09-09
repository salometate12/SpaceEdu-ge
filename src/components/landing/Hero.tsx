import Link from "next/link";
import { ArrowUpRight, Bot, Clock, Lock } from "lucide-react";
import { Bulb, Flower, RainbowArc, Sparkle, Sun } from "./notebook/Doodles";
import { ACCENT_CARD, ACCENT_PILL, ACCENT_TEXT, type NotebookAccent } from "./notebook/accents";

const SUBTITLE_TEXT =
  "SpaceEdu — შენი პერსონალური სასწავლო სივრცე სკოლის, გამოცდებისა და უნივერსიტეტისთვის. AI გეგმავს, ხსნის და ამოწმებს — შენ მხოლოდ სწავლობ.";

const PILLS: { label: string; accent: NotebookAccent }[] = [
  { label: "სასწავლო გეგმა", accent: "blue" },
  { label: "Active Recall Quiz", accent: "green" },
  { label: "AI მასწავლებელი", accent: "pink" },
  { label: "კონსპექტი", accent: "amber" },
  { label: "ELI5", accent: "blue" },
  { label: "ფლეშქარდები", accent: "green" },
];

const HERO_CARDS: {
  title: string;
  desc: string;
  icon: typeof Lock;
  accent: NotebookAccent;
  tilt: string;
}[] = [
  {
    title: "3 ინსტრუმენტი",
    desc: "გეგმა, კონსპექტი და ქვიზები ერთ სივრცეში",
    icon: Lock,
    accent: "blue",
    tilt: "hover:-rotate-1",
  },
  {
    title: "AI Tutor",
    desc: "გიხსნის ყველაფერს ნაბიჯ-ნაბიჯ, 24/7",
    icon: Bot,
    accent: "green",
    tilt: "hover:rotate-1",
  },
  {
    title: "24/7",
    desc: "ხელმისაწვდომია ნებისმიერ დროს, ნებისმიერი მოწყობილობიდან",
    icon: Clock,
    accent: "pink",
    tilt: "hover:-rotate-1",
  },
];

export function Hero() {
  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
      {/* Margin doodles, as on /about. Hidden where the column already fills
          the sheet. */}
      <RainbowArc className="pointer-events-none absolute right-4 top-8 hidden w-24 -rotate-6 opacity-90 lg:block lg:w-32" />
      <Sparkle className="pointer-events-none absolute left-10 top-24 hidden h-5 w-5 -rotate-12 text-amber-400 lg:block" />
      <Sun className="pointer-events-none absolute left-4 bottom-40 hidden h-12 w-12 text-amber-500/70 xl:block dark:text-amber-300/60" />
      <Flower className="pointer-events-none absolute right-8 bottom-32 hidden h-12 w-12 rotate-12 text-pink-400/70 xl:block dark:text-pink-400/50" />

      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <span
          className="stagger-in mb-6 inline-flex items-center gap-2 rounded-xl border-2 border-slate-800/80 bg-white/70 px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:border-white/20 dark:bg-white/[0.06] dark:text-slate-100"
          style={{ animationDelay: "0ms" }}
        >
          <Bulb className="h-4 w-4 text-amber-500 dark:text-amber-300" />
          სასწავლო პლატფორმა შენთვის
        </span>

        <h1 className="headline responsive-display mx-auto max-w-4xl text-center font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          <span className="block">
            <span className="headline-word-in" style={{ animationDelay: "120ms" }}>
              ისწავლე
            </span>{" "}
            <span
              className={`headline-word-in ${ACCENT_TEXT.blue}`}
              style={{ animationDelay: "230ms" }}
            >
              უფრო
            </span>{" "}
            <span
              className={`headline-word-in ${ACCENT_TEXT.blue}`}
              style={{ animationDelay: "340ms" }}
            >
              ჭკვიანურად,
            </span>
          </span>
          <span className="block">
            <span className="headline-word-in" style={{ animationDelay: "450ms" }}>
              შექმენი
            </span>{" "}
            <span className="headline-word-in" style={{ animationDelay: "550ms" }}>
              შენი
            </span>{" "}
            <span className="headline-word-in" style={{ animationDelay: "650ms" }}>
              სასწავლო
            </span>{" "}
            <span
              className={`headline-word-in ${ACCENT_TEXT.green}`}
              style={{ animationDelay: "750ms" }}
            >
              Space-ი
            </span>
          </span>
        </h1>

        <p
          className="stagger-in mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-slate-700 sm:text-base md:text-lg dark:text-slate-300"
          style={{ animationDelay: "950ms" }}
        >
          {SUBTITLE_TEXT}
        </p>

        <div
          className="stagger-in mt-8 flex flex-wrap items-center justify-center gap-3.5"
          style={{ animationDelay: "1050ms" }}
        >
          {/* A hard offset shadow instead of a glow: on paper the button
              should read as something stuck on, not lit from behind. */}
          <Link
            href="/select-space"
            className="group inline-flex items-center gap-2 rounded-full border-2 border-violet-700 bg-violet-600 px-7 py-3.5 text-base font-bold text-white shadow-[0_5px_0_0_rgba(76,29,149,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_7px_0_0_rgba(76,29,149,0.35)] active:translate-y-0.5 active:shadow-[0_2px_0_0_rgba(76,29,149,0.35)] dark:border-violet-300/40"
          >
            უფასოდ დაიწყე
            <ArrowUpRight className="h-4 w-4 stroke-[2.5] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center rounded-full border-2 border-slate-400 bg-white/60 px-7 py-3.5 text-base font-semibold text-slate-700 transition-colors hover:border-slate-600 hover:text-slate-900 dark:border-white/20 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:border-white/40 dark:hover:text-white"
          >
            როგორ მუშაობს
          </Link>
        </div>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {HERO_CARDS.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`stagger-in h-full rounded-2xl border-2 p-5 transition-transform duration-300 ${card.tilt} ${ACCENT_CARD[card.accent]}`}
              style={{ animationDelay: `${1150 + index * 100}ms` }}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white/70 dark:bg-white/[0.08] ${ACCENT_CARD[card.accent]}`}
              >
                <Icon
                  className={`h-4 w-4 stroke-[2] ${ACCENT_TEXT[card.accent]}`}
                  aria-hidden
                />
              </div>
              <p className={`headline mt-4 text-2xl font-bold ${ACCENT_TEXT[card.accent]}`}>
                {card.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {card.desc}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
        {PILLS.map((pill, index) => (
          <span
            key={pill.label}
            className={`stagger-in rounded-full border-2 px-4 py-1.5 text-sm font-semibold leading-none ${ACCENT_PILL[pill.accent]}`}
            style={{ animationDelay: `${1500 + index * 60}ms` }}
          >
            {pill.label}
          </span>
        ))}
      </div>
    </section>
  );
}
