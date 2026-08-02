import type { SubjectProgress as SubjectProgressItem } from "@/lib/profile";

interface SubjectProgressProps {
  subjects: SubjectProgressItem[];
}

export function SubjectProgress({ subjects }: SubjectProgressProps) {
  return (
    <section className="card">
      <h3 className="headline mb-4 text-lg font-semibold">საგნობრივი პროგრესი</h3>
      <div className="space-y-3">
        {subjects.map((subject) => (
          <div key={subject.name} className="group">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-sm">
                <span className="mr-1.5">{subject.icon}</span>
                {subject.name}
              </p>
              <span className="mono text-xs text-[var(--text-secondary)]">
                {subject.progress}%
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-[var(--border)]"
              title={`${subject.quizzesDone} quiz | ბოლო: ${subject.lastStudied}`}
            >
              <div
                className="animated-progress h-full rounded-full transition-all"
                style={{
                  width: `${subject.progress}%`,
                  backgroundColor: subject.color,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-[var(--text-secondary)] opacity-0 transition-opacity group-hover:opacity-100">
              {subject.quizzesDone} quiz | ბოლო: {subject.lastStudied}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
