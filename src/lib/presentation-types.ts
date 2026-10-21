/**
 * The presentation's data, shared by the wizard, the editor, the export and
 * the on-device store (so lib code doesn't import from components).
 */

import type { SlideLayout } from "@/lib/presentation-constants";
import type { SlideImage } from "@/lib/presentation-layout";

export interface PresentationForm {
  topic: string;
  subject: string;
  slideCount: number;
  level: string;
  language: string;
  extraInstructions: string;
}

export interface QAAnswers {
  goal: string;
  audience: string;
  tone: string;
  mainPoint: string;
}

export interface PresentationTemplate {
  id: string;
  name: string;
  desc: string;
  bg: string;
  accent: string;
  border: string;
  /** Shown first in „დიზაინი“ with an „ახალი“ badge. */
  isNew?: boolean;
}

export interface GeneratedSlide {
  id: number;
  type: "cover" | "content" | "image" | "stats" | "conclusion" | "thanks";
  slideType: string;
  title: string;
  /** How the text is laid out; older slides have none (see effectiveLayout). */
  layout?: SlideLayout;
  body?: string;
  points?: string[];
  columns?: { heading: string; text: string }[];
  quote?: { text: string; author?: string };
  figure?: { value: string; caption: string };
  /** Small closing line, e.g. „კითხვები?“ on the thank-you slide. */
  footnote?: string;
  /** The user's photos on this slide, positioned in percent of the slide. */
  images: SlideImage[];
}

/** What the editor changes — one undo step is one Deck. */
export interface Deck {
  title: string;
  templateId: string;
  slides: GeneratedSlide[];
}
