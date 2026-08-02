"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const VISIBILITY_THRESHOLD = 300;

function isScrollVisible(): boolean {
  if (window.scrollY > VISIBILITY_THRESHOLD) return true;

  return Array.from(
    document.querySelectorAll<HTMLElement>("[data-assistant-scroll-root]"),
  ).some((root) => root.scrollTop > VISIBILITY_THRESHOLD);
}

export function AssistantBackToTopFab() {
  const [isVisible, setIsVisible] = useState(false);

  const evaluateVisibility = useCallback(() => {
    setIsVisible(isScrollVisible());
  }, []);

  useEffect(() => {
    evaluateVisibility();

    const handleScroll = () => evaluateVisibility();
    document.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [evaluateVisibility]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelectorAll<HTMLElement>("[data-assistant-scroll-root]").forEach(
      (root) => root.scrollTo({ top: 0, behavior: "smooth" }),
    );
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="ზევით დაბრუნება"
      className="fixed bottom-24 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-purple-500/25 bg-[#121214]/80 text-purple-300 shadow-[0_0_24px_rgba(139,92,246,0.15)] backdrop-blur-xl transition-all hover:border-purple-400/40 hover:text-white hover:shadow-[0_0_32px_rgba(139,92,246,0.25)] active:scale-95 lg:bottom-8 lg:right-8"
    >
      <ArrowUp className="h-4 w-4 stroke-[1.5]" />
    </button>
  );
}
