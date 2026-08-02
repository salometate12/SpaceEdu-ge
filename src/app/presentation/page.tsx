import Link from "next/link";
import { PresentationWizard } from "@/components/presentation/PresentationWizard";

export default function PresentationPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-start gap-3">
        <Link
          href="/dashboard-student"
          className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] text-zinc-300 transition hover:border-purple-400/30 hover:bg-purple-500/10 hover:text-white"
          aria-label="Dashboard"
        >
          ←
        </Link>
        <div>
          <h1 className="headline text-2xl font-bold text-zinc-100 sm:text-3xl">
            პრეზენტაციების გენერატორი
          </h1>
          <p className="mt-1 max-w-4xl text-sm text-zinc-400">
            მიუთითე თემა და AI წამებში მოგიმზადებს სრულყოფილ სლაიდების სტრუქტურასა
            და ტექსტებს
          </p>
        </div>
      </div>
      <PresentationWizard />
    </main>
  );
}
