"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Pin, StickyNote } from "lucide-react";
import {
  formatGeorgianDate,
  journalHref,
  previewLectureNote,
  stickerToneForId,
  type LectureNote,
} from "@/lib/lecture-notes";

interface DashboardStickyNoteProps {
  note: LectureNote;
  className?: string;
}

export function DashboardStickyNote({ note, className = "" }: DashboardStickyNoteProps) {
  const tone = stickerToneForId(note.id);
  const title = note.title.trim() || "უსათაურო ლექცია";
  const keywords = note.aiKeywords.slice(0, 3);
  const href = journalHref(note.id, note.section);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12, rotate: -1.2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      whileHover={{ y: -4, rotate: -0.6 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-3xl border p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] backdrop-blur-md ${tone.card} ${className}`}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/40 blur-2xl dark:bg-white/10" />
      <div className={`relative flex items-start justify-between gap-3 ${tone.ink}`}>
        <div className="min-w-0">
          <p className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${tone.muted}`}>
            <StickyNote className="h-3.5 w-3.5" />
            ლექციის ნოტი
          </p>
          <h3 className="mt-1 truncate text-lg font-bold tracking-tight">{title}</h3>
          <p className={`mt-0.5 text-xs font-medium ${tone.muted}`}>{formatGeorgianDate(note.date)}</p>
        </div>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/50 ${tone.muted}`}>
          <Pin className="h-3.5 w-3.5" />
        </span>
      </div>

      <p className={`relative mt-3 line-clamp-3 text-sm leading-relaxed ${tone.ink}`}>{previewLectureNote(note.content)}</p>

      {keywords.length > 0 && (
        <div className="relative mt-3 flex flex-wrap gap-1.5">
          {keywords.map((tag) => (
            <span key={tag} className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${tone.chip}`}>
              #{tag.replace(/\s+/g, "_")}
            </span>
          ))}
        </div>
      )}

      <Link
        href={href}
        className={`relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-2 text-xs font-bold transition hover:bg-white ${tone.ink}`}
      >
        ნოტის გახსნა
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </motion.article>
  );
}
