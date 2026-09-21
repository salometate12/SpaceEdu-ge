"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

/**
 * A floating "back to top" button for long, scroll-heavy pages (the exam
 * runners and their results sheets). It watches the window scroll position and
 * fades in once the reader is well down the page, then smooth-scrolls to the
 * top on click. Fixed to the bottom-right so it never covers content.
 */
export function ScrollToTopButton({ threshold = 600 }: { threshold?: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > threshold);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.8, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 8 }}
          transition={{ duration: 0.2 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="ზემოთ ასვლა"
          className="fixed bottom-5 right-5 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-300/80 bg-white/90 text-slate-700 shadow-lg backdrop-blur transition-colors hover:border-slate-500 hover:text-slate-900 dark:border-white/[0.14] dark:bg-[#1a1a1e]/90 dark:text-slate-200 dark:hover:border-white/40 dark:hover:text-white"
        >
          <ArrowUp className="h-5 w-5 stroke-[2.5]" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
