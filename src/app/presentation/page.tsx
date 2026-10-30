import { Suspense } from "react";
import { Noto_Serif_Georgian } from "next/font/google";
import { Loader2 } from "lucide-react";
import { PresentationApp } from "@/components/presentation/PresentationApp";

/** Paper's slide titles (the sans font is the site's own). */
const notoSerifGeorgian = Noto_Serif_Georgian({
  variable: "--font-noto-serif-georgian",
  subsets: ["georgian", "latin"],
  weight: ["600", "700"],
});

export default function PresentationPage() {
  return (
    <div className={notoSerifGeorgian.variable}>
      {/* ?id= is read on the client, so the whole page (header included) is. */}
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center text-slate-500 dark:text-zinc-500">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        }
      >
        <PresentationApp />
      </Suspense>
    </div>
  );
}
