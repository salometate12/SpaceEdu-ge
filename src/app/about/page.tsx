import type { Metadata } from "next";
import { AboutUsPage } from "@/components/landing/about/AboutUsPage";
import { ABOUT_CONTENT } from "@/lib/about-content";

// Metadata stays Georgian — the site's default — while the page body
// follows the reader's language choice.
export const metadata: Metadata = {
  title: ABOUT_CONTENT.ka.meta.title,
  description: ABOUT_CONTENT.ka.meta.description,
  alternates: { canonical: "/about" },
};

export default function AboutRoute() {
  return <AboutUsPage />;
}
