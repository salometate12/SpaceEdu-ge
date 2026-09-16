"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

/**
 * The wait screen while the AI reads a file and writes flashcards. It has
 * nothing to do with the site's XP — it's just a small, colourful, school-y
 * distraction so the reader doesn't stare at a spinner: rotating study facts,
 * bouncing supplies, a live tally of cards as they arrive, and a star to tap.
 */

const FACTS: { emoji: string; text: string; from: string; to: string }[] = [
  { emoji: "🧠", text: "იცოდი? მასალის გამეორება ძილის წინ მეხსიერებას აძლიერებს.", from: "#f472b6", to: "#fb7185" },
  { emoji: "🎯", text: "აქტიური გახსენება (active recall) სწავლის #1 მეთოდია.", from: "#38bdf8", to: "#6366f1" },
  { emoji: "🌱", text: "პატარა ყოველდღიური ნაბიჯები დიდ ცოდნად იქცევა.", from: "#34d399", to: "#10b981" },
  { emoji: "⚡", text: "მოკლე, ხშირი გამეორება სჯობს ერთ გრძელ „ზუთხვას“.", from: "#fbbf24", to: "#f59e0b" },
  { emoji: "🔬", text: "AI ახლა შენს მასალას კითხულობს და საუკეთესო კითხვებს არჩევს.", from: "#a78bfa", to: "#8b5cf6" },
  { emoji: "🚀", text: "თითქმის მზადაა — მოემზადე ვარსკვლავებამდე ფრენისთვის!", from: "#22d3ee", to: "#0ea5e9" },
];

const SUPPLIES = ["📚", "✏️", "🎓", "⭐", "🎨", "🔖"];

interface Pop {
  id: number;
  x: number;
}

export function FlashcardGenLoader({ count = 0 }: { count?: number }) {
  const [factIndex, setFactIndex] = useState(0);
  const [taps, setTaps] = useState(0);
  const [pops, setPops] = useState<Pop[]>([]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FACTS.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, []);

  const fact = FACTS[factIndex];

  const handleTap = () => {
    setTaps((prev) => prev + 1);
    const pop: Pop = { id: Date.now() + Math.random(), x: Math.random() * 40 - 20 };
    setPops((prev) => [...prev, pop]);
    window.setTimeout(() => {
      setPops((prev) => prev.filter((p) => p.id !== pop.id));
    }, 700);
  };

  const supplyItems = useMemo(
    () =>
      SUPPLIES.map((emoji, i) => ({
        emoji,
        delay: `${i * 0.12}s`,
        rot: `${(i % 2 === 0 ? -1 : 1) * (4 + i)}deg`,
      })),
    [],
  );

  return (
    <div className="flex w-full flex-col items-center py-2 text-center">
      {/* Bouncing school supplies */}
      <div className="flex items-end gap-3">
        {supplyItems.map((item) => (
          <span
            key={item.emoji}
            className="text-3xl"
            style={
              {
                "--rot": item.rot,
                animation: `genloader-float 1.6s ease-in-out ${item.delay} infinite`,
                display: "inline-block",
              } as CSSProperties
            }
          >
            {item.emoji}
          </span>
        ))}
      </div>

      <p className="mt-4 text-base font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
        ბარათები მზადდება…
      </p>

      {/* Live tally of cards as they stream in */}
      <div className="mt-2 flex items-center gap-2">
        <span
          key={count}
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-600 px-3 text-base font-black text-white shadow-md shadow-pink-500/30"
          style={{ animation: "genloader-pop 0.4s ease-out" }}
        >
          {count}
        </span>
        <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          {count > 0 ? "ბარათი უკვე მზადაა! 🎉" : "ვიწყებთ…"}
        </span>
      </div>

      {/* Rotating colourful study fact */}
      <div
        key={factIndex}
        className="mt-5 w-full rounded-2xl p-4 text-left shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${fact.from}, ${fact.to})`,
          animation: "genloader-pop 0.45s ease-out",
        }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden>
            {fact.emoji}
          </span>
          <p className="text-sm font-semibold leading-relaxed text-white">
            {fact.text}
          </p>
        </div>
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

      {/* Tap-the-star mini game */}
      <div className="mt-5 flex flex-col items-center">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          მოწყენილი ხარ? დააჭირე ვარსკვლავს! ⭐
        </p>
        <div className="relative mt-2">
          {pops.map((pop) => (
            <span
              key={pop.id}
              className="pointer-events-none absolute left-1/2 top-0 text-sm font-black text-amber-500"
              style={{
                transform: `translateX(${pop.x}px)`,
                animation: "genloader-plusone 0.7s ease-out forwards",
              }}
            >
              +1
            </span>
          ))}
          <button
            type="button"
            onClick={handleTap}
            aria-label="დააჭირე ვარსკვლავს"
            className="text-4xl transition-transform active:scale-90"
            style={{ animation: "genloader-tap 0.3s ease-out", animationPlayState: "paused" }}
            onMouseDown={(e) => {
              e.currentTarget.style.animation = "none";
              // restart the tap animation
              void e.currentTarget.offsetWidth;
              e.currentTarget.style.animation = "genloader-tap 0.3s ease-out";
            }}
          >
            ⭐
          </button>
        </div>
        {taps > 0 && (
          <p className="mt-1 text-xs font-bold text-amber-500">
            {taps} ქულა{taps >= 10 ? " — ვარსკვლავური! 🌟" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
