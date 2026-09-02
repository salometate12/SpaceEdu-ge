"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus } from "lucide-react";
import {
  JOURNAL_SECTIONS,
  LECTURE_NOTES_UPDATED_EVENT,
  createBlankLectureNote,
  journalHref,
  latestJournalNote,
  loadJournalProgress,
  loadLectureNotes,
  previewLectureNote,
  saveLectureNotes,
  type JournalSection,
  type LectureNote,
} from "@/lib/lecture-notes";

export function DashboardJournalWidget() {
  const router = useRouter();
  const [note, setNote] = useState<LectureNote | null>(null);
  const [xp, setXp] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setNote(latestJournalNote(loadLectureNotes()));
      setXp(loadJournalProgress().xp);
      setReady(true);
    };
    sync();
    window.addEventListener(LECTURE_NOTES_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(LECTURE_NOTES_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const quickAdd = (section: JournalSection) => {
    const blank = createBlankLectureNote(section);
    saveLectureNotes([blank, ...loadLectureNotes()]);
    router.push(journalHref(blank.id, section));
  };

  if (!ready) return null;

  return (
    <section className="overflow-hidden rounded-[32px] bg-[#C2186B] p-5 text-white shadow-[0_18px_40px_rgba(194,24,107,0.28)] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
        <MiniNotebook preview={note ? previewLectureNote(note.content, 48) : "ახალი გვერდი გელოდება."} />

        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-pink-100/80">Open Notebook</p>
            <h3 className="mt-1 flex items-center gap-2 text-xl font-black tracking-tight">
              <BookOpen className="h-5 w-5" />
              ციფრული ჟურნალი
            </h3>
            <p className="mt-1 text-sm text-pink-50/85">
              {note
                ? `${note.title.trim() || "უსათაურო ნოტი"} · ${xp} XP`
                : "გახსენი რვეული, ჩაწერე ლექცია და დააგროვე XP."}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {JOURNAL_SECTIONS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => quickAdd(tab.id)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold text-stone-900"
                style={{ backgroundColor: tab.tabColor }}
              >
                <Plus className="h-3 w-3" />
                {tab.label}
              </button>
            ))}
          </div>

          <Link
            href={journalHref(note?.id, note?.section)}
            className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-black text-[#C2186B] transition hover:bg-pink-50"
          >
            გახსენი სრული ჟურნალი
          </Link>
        </div>
      </div>
    </section>
  );
}

function MiniNotebook({ preview }: { preview: string }) {
  return (
    <motion.div
      whileHover={{ rotate: -1.5, y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      className="relative w-full shrink-0 lg:w-[280px]"
    >
      <div className="absolute -right-1 top-8 z-0 flex flex-col gap-1">
        {["#F9A8D4", "#7DD3FC", "#FDE047", "#5EEAD4"].map((color) => (
          <span key={color} className="h-7 w-3 rounded-r-sm" style={{ backgroundColor: color }} />
        ))}
      </div>
      <div className="relative z-10 flex min-h-[148px] overflow-hidden rounded-l-[22px] rounded-r-[22px] bg-[#FFFDF8] shadow-[0_12px_24px_rgba(80,0,30,0.28)]">
        <span className="pointer-events-none absolute left-0 top-1/2 z-20 h-8 w-3 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-gradient-to-b from-slate-200 to-slate-500" />
        <span className="pointer-events-none absolute right-0 top-1/2 z-20 h-8 w-3 translate-x-1/2 -translate-y-1/2 rounded-sm bg-gradient-to-b from-slate-200 to-slate-500" />
        <div
          className="w-1/2 border-r border-[#eadfd0] p-3"
          style={{
            backgroundImage:
              "repeating-linear-gradient(transparent, transparent 11px, rgba(196,80,120,0.18) 12px)",
          }}
        >
          <p className="line-clamp-5 text-[10px] leading-[12px] text-stone-600">{preview}</p>
        </div>
        <div className="relative w-1/2 p-3">
          <span className="absolute left-4 top-4 h-8 w-8 -rotate-6 rounded-full bg-orange-200" />
          <span className="absolute right-5 top-10 h-6 w-10 rotate-8 rounded-full bg-teal-400" />
          <span className="absolute bottom-5 left-6 h-7 w-7 -rotate-3 rounded-md bg-violet-500" />
        </div>
      </div>
    </motion.div>
  );
}
