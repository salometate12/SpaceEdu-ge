"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Brain, ChevronDown, Layers, Plus } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { useDismiss } from "@/hooks/useDismiss";
import { useBackHref } from "@/components/Quiz/QuizRun";
import { MaterialsList, ResumeStrip } from "./MaterialsList";
import { useMaterials } from "./useMaterials";
import "./library.css";

type LibraryType = "decks" | "quizzes" | "conspectus";

const TYPES: { id: LibraryType; label: string }[] = [
  { id: "decks", label: "ფლეშბარათები" },
  { id: "quizzes", label: "ქვიზები" },
  { id: "conspectus", label: "კონსპექტები" },
];

/** „ახლის შექმნა“: which tool to open. */
function CreateMenu() {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useDismiss(open, () => setOpen(false), panel, trigger);
  const row = "lib-focus flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-semibold text-[var(--lib-title)] hover:bg-[var(--lib-hover)]";
  return (
    <div className="relative shrink-0">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="lib-primary lib-focus h-11 px-4 text-[14.5px] sm:h-12 sm:px-5"
      >
        <Plus className="h-4 w-4" aria-hidden />
        <span className="max-sm:sr-only">ახლის შექმნა</span>
        <ChevronDown className="h-4 w-4 max-sm:hidden" aria-hidden />
      </button>
      {open ? (
        <div
          ref={panel}
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-64 rounded-2xl border border-[var(--lib-border)] bg-[var(--lib-card)] p-1.5 shadow-[0_12px_32px_-12px_rgb(15_23_42/0.3)]"
        >
          <Link href="/generate?tab=new" role="menuitem" className={row}>
            <span className="lib-tile src-file flex h-8 w-8 items-center justify-center rounded-[9px]" aria-hidden>
              <Layers className="h-4 w-4" />
            </span>
            ფლეშბარათები ან კონსპექტი
          </Link>
          <Link href="/quiz?tab=new" role="menuitem" className={row}>
            <span className="lib-tile src-audio flex h-8 w-8 items-center justify-center rounded-[9px]" aria-hidden>
              <Brain className="h-4 w-4" />
            </span>
            ქვიზი
          </Link>
        </div>
      ) : null}
    </div>
  );
}

/**
 * „ჩემი მასალები“: every deck, quiz and conspectus the student made, one
 * kind at a time (`?type=`), with the same list as the tools' library tabs.
 */
export function LibraryPage() {
  const router = useRouter();
  const params = useSearchParams();
  const materials = useMaterials();
  const backHref = useBackHref();
  const asked = params.get("type");
  const type: LibraryType = asked === "quizzes" || asked === "conspectus" ? asked : "decks";

  const items = { decks: materials.decks, quizzes: materials.quizzes, conspectus: materials.conspectus };
  const create = { decks: "/generate?tab=new", quizzes: "/quiz?tab=new", conspectus: "/generate?tab=new" };

  return (
    <div className="lib under-site-header min-h-dvh max-md:-mt-[var(--safe-top)] max-md:-mb-36 max-md:pb-36">
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-[calc(var(--safe-top)+16px)] sm:px-6 md:pt-10">
        <header className="flex items-start gap-3 sm:gap-4">
          <BackButton fallbackHref={backHref} />
          <div className="min-w-0 flex-1">
            <h1 className="text-[24px] font-bold leading-tight tracking-tight text-[var(--lib-title)] sm:text-[30px]">ჩემი მასალები</h1>
            <p className="mt-1 text-[14.5px] text-[var(--lib-muted)] sm:text-[15.5px]">ყველაფერი, რაც შექმენი, ინახება აქ</p>
          </div>
          <CreateMenu />
        </header>

        <div role="tablist" aria-label="მასალის ტიპი" className="lib-scroll -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {TYPES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={type === item.id}
              onClick={() => router.replace(`/library?type=${item.id}`, { scroll: false })}
              className="lib-chip lib-focus h-10"
            >
              {item.label}
              <span className="lib-count">{items[item.id].length}</span>
            </button>
          ))}
        </div>

        {materials.ready ? (
          <div className="mt-5 flex flex-col gap-5" role="tabpanel">
            {type === "decks" ? <ResumeStrip items={materials.decks} kind="deck" /> : null}
            {type === "quizzes" ? <ResumeStrip items={materials.quizzes} kind="quiz" /> : null}
            <MaterialsList
              key={type}
              items={items[type]}
              kind={type === "decks" ? "deck" : type === "quizzes" ? "quiz" : "conspectus"}
              createHref={create[type]}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
