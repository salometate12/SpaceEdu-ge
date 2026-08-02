"use client";

import { useMemo, useState } from "react";
import { BookOpen, Bookmark, Compass, FileText } from "lucide-react";
import { DASHBOARD_LIBRARY_ACCENTS } from "@/lib/abiturient-neon-accents";
import { DashboardGlowCard } from "./DashboardGlowCard";
import { usePreviewMode } from "@/contexts/PreviewModeContext";
import {
  DashboardMorphGrid,
  DashboardMorphItem,
} from "@/components/dashboard/DashboardMorphGrid";
import { getLibraryCardClass, isLivePreviewMode } from "@/lib/dashboard-preview-layout";

type LibraryTab = "all" | "mandatory" | "support";

const FILTERS: Array<{ id: LibraryTab; label: string }> = [
  { id: "all", label: "ყველა სახელმძღვანელო" },
  { id: "mandatory", label: "სავალდებულო" },
  { id: "support", label: "დამხმარე ლიტერატურა" },
];

type TextbookType = "mandatory" | "support";

interface Textbook {
  id: string;
  subject: string;
  title: string;
  author: string;
  type: TextbookType;
  href?: string;
}

const TEXTBOOKS: Textbook[] = [
  {
    id: "b1",
    subject: "ქართული",
    title: "ქართული ენა და ლიტერატურა",
    author: "გ. მერკვილაძე",
    type: "mandatory",
    href: "https://drive.google.com/file/d/1Vw3tSJ8zgOmESOpzqyZkwnonHZggzYjs/view",
  },
  {
    id: "b2",
    subject: "ისტორია",
    title: "საქართველოს ისტორია",
    author: "ნ. ასათიანი",
    type: "mandatory",
    href: "https://dspace.nplg.gov.ge/bitstream/1234/420973/1/Saqartvelos_Istoria_2005.pdf",
  },
  {
    id: "b3",
    subject: "მათემატიკა",
    title: "ალგებრა აბიტურიენტისთვის",
    author: "თ. შენგელია",
    type: "mandatory",
    href: "https://drive.google.com/file/d/1QROQJSqzbBhbWZGkQxwp8nkGafmS-O2p/view",
  },
  { id: "b4", subject: "ბიოლოგია", title: "სასიცოცხლო სისტემები", author: "მ. ჯანაშია", type: "support" },
  { id: "b5", subject: "ქიმია", title: "ორგანული ქიმიის საფუძვლები", author: "ლ. აფრასიძე", type: "support" },
  { id: "b6", subject: "ფიზიკა", title: "ფიზიკა ტესტებისთვის", author: "რ. ჭანტურია", type: "mandatory" },
  { id: "b7", subject: "გეოგრაფია", title: "საქართველოს გეოგრაფია", author: "ი. მაჭარაშვილი", type: "support" },
  { id: "b8", subject: "სამოქალაქო", title: "სამოქალაქო განათლება", author: "ა. ხუციშვილი", type: "mandatory" },
];

const SUMMER_READING = [
  { id: "s1", title: "The Lean Startup", author: "Eric Ries" },
  { id: "s2", title: "Atomic Habits", author: "James Clear" },
  { id: "s3", title: "Thinking, Fast and Slow", author: "Daniel Kahneman" },
  { id: "s4", title: "Sapiens", author: "Yuval Noah Harari" },
  { id: "s5", title: "Deep Work", author: "Cal Newport" },
  { id: "s6", title: "Range", author: "David Epstein" },
  { id: "s7", title: "Principles", author: "Ray Dalio" },
  { id: "s8", title: "Mindset", author: "Carol Dweck" },
];

