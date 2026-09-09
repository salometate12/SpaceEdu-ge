import type { ReactNode } from "react";

/**
 * One sheet in the landing's notebook.
 *
 * The page is a stack of separate sheets rather than one endless roll of
 * paper: the dark ground shows through between them and every sheet keeps
 * its own drawn edge, so moving from one group of sections to the next
 * reads as turning to a new page. Sections keep their own `<section>` and
 * anchor id — this only lays paper underneath them.
 */
export function NotebookSheet({ children }: { children: ReactNode }) {
  return (
    <div className="notebook-paper notebook-sheet relative overflow-hidden rounded-[1.75rem] sm:rounded-[2.5rem]">
      {children}
    </div>
  );
}
