import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function ProfileEditPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="headline text-2xl font-bold">პროფილის რედაქტირება</h1>
        <Link href="/profile">
          <Button variant="ghost">← პროფილზე</Button>
        </Link>
      </div>

      <section className="card space-y-4">
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--text-secondary)]">სახელი</span>
          <input
            defaultValue="სალომე თათეშვილი"
            className="w-full rounded-xl border border-[var(--border-hover)] bg-[var(--bg-secondary)] px-3 py-2 outline-none focus:border-[var(--accent-purple)]"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--text-secondary)]">სივრცე</span>
          <select
            defaultValue="abiturient"
            className="w-full rounded-xl border border-[var(--border-hover)] bg-[var(--bg-secondary)] px-3 py-2 outline-none focus:border-[var(--accent-purple)]"
          >
            <option>school</option>
            <option>abiturient</option>
            <option>student</option>
          </select>
        </label>
        <div className="flex justify-end">
          <Button>შენახვა</Button>
        </div>
      </section>
    </main>
  );
}
