import type { SubjectProgress as SubjectProgressItem } from "@/lib/profile";

interface SubjectProgressProps {
  subjects: SubjectProgressItem[];
}

export function SubjectProgress({ subjects }: SubjectProgressProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#13131A]/60 p-6 backdrop-blur-xl transition-colors hover:border-white/[0.15]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="headline text-lg font-semibold text-white">საგნობრივი პროგრესი</h3>
        <span className="text-xs text-zinc-500">{subjects.length} საგანი</span>
      </div>
      <div className="space-y-4">
        {subjects.map((subject) => (
          <div key={subject.name}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-200">
                <span aria-hidden>{subject.icon}</span>
                {subject.name}
              </p>
              <span className="mono text-xs font-semibold" style={{ color: subject.color }}>
                {subject.progress}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="animated-progress h-full rounded-full transition-all"
                style={{
                  width: `${subject.progress}%`,
                  backgroundColor: subject.color,
                  boxShadow: `0 0 8px ${subject.color}`,
                }}
              />
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">
              {subject.quizzesDone} quiz გავლილი · ბოლო აქტივობა: {subject.lastStudied}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
