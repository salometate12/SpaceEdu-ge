import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ToolPageHeader } from "@/components/layout/ToolPageHeader";
import { PresentationApp } from "@/components/presentation/PresentationApp";

export default function PresentationPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <ToolPageHeader
        title="პრეზენტაციების გენერატორი"
        subtitle="მიუთითე თემა და AI წამებში მოგიმზადებს სრულყოფილ სლაიდების სტრუქტურასა და ტექსტებს"
      />
      {/* ?id= is read on the client; the header above still prerenders. */}
      <Suspense
        fallback={
          <div className="flex min-h-[30vh] items-center justify-center text-slate-500 dark:text-zinc-500">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        }
      >
        <PresentationApp />
      </Suspense>
    </main>
  );
}
