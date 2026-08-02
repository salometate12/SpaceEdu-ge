import Link from "next/link";
import { ArrowUpRight, Bot, Clock, Lock } from "lucide-react";

const SUBTITLE_TEXT =
  "SpaceEdu — შენი პერსონალური სასწავლო სივრცე სკოლის, გამოცდებისა და უნივერსიტეტისთვის. AI გეგმავს, ხსნის და ამოწმებს — შენ მხოლოდ სწავლობ.";

const PILLS = [
  {
    label: "სასწავლო გეგმა",
    cls: "border-[#7C3AED]/80 bg-[#1a0a2e] text-[#bca8ff]",
  },
  {
    label: "Active Recall Quiz",
    cls: "border-[#22d3ee]/80 bg-[#042f3d] text-[#7ceeff]",
  },
  {
    label: "AI მასწავლებელი",
    cls: "border-[#22c55e]/80 bg-[#052e16] text-[#9bf7c2]",
  },
  {
    label: "კონსპექტი",
    cls: "border-[#f59e0b]/80 bg-[#2d1a00] text-[#ffd67e]",
  },
  { label: "ELI5", cls: "border-[#f472b6]/80 bg-[#4a044e] text-[#ffd1ee]" },
  {
    label: "ფლეშქარდები",
    cls: "border-[#2dd4bf]/80 bg-[#042f2c] text-[#8ef4e4]",
  },
];

const HERO_CARDS = [
  {
    title: "3 ინსტრუმენტი",
    desc: "გეგმა, კონსპექტი და ქვიზები ერთ სივრცეში",
    icon: Lock,
    bg: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)",
    border: "#a78bfa",
    text: "text-[#e9d8ff]",
  },
  {
    title: "AI Tutor",
    desc: "გიხსნის ყველაფერს ნაბიჯ-ნაბიჯ, 24/7",
    icon: Bot,
    bg: "linear-gradient(135deg, #0e7490 0%, #0891b2 100%)",
    border: "#22d3ee",
    text: "text-[#d3f7ff]",
  },
  {
    title: "24/7",
    desc: "ხელმისაწვდომია ნებისმიერ დროს, ნებისმიერი მოწყობილობიდან",
    icon: Clock,
    bg: "linear-gradient(135deg, #86198f 0%, #c026d3 100%)",
    border: "#f472b6",
    text: "text-[#ffd9f4]",
  },
];

export function Hero() {
  return (
    <section className="relative mx-auto w-full max-w-7xl overflow-hidden px-4 py-16 sm:px-6 lg:py-20">
      <div
        className="landing-starfield pointer-events-none absolute inset-0 -z-10 h-[700px]"
        aria-hidden
      />
      <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
        <div className="relative mx-auto w-full max-w-5xl">
          <div
            className="pointer-events-none absolute top-[15%] left-1/2 -z-10 hidden h-[350px] w-[600px] -translate-x-1/2 select-none rounded-full bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-cyan-500/10 blur-[130px] md:block"
            aria-hidden
          />

          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-purple-500/[0.06] px-4 py-1.5 text-xs font-medium text-purple-300">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" aria-hidden />
            სასწავლო პლატფორმა შენთვის
          </span>

          <h1 className="headline responsive-display mx-auto max-w-5xl text-center font-extrabold tracking-tight text-white">
            <span className="block text-white">
              ისწავლე{" "}
              <span className="bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] bg-clip-text text-transparent">
                უფრო ჭკვიანურად,
              </span>
            </span>
            <span className="block text-white">
              შექმენი შენი სასწავლო <span className="text-[#22d3ee]">Space-ი</span>
            </span>
          </h1>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-gray-400 sm:text-base md:text-lg">
          {SUBTITLE_TEXT}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/select-space"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] px-8 py-4 text-base font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-500 animate-shimmer hover:scale-[1.03] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] active:scale-[0.98]"
          >
            <span
              className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
              aria-hidden
            />
            <span className="relative z-[1]">უფასოდ დაიწყე</span>
            <ArrowUpRight className="relative z-[1] h-4 w-4 stroke-[2] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.02] px-8 py-4 text-base font-medium text-gray-300 backdrop-blur-xl transition-all duration-300 hover:border-purple-500/50 hover:bg-white/[0.05] hover:text-white hover:shadow-[0_0_25px_rgba(168,85,247,0.15)] active:scale-[0.98]"
          >
            როგორ მუშაობს
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        {HERO_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="relative overflow-hidden rounded-2xl border p-5"
              style={{ background: card.bg, borderColor: `${card.border}55` }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl border bg-white/10"
                style={{ borderColor: `${card.border}66` }}
              >
                <Icon className={`h-4 w-4 stroke-[1.75] ${card.text}`} aria-hidden />
              </div>
              <p className={`headline mt-4 text-2xl font-bold ${card.text}`}>{card.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/70">{card.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {PILLS.map((pill) => (
          <span
            key={pill.label}
            className={`rounded-full border-2 px-5 py-2 text-sm font-semibold leading-none shadow-[0_6px_20px_rgba(3,7,18,0.45)] ${pill.cls}`}
          >
            {pill.label}
          </span>
        ))}
      </div>
    </section>
  );
}
