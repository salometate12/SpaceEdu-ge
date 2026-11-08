"use client";

import Link from "next/link";
import { FileWarning, Presentation } from "lucide-react";
import { noTextAdvice, noTextHeadline, skippedFilesLabel } from "@/lib/conspectus-empty";

/**
 * „კონსპექტი ვერ შეიქმნა“: the material had no text in it (a PPTX whose
 * slides are pictures). Nothing was saved and nothing was spent; pick
 * another file, or paste the text.
 */
export function NoTextScreen({ files }: { files: string[] }) {
  const slides = files.length > 0 && files.every((name) => /\.(pptx?|key|odp)$/i.test(name));
  const Icon = slides ? Presentation : FileWarning;
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <section
        role="alert"
        className="flex w-full max-w-[460px] flex-col items-center rounded-[24px] border border-[#ece9e4] bg-white px-6 py-9 text-center dark:border-[#26262e] dark:bg-[#15151b] sm:px-9"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff7ed] text-[#c2410c] dark:bg-[rgba(251,146,60,0.12)] dark:text-[#fdba74]">
          <Icon className="h-7 w-7" aria-hidden />
        </span>
        <p className="mt-4 text-[12.5px] font-semibold text-[#78716c] dark:text-[#a1a1aa]">კონსპექტი ვერ შეიქმნა</p>
        <h1 className="mt-1 text-[20px] font-bold leading-snug text-[#1c1a17] dark:text-[#fafaf9]">{noTextHeadline(files)}</h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-[#57534e] dark:text-[#d4d4d8]">{noTextAdvice(files)}</p>
        <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/generate?tab=new&mode=summary"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#e11d74] px-5 text-[14.5px] font-semibold text-white hover:bg-[#be185d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e11d74] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#15151b]"
          >
            სხვა ფაილის არჩევა
          </Link>
          <Link
            href="/generate?tab=new&mode=summary&source=text"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#e7e5e4] px-5 text-[14.5px] font-semibold text-[#1c1a17] hover:bg-[#f5f4f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e11d74] dark:border-[#2e2e38] dark:text-[#fafaf9] dark:hover:bg-[#1f1f27]"
          >
            ტექსტის ჩასმა
          </Link>
        </div>
      </section>
    </div>
  );
}

/** Above a conspectus made without some of its files. */
export function SkippedFilesChip({ files }: { files: string[] }) {
  if (files.length === 0) return null;
  return (
    <div className="shrink-0 px-4 pt-3 lg:px-8 print:hidden">
      <p
        title={files.join(", ")}
        className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#fff7ed] px-3 py-1.5 text-[13px] font-semibold text-[#c2410c] dark:bg-[rgba(251,146,60,0.12)] dark:text-[#fdba74]"
      >
        <FileWarning className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate">{skippedFilesLabel(files.length)}</span>
      </p>
    </div>
  );
}
