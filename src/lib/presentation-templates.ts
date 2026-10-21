import type { PresentationTemplate } from "@/lib/presentation-types";

/** The designs a deck can use (colours for the slides are in presentation-theme). */
export const PRESENTATION_TEMPLATES: PresentationTemplate[] = [
  { id: "galaxy", name: "Galaxy", desc: "მუქი, კოსმოსური", bg: "#0f0520", accent: "#a78bfa", border: "#7C3AED" },
  { id: "ocean", name: "Ocean", desc: "ლურჯი, სუფთა", bg: "#021825", accent: "#22d3ee", border: "#22d3ee" },
  { id: "forest", name: "Forest", desc: "მწვანე, ორგანული", bg: "#021a0e", accent: "#22c55e", border: "#22c55e" },
  { id: "sunset", name: "Sunset", desc: "ნარინჯი, თბილი", bg: "#1c0f00", accent: "#f59e0b", border: "#f59e0b" },
  { id: "minimal", name: "Minimal", desc: "თეთრი, მინიმალური", bg: "#ffffff", accent: "#7C3AED", border: "#e2e8f0" },
  { id: "bold", name: "Bold Purple", desc: "მეწამული, თამამი", bg: "#7C3AED", accent: "#ffffff", border: "#5b21b6" },
];

export function presentationTemplate(id: string): PresentationTemplate {
  return PRESENTATION_TEMPLATES.find((template) => template.id === id) ?? PRESENTATION_TEMPLATES[0];
}
