"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronDown, FolderOpen, Plus, Search } from "lucide-react";
import {
  filterMaterials,
  materialHref,
  resumeCandidate,
  sortMaterials,
  type MaterialFilter,
  type MaterialItem,
  type MaterialKind,
  type MaterialSort,
} from "@/lib/library/materials";
import { MaterialCard, SourceTile } from "./MaterialCard";
import "./library.css";

/** Cards shown before „მეტის ჩვენება“. */
const PAGE = 12;

const DONE_LABEL: Record<MaterialKind, string | null> = {
  deck: "ნასწავლი",
  quiz: "დასრულებული",
  conspectus: null,
  task: "დასრულებული",
};

const LATER_KEY = "spaceedu-resume-later";

/** „მოგვიანებით“: hidden for this visit. */
function laterIds(): string[] {
  try {
    return JSON.parse(window.sessionStorage.getItem(LATER_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function progressLine(item: MaterialItem): string {
  if (item.deck) return `ვიცი ${item.deck.known} · გასამეორებელი ${item.deck.unknown} · ${item.deck.cards} ბარათი`;
  if (item.quiz) return `${item.quiz.answered} / ${item.quiz.questions} კითხვა`;
  return "";
}

/** „გააგრძელე, სადაც გაჩერდი“ above the list: the last unfinished deck or quiz. */
export function ResumeStrip({ items, kind }: { items: MaterialItem[]; kind: "deck" | "quiz" }) {
  const [later, setLater] = useState<string[] | null>(null);
  useEffect(() => {
    void Promise.resolve().then(() => setLater(laterIds()));
  }, []);
  const item = useMemo(() => resumeCandidate(items.filter((entry) => !later?.includes(entry.key))), [items, later]);
  if (!later || !item) return null;

  const dismiss = () => {
    const next = [...later, item.key];
    setLater(next);
    try {
      window.sessionStorage.setItem(LATER_KEY, JSON.stringify(next));
    } catch {
      // storage blocked: hidden until the page reloads
    }
  };

  const tone =
    kind === "quiz"
      ? "border-[var(--lib-resume-quiz-border)] bg-[var(--lib-resume-quiz)]"
      : "border-[var(--lib-resume-border)] bg-[var(--lib-resume-deck)]";

  return (
    <section aria-label="გაგრძელება" className={`flex flex-col gap-3 rounded-[20px] border p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5 ${tone}`}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <SourceTile item={item} />
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold text-[var(--lib-muted)]">გააგრძელე, სადაც გაჩერდი</p>
          <p className="truncate text-[15.5px] font-bold text-[var(--lib-title)]">{item.title}</p>
          <p className="truncate text-[13px] text-[var(--lib-text)]">{progressLine(item)}</p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2 max-sm:[&>*]:flex-1">
        <button type="button" onClick={dismiss} className="lib-secondary lib-focus h-10 px-4 text-[14px]">
          მოგვიანებით
        </button>
        <Link href={materialHref(item)} className="lib-primary lib-focus h-10 px-4 text-[14px]">
          გაგრძელება
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

/**
 * The one list of saved materials, for /library and the library tab of
 * /generate and /quiz: search, „ყველა / დაუმთავრებელი / ნასწავლი“, sort,
 * then cards three, two or one across, twelve at a time.
 */
export function MaterialsList({
  items,
  kind,
  createHref,
  onCreate,
  createLabel = "შექმენი პირველი",
}: {
  items: MaterialItem[];
  kind: MaterialKind;
  /** Where „შექმენი პირველი“ goes, or `onCreate` on the tool's own page (its „ახალი“ tab). */
  createHref?: string;
  onCreate?: () => void;
  createLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MaterialFilter>("all");
  const [sort, setSort] = useState<MaterialSort>("opened");
  const [shown, setShown] = useState(PAGE);

  const visible = useMemo(() => sortMaterials(filterMaterials(items, { query, filter }), sort), [items, query, filter, sort]);

  if (items.length === 0) {
    return (
      <div className="lib-card flex flex-col items-center gap-3 px-6 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--lib-soft)] text-[var(--lib-muted)]" aria-hidden>
          <FolderOpen className="h-5 w-5" />
        </span>
        <p className="text-[17px] font-bold text-[var(--lib-title)]">ჯერ არაფერი შეგიქმნია</p>
        <p className="max-w-sm text-[14px] text-[var(--lib-muted)]">რასაც შექმნი, აქ შეინახება და ნებისმიერ დროს გააგრძელებ.</p>
        {onCreate ? (
          <button type="button" onClick={onCreate} className="lib-primary lib-focus mt-1 h-11 px-5 text-[14.5px]">
            <Plus className="h-4 w-4" aria-hidden />
            {createLabel}
          </button>
        ) : (
          <Link href={createHref ?? "/library"} className="lib-primary lib-focus mt-1 h-11 px-5 text-[14.5px]">
            <Plus className="h-4 w-4" aria-hidden />
            {createLabel}
          </Link>
        )}
      </div>
    );
  }

  const doneLabel = DONE_LABEL[kind];
  const filters: { id: MaterialFilter; label: string }[] = [
    { id: "all", label: "ყველა" },
    ...(kind === "conspectus" ? [] : [{ id: "unfinished" as const, label: "დაუმთავრებელი" }]),
    ...(doneLabel ? [{ id: "done" as const, label: doneLabel }] : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative flex h-11 items-center md:w-[300px]">
          <Search className="pointer-events-none absolute left-4 h-4 w-4 text-[var(--lib-muted)]" aria-hidden />
          <span className="sr-only">ძებნა</span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setShown(PAGE);
            }}
            placeholder="ძებნა"
            className="h-11 w-full rounded-full border border-[var(--lib-field-border)] bg-[var(--lib-card)] pl-10 pr-4 text-[14.5px] text-[var(--lib-title)] outline-none placeholder:text-[var(--lib-muted)] focus:border-transparent focus:shadow-[0_0_0_2px_#e11d74]"
          />
        </label>
        <div className="lib-scroll -mx-4 flex items-center gap-2 overflow-x-auto px-4 md:mx-0 md:flex-1 md:px-0">
          {filters.length > 1
            ? filters.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={filter === option.id}
                  onClick={() => {
                    setFilter(option.id);
                    setShown(PAGE);
                  }}
                  className="lib-chip lib-focus"
                >
                  {option.label}
                </button>
              ))
            : null}
          <label className="relative ml-auto flex shrink-0 items-center">
            <span className="sr-only">დალაგება</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as MaterialSort)}
              // Room for the chevron (the chip's own padding would cover it).
              style={{ paddingRight: 38 }}
              className="lib-chip lib-focus cursor-pointer appearance-none"
            >
              <option value="opened">ბოლოს გახსნილი</option>
              <option value="newest">ახალი</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-[var(--lib-muted)]" aria-hidden />
          </label>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="lib-card px-6 py-10 text-center text-[14.5px] text-[var(--lib-muted)]">ვერაფერი მოიძებნა</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {visible.slice(0, shown).map((item) => (
            <MaterialCard key={item.key} item={item} />
          ))}
        </div>
      )}

      {visible.length > shown ? (
        <button type="button" onClick={() => setShown((value) => value + PAGE)} className="lib-secondary lib-focus mx-auto h-11 px-6 text-[14.5px]">
          მეტის ჩვენება
        </button>
      ) : null}
    </div>
  );
}
