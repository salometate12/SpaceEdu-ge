/**
 * The phone's „ხელსაწყოები“ menu: one grid of tiles built from the rail's
 * groups (buildRailGroups — the student's or the abiturient's), searchable.
 * Pure, so the list and the search are testable.
 */
import type { RailItem } from "@/components/dashboard/DashboardSideRail";

export interface ToolTile extends RailItem {
  color: string;
  /** Other words people search with: „ჩატი“ for the AI teacher, „რეზიუმე“ for the CV… */
  keywords: string[];
}

/** The logo's palette; a tile's colour follows its tool. */
export const TOOL_PALETTE = ["#f472b6", "#7dd3fc", "#facc15", "#4ade80", "#fb923c", "#2dd4bf"] as const;

const TOOL_COLORS: Record<string, string> = {
  "ai-teacher": "#f472b6",
  "ai-chat": "#f472b6",
  presentation: "#7dd3fc",
  cv: "#facc15",
  research: "#4ade80",
  conspectus: "#4ade80",
  "lecture-notes": "#fb923c",
  journal: "#2dd4bf",
  syllabus: "#7dd3fc",
  "study-plan": "#facc15",
  quiz: "#fb923c",
  "quiz-tool": "#fb923c",
  flashcards: "#f59e0b",
  "my-materials": "#f472b6",
  calculator: "#2dd4bf",
  library: "#4ade80",
  "summer-reading": "#facc15",
  stats: "#7dd3fc",
  settings: "#2dd4bf",
  admin: "#fb923c",
};

const KEYWORDS: Record<string, string[]> = {
  "ai-teacher": ["ჩატი", "კითხვა", "chat", "ai", "მასწავლებელი"],
  "ai-chat": ["ჩატი", "კითხვა", "chat", "ai", "მასწავლებელი"],
  presentation: ["სლაიდები", "slides", "პრეზენტაცია", "pptx"],
  cv: ["რეზიუმე", "resume", "cv"],
  research: ["კონსპექტი", "pdf", "მასალა", "ანალიზი"],
  conspectus: ["კონსპექტი", "pdf"],
  syllabus: ["თარიღები", "გამოცდები", "სილაბუსი"],
  quiz: ["ქვიზი", "ტესტი", "quiz", "test"],
  "quiz-tool": ["ქვიზი", "ტესტი", "quiz", "test"],
  flashcards: ["ბარათები", "ფლეშბარათები", "flashcards", "გამეორება"],
  "my-materials": ["მასალები", "ბიბლიოთეკა", "დასტები", "ქვიზები", "კონსპექტები", "library"],
  "study-plan": ["გეგმა", "კალენდარი", "plan"],
  "lecture-notes": ["ნოტები", "ჩანაწერი", "notes"],
  journal: ["დღიური", "ჩანაწერები"],
  calculator: ["ქულები", "კალკულატორი"],
  library: ["წიგნები", "ბიბლიოთეკა"],
  stats: ["პროგრესი", "სტატისტიკა"],
  settings: ["პარამეტრები", "თემა", "settings"],
};

/** Most-used first; anything else (subjects…) keeps its rail order after. */
const ORDER = [
  "ai-teacher",
  "ai-chat",
  "presentation",
  "cv",
  "research",
  "conspectus",
  "lecture-notes",
  "journal",
  "syllabus",
  "study-plan",
  "quiz",
  "quiz-tool",
  "flashcards",
  "my-materials",
  "calculator",
  "library",
  "summer-reading",
];
const LAST = ["stats", "settings", "admin"];

/** On the dock already. */
const ON_DOCK = new Set(["dashboard", "profile"]);

/** Not in the menu: lecture notes live in the journal now. */
const NOT_IN_MENU = new Set(["lecture-notes"]);

/** The menu's own names where the rail's differ. */
const TILE_LABELS: Record<string, string> = {
  research: "მასალის ანალიზი",
  admin: "ადმინ პანელი",
};

export function buildToolTiles(groups: { items: RailItem[] }[], { isAdmin = false }: { isAdmin?: boolean } = {}): ToolTile[] {
  const seen = new Set<string>();
  const items = groups
    .flatMap((group) => group.items)
    .filter((item) => !ON_DOCK.has(item.id) && !NOT_IN_MENU.has(item.id) && (item.id !== "admin" || isAdmin))
    .filter((item) => {
      // The same page under two names (the abiturient's two quiz entries).
      const target = item.href ?? `action:${item.id}`;
      if (seen.has(target)) return false;
      seen.add(target);
      return true;
    });
  const rank = (id: string) => {
    if (LAST.includes(id)) return 1000 + LAST.indexOf(id);
    const index = ORDER.indexOf(id);
    return index === -1 ? 500 : index;
  };
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => rank(a.item.id) - rank(b.item.id) || a.index - b.index)
    .map(({ item }, index) => ({
      ...item,
      label: TILE_LABELS[item.id] ?? item.label,
      color: TOOL_COLORS[item.id] ?? TOOL_PALETTE[index % TOOL_PALETTE.length],
      keywords: KEYWORDS[item.id] ?? [],
    }));
}

/** Latin typed for Georgian (prez → პრეზ): the common one-letter mapping. */
const LATIN_TO_GEORGIAN: [string, string][] = [
  ["sh", "შ"], ["ch", "ჩ"], ["ts", "ც"], ["dz", "ძ"], ["kh", "ხ"], ["gh", "ღ"], ["zh", "ჟ"],
  ["a", "ა"], ["b", "ბ"], ["g", "გ"], ["d", "დ"], ["e", "ე"], ["v", "ვ"], ["z", "ზ"], ["t", "ტ"],
  ["i", "ი"], ["k", "კ"], ["l", "ლ"], ["m", "მ"], ["n", "ნ"], ["o", "ო"], ["p", "პ"], ["r", "რ"],
  ["s", "ს"], ["u", "უ"], ["f", "ფ"], ["q", "ქ"], ["y", "ყ"], ["c", "ც"], ["j", "ჯ"], ["h", "ჰ"], ["w", "წ"], ["x", "ხ"],
];

export function transliterate(text: string): string {
  let result = "";
  for (let index = 0; index < text.length; ) {
    const pair = LATIN_TO_GEORGIAN.find(([latin]) => text.startsWith(latin, index));
    if (pair) {
      result += pair[1];
      index += pair[0].length;
    } else {
      result += text[index];
      index += 1;
    }
  }
  return result;
}

/** Tiles whose name or keywords contain the query — any case, Latin or Georgian. */
export function filterTools(tiles: ToolTile[], query: string): ToolTile[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return tiles;
  const needles = [needle, transliterate(needle)];
  return tiles.filter((tile) => {
    const haystack = [tile.label, ...tile.keywords].join(" ").toLowerCase();
    return needles.some((text) => haystack.includes(text));
  });
}
