"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { takeMovedToast } from "@/lib/migrations/lecture-notes-to-subjects";
import { SUBJECT_NOTES_UPDATED_EVENT } from "@/lib/subject-notes";

/** Once, after the lecture notes moved: where they are now (with a link, off the subjects page). */
export function LectureNotesMovedToast({ link = true }: { link?: boolean }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let timer = 0;
    const check = () => {
      if (!takeMovedToast()) return;
      setShown(true);
      timer = window.setTimeout(() => setShown(false), 6000);
    };
    void Promise.resolve().then(check);
    // The move may happen a moment later, once the account's copy is in.
    window.addEventListener(SUBJECT_NOTES_UPDATED_EVENT, check);
    return () => {
      window.removeEventListener(SUBJECT_NOTES_UPDATED_EVENT, check);
      window.clearTimeout(timer);
    };
  }, []);

  if (!shown) return null;
  // On the page itself: a transformed parent would carry a fixed element with it.
  return createPortal(
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+96px)] z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-[#ece9e4] bg-white px-4 py-3 text-[14px] font-semibold text-[#1c1a17] shadow-[0_12px_32px_-12px_rgb(15_23_42/0.3)] md:bottom-8 dark:border-[#26262e] dark:bg-[#15151b] dark:text-[#fafaf9]"
    >
      <span className="min-w-0 flex-1">ლექციის ჩანაწერები ახლა „ჩემ საგნებშია“</span>
      {link ? (
        <Link href="/subjects" className="shrink-0 font-bold text-[#e11d74] hover:underline dark:text-[#f472b6]">
          გახსნა
        </Link>
      ) : null}
    </div>,
    document.body,
  );
}
