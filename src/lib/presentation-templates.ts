import { DEFAULT_TEMPLATE_ID } from "@/lib/presentation-theme";
import type { PresentationTemplate } from "@/lib/presentation-types";

/** The designs a deck can use (colours for the slides are in presentation-theme). */
export const PRESENTATION_TEMPLATES: PresentationTemplate[] = [
  { id: "aurora", name: "Aurora", desc: "მუქი, ფერადი ნათება", bg: "#0B1026", accent: "#5EEAD4", border: "#312E81", isNew: true },
  { id: "geometric", name: "Geometric", desc: "თეთრი, თამამი ფიგურები", bg: "#FFFFFF", accent: "#FF6B5A", border: "#E2E8F0", isNew: true },
  { id: "paper", name: "Paper", desc: "მინიმალური, აკადემიური", bg: "#FFFFFF", accent: "#E11D74", border: "#E5E7EB", isNew: true },
  { id: "graphite", name: "Graphite", desc: "მუქი, მკვეთრი ტიპოგრაფია", bg: "#141517", accent: "#A3E635", border: "#27272A", isNew: true },
  { id: "galaxy", name: "Galaxy", desc: "მუქი, კოსმოსური", bg: "#0f0520", accent: "#a78bfa", border: "#7C3AED" },
  { id: "ocean", name: "Ocean", desc: "ლურჯი, სუფთა", bg: "#021825", accent: "#22d3ee", border: "#22d3ee" },
  { id: "forest", name: "Forest", desc: "მწვანე, ორგანული", bg: "#021a0e", accent: "#22c55e", border: "#22c55e" },
  { id: "sunset", name: "Sunset", desc: "ნარინჯი, თბილი", bg: "#1c0f00", accent: "#f59e0b", border: "#f59e0b" },
  { id: "minimal", name: "Minimal", desc: "თეთრი, მინიმალური", bg: "#ffffff", accent: "#7C3AED", border: "#e2e8f0" },
  { id: "bold", name: "Bold Purple", desc: "მეწამული, თამამი", bg: "#7C3AED", accent: "#ffffff", border: "#5b21b6" },
];

export function presentationTemplate(id: string): PresentationTemplate {
  return (
    PRESENTATION_TEMPLATES.find((template) => template.id === id) ??
    (PRESENTATION_TEMPLATES.find((template) => template.id === DEFAULT_TEMPLATE_ID) as PresentationTemplate)
  );
}
