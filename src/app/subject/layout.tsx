import { ScrollToTopButton } from "@/components/abiturient/ScrollToTopButton";

/**
 * Wraps every subject page (hubs, practices, past-exam runners and their
 * results). The scroll-to-top button lives here so it is available on the long,
 * scroll-heavy pages — the exam runners and the finished results sheets — and
 * stays hidden on short pages, since it only appears once the reader scrolls
 * well down.
 */
export default function SubjectLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <ScrollToTopButton />
    </>
  );
}
