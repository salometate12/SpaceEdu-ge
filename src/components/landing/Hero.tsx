import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const SUBTITLE_TEXT =
  "SpaceEdu — შენი პერსონალური სასწავლო სივრცე სკოლის, გამოცდებისა და უნივერსიტეტისთვის.";

export function Hero() {
  const pills = [
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
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
        <div className="relative mx-auto w-full max-w-5xl">
          <div
            className="pointer-events-none absolute top-[20%] left-1/2 -z-10 hidden h-[350px] w-[600px] -translate-x-1/2 select-none rounded-full bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-cyan-500/10 blur-[130px] md:block"
            aria-hidden
          />
          <h1 className="headline responsive-display mx-auto max-w-5xl text-center tracking-tight text-white">
            <span className="block text-white">
              ისწავლე <span className="text-[#a78bfa]">უფრო ჭკვიანურად,</span>
            </span>
            <span className="block text-white">
              შექმენი შენი სასწავლო <span className="text-[#22d3ee]">Space-ი</span>
            </span>
          </h1>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-gray-400 sm:text-base md:text-lg">
          {SUBTITLE_TEXT}
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/select-space"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] px-8 py-4 text-base font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-500 animate-shimmer hover:scale-[1.03] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] active:scale-[0.98]"
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
            className="inline-flex items-center rounded-2xl border border-white/[0.08] bg-white/[0.02] px-8 py-4 text-base font-medium text-gray-300 backdrop-blur-xl transition-all duration-300 hover:border-purple-500/50 hover:bg-white/[0.05] hover:text-white hover:shadow-[0_0_25px_rgba(168,85,247,0.15)] active:scale-[0.98]"
          >
            როგორ მუშაობს
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        <div
          className="card relative overflow-visible text-center"
          style={{ backgroundColor: "#2e1065", borderColor: "#7C3AED" }}
        >
          <Image
            src="/3d-icons/side-bag.png"
            alt=""
            width={96}
            height={96}
            aria-hidden
            className="pointer-events-none absolute -top-9 right-1 z-0 h-[4.5rem] w-[4.5rem] object-contain opacity-90 saturate-110 drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)] animate-float-soft sm:-top-10 sm:right-3 sm:h-20 sm:w-20"
          />
          <p className="headline relative z-10 text-2xl font-bold text-[#c4b5fd]">3 ინსტრუმენტი</p>
        </div>
        <div className="card text-center" style={{ backgroundColor: "#083344", borderColor: "#22d3ee" }}>
          <p className="headline text-2xl font-bold text-[#67e8f9]">AI Tutor</p>
        </div>
        <div
          className="card relative overflow-visible text-center"
          style={{ backgroundColor: "#4a044e", borderColor: "#f472b6" }}
        >
          <Image
            src="/3d-icons/side-lamp.png"
            alt=""
            width={96}
            height={96}
            aria-hidden
            className="pointer-events-none absolute -top-9 left-1 z-0 h-[4.5rem] w-[4.5rem] object-contain opacity-90 saturate-110 drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)] animate-float-soft-delayed sm:-top-10 sm:left-3 sm:h-20 sm:w-20"
          />
          <p className="headline relative z-10 text-2xl font-bold text-[#f9a8d4]">24/7</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {pills.map((pill) => (
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
