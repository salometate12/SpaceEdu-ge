import type { SubjectProgress as SubjectProgressItem } from "@/lib/profile";

interface SubjectProgressProps {
  subjects: SubjectProgressItem[];
}

export function SubjectProgress({ subjects }: SubjectProgressProps) {
  return (
    <section className="dashboard-glass-card relative overflow-hidden rounded-[32px] p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="headline text-xl font-black text-[var(--text-primary)]">საგნობრივი პროგრესი</h3>
        <span className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-xs font-bold text-[var(--text-muted)]">
          {subjects.length} საგანი
        </span>
      </div>
      <div className="space-y-5">
        {subjects.map((subject) => (
          <div key={subject.name}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-base font-bold text-[var(--text-primary)]">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: `color-mix(in oklab, ${subject.color}, white 85%)` }}
                  aria-hidden
                >
                  <subject.icon className="h-4 w-4 stroke-[2.25]" style={{ color: subject.color }} />
                </span>
                {subject.name}
              </p>
              <span className="mono text-sm font-black" style={{ color: subject.color }}>
                {subject.progress}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[var(--border)]">
              <div
                className="animated-progress h-full rounded-full transition-all"
                style={{
                  width: `${subject.progress}%`,
                  backgroundColor: subject.color,
                }}
              />
            </div>
            <p className="mt-1.5 text-xs font-medium text-[var(--text-muted)]">
              {subject.quizzesDone} quiz გავლილი · ბოლო აქტივობა: {subject.lastStudied}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
