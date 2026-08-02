import type { UserProfile } from "@/lib/profile";

interface MetricCardsProps {
  user: UserProfile;
}

export function MetricCards({ user }: MetricCardsProps) {
  const daysUntilExam = Math.max(
    0,
    Math.ceil(
      (new Date(user.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    ),
  );

  const metrics = [
    {
      label: "ამ კვირის სესიები",
      value: user.weekSessions,
      sub: `+${user.weekDiff} გასულ კვირაზე`,
      color: "var(--accent-green)",
    },
    {
      label: "გამოცდამდე",
      value: daysUntilExam,
      sub: "დღე დარჩა",
      color: "var(--accent-amber)",
    },
    {
      label: "Quiz სიზუსტე",
      value: `${user.avgQuizScore}%`,
      sub: `+${user.quizImprovement}% ამ თვეში`,
      color: "var(--accent-purple)",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {metrics.map((metric) => (
        <article key={metric.label} className="card py-5">
          <p className="text-xs text-[var(--text-secondary)]">{metric.label}</p>
          <p className="mono mt-2 text-2xl font-semibold" style={{ color: metric.color }}>
            {metric.value}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{metric.sub}</p>
        </article>
      ))}
    </section>
  );
}
