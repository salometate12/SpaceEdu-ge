"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  Brain,
  Check,
  FlaskConical,
  Rocket,
  Sprout,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * The wait screen while the AI reads a file and writes flashcards. Nothing to
 * do with the site's XP — just a calm, colourful hold: a small stack of cards
 * being "written", a live count as they stream in, and a rotating study tip.
 */

const TIPS: { icon: LucideIcon; text: string; from: string; to: string }[] = [
  { icon: Brain, text: "მასალის გამეორება ძილის წინ მეხსიერებას აძლიერებს.", from: "#ec4899", to: "#f43f5e" },
  { icon: Target, text: "აქტიური გახსენება სწავლის ყველაზე ეფექტური მეთოდია.", from: "#3b82f6", to: "#6366f1" },
  { icon: Sprout, text: "პატარა ყოველდღიური ნაბიჯები დიდ ცოდნად იქცევა.", from: "#10b981", to: "#14b8a6" },
  { icon: Zap, text: "მოკლე, ხშირი გამეორება სჯობს ერთ გრძელ სესიას.", from: "#f59e0b", to: "#f97316" },
  { icon: FlaskConical, text: "AI ახლა შენს მასალას კითხულობს და საუკეთესო კითხვებს არჩევს.", from: "#8b5cf6", to: "#7c3aed" },
  { icon: Rocket, text: "თითქმის მზადაა — მალე დაიწყებ სწავლას.", from: "#0ea5e9", to: "#06b6d4" },
];

/** The three cards in the "being written" stack, back to front. */
const STACK = [
  { rotate: "-9deg", x: "-16px", y: "10px", grad: "linear-gradient(135deg,#c4b5fd,#a78bfa)" },
  { rotate: "7deg", x: "14px", y: "6px", grad: "linear-gradient(135deg,#93c5fd,#60a5fa)" },
];

function CardStack() {
  return (
    <div className="relative mx-auto h-[104px] w-[168px]">
      {STACK.map((card, i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-2xl shadow-md"
          style={{
            transform: `translate(${card.x}, ${card.y}) rotate(${card.rotate})`,
            background: card.grad,
          }}
        />
      ))}
      {/* Front card, "being written" */}
      <div
        className="absolute inset-0 flex flex-col justify-center gap-2 rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
        style={{ animation: "genloader-float 2.4s ease-in-out infinite", ["--rot" as string]: "0deg" } as CSSProperties}
      >
        <span className="h-2.5 w-1/3 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500" />
        <span className="skeleton-shimmer h-2 w-full rounded-full" />
        <span className="skeleton-shimmer h-2 w-11/12 rounded-full" />
        <span className="skeleton-shimmer h-2 w-2/3 rounded-full" />
      </div>
    </div>
  );
}

export function FlashcardGenLoader({ count = 0 }: { count?: number }) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, []);

  const tip = TIPS[tipIndex];
  const TipIcon = tip.icon;

  return (
    <div className="flex w-full flex-col items-center py-2 text-center">
      <CardStack />

      <p className="mt-6 text-base font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
        ბარათები იქმნება…
      </p>

      {/* Live tally of cards as they stream in */}
      <div className="mt-2 flex items-center gap-2">
        <span
          key={count}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-600 px-3 text-sm font-black text-white shadow-sm shadow-pink-500/30"
          style={{ animation: "genloader-pop 0.4s ease-out" }}
        >
          {count > 0 && <Check className="h-3.5 w-3.5 stroke-[3]" />}
          {count}
        </span>
        <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          {count > 0 ? "ბარათი მზადაა" : "ვიწყებთ…"}
        </span>
      </div>

      {/* Rotating study tip — clean icon, no emoji */}
      <div
        key={tipIndex}
        className="mt-5 flex w-full items-center gap-3 rounded-2xl p-4 text-left shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${tip.from}, ${tip.to})`,
          animation: "genloader-pop 0.45s ease-out",
        }}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/25 text-white">
          <TipIcon className="h-5 w-5 stroke-[2]" aria-hidden />
        </span>
        <p className="text-sm font-semibold leading-relaxed text-white">{tip.text}</p>
      </div>

      {/* Progress shimmer bar */}
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full w-1/2 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, #f472b6, #38bdf8, #34d399, transparent)",
            backgroundSize: "200% 100%",
            animation: "genloader-shimmer 1.6s linear infinite",
          }}
        />
      </div>
    </div>
  );
}
