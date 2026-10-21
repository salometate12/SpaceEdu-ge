"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { A4_WIDTH_PX, sheetScale } from "@/lib/cv-sheet";

/**
 * Shows the A4 CV sheet as a page: full size when there's room, scaled down
 * (not reflowed) on narrow screens, so a phone shows what the PDF will be.
 * The sheet is the only frame (a light shadow); no scroll box of its own —
 * it scrolls with the page.
 */
export function CvSheetFrame({ children, fit = true }: { children: ReactNode; fit?: boolean }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!fit) return;
    const box = boxRef.current;
    const sheet = sheetRef.current;
    if (!box || !sheet) return;
    const measure = () => {
      setScale(sheetScale(box.clientWidth));
      setHeight(sheet.offsetHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(sheet);
    return () => observer.disconnect();
  }, [fit]);

  if (!fit) {
    return <div ref={sheetRef} className="overflow-hidden rounded-md">{children}</div>;
  }

  return (
    <div ref={boxRef} className="w-full">
      <div
        className="relative mx-auto overflow-hidden rounded-md shadow-[0_10px_30px_-12px_rgb(15_23_42/0.35)] ring-1 ring-black/5 dark:ring-white/10"
        style={{ width: A4_WIDTH_PX * scale, height: height === null ? undefined : height * scale }}
      >
        <div ref={sheetRef} style={{ width: A4_WIDTH_PX, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