export function AbiturientLibrary() {
  const [tab, setTab] = useState<LibraryTab>("all");
  const { previewMode } = usePreviewMode();
  const isLive = isLivePreviewMode(previewMode);
  const cardClass = getLibraryCardClass(previewMode);

  const filtered = useMemo(() => {
    if (tab === "all") return TEXTBOOKS;
    return TEXTBOOKS.filter((book) => book.type === tab);
  }, [tab]);

  return (
    <section className="dashboard-section p-5">
      <div className="mb-4">
        <BookOpen className="mb-2 h-6 w-6 text-violet-600 dark:text-purple-400" strokeWidth={1.5} />
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">სასწავლო ბიბლიოთეკა</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
          ეროვნული გამოცდების პროგრამით გათვალისწინებული სახელმძღვანელოები საგნების მიხედვით
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = tab === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setTab(filter.id)}
              className={`rounded-xl px-4 py-1.5 text-xs transition-all ${
                active
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-200/50 dark:from-purple-600 dark:to-purple-600 dark:shadow-purple-500/10"
                  : "border border-slate-200/80 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-700 dark:border-white/[0.08] dark:bg-[#161619]/60 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <DashboardMorphGrid variant="library" className="mt-6">
        {filtered.map((book) => (
          <DashboardMorphItem key={book.id} id={`abit-book-${book.id}`}>
            <DashboardGlowCard
              accent={DASHBOARD_LIBRARY_ACCENTS.textbook}
              href={book.href}
              as={book.href ? "link" : "article"}
              interactive={Boolean(book.href)}
              layoutId={`abit-book-card-${book.id}`}
              className={`${cardClass} ${book.href ? "cursor-pointer" : ""}`}
            >
              {isLive ? (
                <>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:border-white/[0.04] dark:bg-[#1a1a1e]/40">
                    <FileText className="h-5 w-5 text-violet-600 dark:text-purple-400" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-violet-600 dark:text-purple-400/80">{book.subject}</p>
                    <p className="line-clamp-1 text-sm font-medium text-slate-900 dark:text-white">{book.title}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400">{book.author}</p>
                  </div>
                  <span className="shrink-0 rounded-md border border-blue-300/50 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                    {book.href ? "PDF" : "პროგრამაშია"}
                  </span>
                </>
              ) : (
                <>
                  <div>
                    <div className="mb-3 flex h-28 w-full items-center justify-center rounded-xl border border-slate-200/80 bg-gradient-to-br from-violet-50 via-white to-indigo-50 transition-all group-hover:from-violet-100 group-hover:to-indigo-100 dark:border-white/[0.04] dark:bg-none dark:bg-[#1a1a1e]/40 dark:group-hover:bg-[#1a1a1e]/70">
                      <FileText className="h-7 w-7 text-violet-600 dark:text-purple-400" strokeWidth={1.5} />
                    </div>
                    <p className="mb-1 text-xs font-medium text-violet-600 dark:text-purple-400/80">
                      {book.subject}
                    </p>
                    <p className="line-clamp-1 text-sm font-medium text-slate-900 dark:text-white">
                      {book.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-gray-400">{book.author}</p>
                  </div>
                  <span className="mt-3 inline-block self-start rounded-md border border-blue-300/50 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                    {book.href ? "PDF · გახსნა" : "პროგრამაშია"}
                  </span>
                </>
              )}
            </DashboardGlowCard>
          </DashboardMorphItem>
        ))}
      </DashboardMorphGrid>

      <div className="my-10 border-t border-slate-200/80 dark:border-white/[0.06]" />

      <div className="mb-4">
        <Compass className="mb-2 h-6 w-6 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">საზაფხულო საკითხავი</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
          კლასგარეშე რეკომენდირებული ლიტერატურა ანალიტიკური აზროვნების გასავითარებლად
        </p>
      </div>

      <DashboardMorphGrid variant="library">
        {SUMMER_READING.map((book) => (
          <DashboardMorphItem key={book.id} id={`abit-summer-${book.id}`}>
            <DashboardGlowCard
              accent={DASHBOARD_LIBRARY_ACCENTS.summer}
              as="article"
              layoutId={`abit-summer-card-${book.id}`}
              className={`${cardClass} cursor-pointer`}
            >
              {isLive ? (
                <>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:border-white/[0.04] dark:bg-[#1a1a1e]/40">
                    <Bookmark className="h-5 w-5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-slate-900 dark:text-white">{book.title}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400">{book.author}</p>
                  </div>
                  <span className="shrink-0 rounded-md border border-emerald-300/50 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                    რეკომენდირებული
                  </span>
                </>
              ) : (
                <>
                  <div>
                    <div className="mb-3 flex h-28 w-full items-center justify-center rounded-xl border border-slate-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50 transition-all group-hover:from-emerald-100 group-hover:to-teal-100 dark:border-white/[0.04] dark:bg-none dark:bg-[#1a1a1e]/40 dark:group-hover:bg-[#1a1a1e]/70">
                      <Bookmark className="h-7 w-7 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                    </div>
                    <p className="line-clamp-1 text-sm font-medium text-slate-900 dark:text-white">
                      {book.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-gray-400">{book.author}</p>
                  </div>
                  <span className="mt-3 self-start rounded-md border border-emerald-300/50 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                    რეკომენდირებული
                  </span>
                </>
              )}
            </DashboardGlowCard>
          </DashboardMorphItem>
        ))}
      </DashboardMorphGrid>
    </section>
  );
}
