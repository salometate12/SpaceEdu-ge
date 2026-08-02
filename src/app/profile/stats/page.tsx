import Link from "next/link";
import { getProfileData } from "@/lib/profile";
import { Button } from "@/components/ui/Button";

export default async function ProfileStatsPage() {
  const { subjects } = await getProfileData();

  const weekly = [3, 4, 2, 5, 6, 4, 7];
  const heatmap = Array.from({ length: 35 }, (_, i) => (i * 7) % 5);
  const total = subjects.reduce((sum, s) => sum + s.progress, 0) || 1;
  const pieStops = subjects
    .map((s, idx) => {
      const before = subjects
        .slice(0, idx)
        .reduce((sum, item) => sum + item.progress, 0);
      const start = Math.round((before / total) * 360);
      const end = Math.round(((before + s.progress) / total) * 360);
      return `${s.color} ${start}deg ${end}deg`;
    })
    .join(", ");

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="headline text-2xl font-bold">პროფილი — სტატისტიკა</h1>
        <Link href="/profile">
          <Button variant="ghost">← პროფილზე</Button>
        </Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card">
          <h2 className="headline mb-3 text-lg font-semibold">კვირის სესიები</h2>
          <div className="flex items-end gap-2">
            {weekly.map((value, idx) => (
              <div key={idx} className="flex-1">
                <div
                  className="rounded-t-md bg-[var(--accent-purple)]"
                  style={{ height: `${value * 16}px` }}
                />
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <h2 className="headline mb-3 text-lg font-semibold">თვიური heatmap</h2>
          <div className="grid grid-cols-7 gap-1.5">
            {heatmap.map((cell, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-sm"
                style={{
                  background:
                    cell === 0
                      ? "var(--border)"
                      : `color-mix(in oklab, var(--accent-cyan), white ${90 - cell * 15}%)`,
                }}
              />
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="card">
          <h2 className="headline mb-3 text-lg font-semibold">საგნობრივი განაწილება</h2>
          <div
            className="mx-auto h-40 w-40 rounded-full"
            style={{ background: `conic-gradient(${pieStops})` }}
          />
        </article>
        <article className="card lg:col-span-2">
          <h2 className="headline mb-3 text-lg font-semibold">Quiz სიზუსტის ტრენდი</h2>
          <div className="h-40 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
            <svg viewBox="0 0 100 40" className="h-full w-full">
              <polyline
                fill="none"
                stroke="var(--accent-green)"
                strokeWidth="1.8"
                points="0,32 12,28 24,24 36,26 48,22 60,18 72,15 84,13 100,10"
              />
            </svg>
          </div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            ყველაზე პროდუქტიული დრო: 19:00 - 21:00
          </p>
        </article>
      </section>
    </main>
  );
}
