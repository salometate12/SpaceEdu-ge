import {
  Brain,
  Calculator,
  FileSearch,
  Layers,
  PlayCircle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { researchPlatformHref } from "@/lib/space-back-navigation";
import {
  DASHBOARD_TOOL_ACCENTS,
  NEON_SUBJECT_ACCENTS,
  type NeonSubjectAccent,
} from "@/lib/abiturient-neon-accents";

export interface AbiturientTool {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent: NeonSubjectAccent;
}

/** IDs are prefixed "abit-" so usage-tracking never collides with student tool IDs. */
export const ABITURIENT_TOOLS: AbiturientTool[] = [
  {
    id: "abit-conspectus",
    title: "AI კონსპექტი",
    description: "კონსპექტების გენერაცია საგნის მიხედვით",
    href: "/lit-assistant",
    icon: Sparkles,
    accent: DASHBOARD_TOOL_ACCENTS.conspectus,
  },
  {
    id: "abit-quiz",
    title: "ინტერაქციული ვიქტორინა",
    description: "კითხვები პროგრამის მიხედვით და სწრაფი შეფასება",
    href: "/quiz",
    icon: Brain,
    accent: DASHBOARD_TOOL_ACCENTS.quiz,
  },
  {
    id: "abit-calculator",
    title: "უნივერსიტეტის კალკულატორი",
    description: "შეფასება საგნების ქულებით და პროგნოზი",
    href: "/exam-calculator",
    icon: Calculator,
    accent: DASHBOARD_TOOL_ACCENTS.calculator,
  },
  {
    id: "abit-research",
    title: "მასალა → ანალიზი",
    description: "PDF, ფოტო, ტექსტი, აუდიო — ერთად გაანალიზე",
    href: researchPlatformHref("abit"),
    icon: FileSearch,
    accent: DASHBOARD_TOOL_ACCENTS.research,
  },
  {
    id: "abit-georgian-quiz",
    title: "ქართული: კითხვების პანელი",
    description: "გაიმეორე ბანკის კითხვები და შეამოწმე პასუხები",
    href: "/quiz?from=georgian",
    icon: PlayCircle,
    accent: NEON_SUBJECT_ACCENTS.georgian,
  },
  {
    id: "abit-georgian-cards",
    title: "ქართული: ბარათების სესია",
    description: "ინტერაქტიული ფლეშბარათები გამოცდის სიმოკლის გასაამაგრებლად",
    href: "/generate?from=georgian",
    icon: Layers,
    accent: NEON_SUBJECT_ACCENTS.english,
  },
];
