import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { notoSerifGeorgian } from "@/fonts/serif";
import { PresentationApp } from "@/components/presentation/PresentationApp";

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
