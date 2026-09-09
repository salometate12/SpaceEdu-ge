"use client";

import { useDocumentLanguage, useLanguage } from "@/components/LanguageProvider";
import { ABOUT_CONTENT } from "@/lib/about-content";
import { AboutUsAudience } from "./AboutUsAudience";
import { AboutUsHero } from "./AboutUsHero";
import { AboutUsSignature } from "./AboutUsSignature";
import { AboutUsStory } from "./AboutUsStory";

/**
 * /about is the one page that steps outside the landing's neon-on-black
 * look: it's a sheet of ruled paper with the story written on it. Nothing
 * here is shared with the rest of the landing, and nothing here changes it.
 */
export function AboutUsPage() {
  const { language } = useLanguage();
  const content = ABOUT_CONTENT[language];
  useDocumentLanguage();

  return (
    <div className="notebook-paper notebook-margin relative flex-1 overflow-hidden">
      <div className="mx-auto w-full max-w-3xl px-8 sm:px-12">
        <AboutUsHero content={content} />
        <AboutUsStory content={content} />
        <AboutUsAudience content={content} />
        <AboutUsSignature content={content} />
      </div>
    </div>
  );
}
