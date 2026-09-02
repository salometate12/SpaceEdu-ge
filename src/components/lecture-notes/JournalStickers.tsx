"use client";

import { motion } from "framer-motion";
import { Atom, Flame, Sparkles } from "lucide-react";

interface JournalStickersProps {
  xp: number;
  streak: number;
  unlocked: Record<string, boolean>;
  onUnlock: (id: string) => void;
}

const hover = { scale: 1.1, rotate: 5 };

export function JournalStickers({ xp, streak, unlocked, onUnlock }: JournalStickersProps) {
  return (
    <div className="relative mx-auto mt-4 h-[210px] w-full max-w-[280px] sm:mt-6 sm:h-[250px]">
      <motion.button
        type="button"
        whileHover={hover}
        whileTap={{ scale: 0.94, rotate: -4 }}
        onClick={() => onUnlock("xp")}
        className="absolute left-6 top-2 flex h-[92px] w-[92px] -rotate-6 flex-col items-center justify-center rounded-full border-[3px] border-dashed border-orange-300 bg-gradient-to-br from-orange-50 to-amber-200 shadow-[0_8px_18px_rgba(180,80,20,0.22)]"
        aria-label="XP სტიკერი"
      >
        <Sparkles className={`h-5 w-5 ${unlocked.xp ? "text-amber-600" : "text-amber-400"}`} />
        <span className="mt-1 text-[10px] font-black uppercase tracking-wide text-amber-800">#XP_Gained</span>
        <span className="text-lg font-black text-amber-950">{xp}</span>
      </motion.button>

      <motion.button
        type="button"
        whileHover={hover}
        whileTap={{ scale: 0.94, rotate: 8 }}
        onClick={() => onUnlock("streak")}
        className="absolute right-2 top-16 flex h-[78px] min-w-[118px] rotate-6 flex-col items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-r from-teal-400 to-cyan-500 px-3 shadow-[0_8px_18px_rgba(15,118,110,0.28)]"
        aria-label="Streak სტიკერი"
      >
        <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wide text-white">
          <Flame className={`h-4 w-4 ${unlocked.streak ? "fill-orange-200 text-orange-100" : "text-white"}`} />
          #Streak
        </span>
        <span className="text-sm font-black text-white">{streak} დღე</span>
      </motion.button>

      <motion.button
        type="button"
        whileHover={hover}
        whileTap={{ scale: 0.94, rotate: -8 }}
        onClick={() => onUnlock("subject")}
        className="absolute bottom-2 left-10 flex h-[72px] w-[72px] -rotate-3 flex-col items-center justify-center rounded-2xl border-[3px] border-white bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_8px_18px_rgba(109,40,217,0.3)]"
        aria-label="საგნის სტიკერი"
      >
        <Atom className="h-6 w-6 text-white" />
        <span className="mt-0.5 text-[9px] font-black uppercase tracking-wide text-white">CS</span>
      </motion.button>
    </div>
  );
}
