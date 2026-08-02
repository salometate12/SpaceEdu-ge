import { CalendarClock, Sparkles, TrendingUp } from "lucide-react";
import { getDaysUntilExam, type UserProfile } from "@/lib/profile";

interface MetricCardsProps {
  user: UserProfile;
}

export function MetricCards({ user }: MetricCardsProps) {
  const daysUntilExam = getDaysUntilExam(user.examDate);
  const examPassed = daysUntilExam === 0;

  const metrics = [
    {
      label: "ამ კვირის სესიები",
      value: String(user.weekSessions),
      sub: `+${user.weekDiff} გასულ კვირაზე`,
      color: "var(--accent-green)",
      icon: TrendingUp,
      highlight: false,
    },
    {
      label: "გამოცდამდე",
      value: examPassed ? "🎓" : String(daysUntilExam),
      sub: examPassed ? "წარმატებები!" : "დღე დარჩა",
      color: "var(--accent-amber)",
      icon: CalendarClock,
      highlight: true,
    },
    {
      label: "Quiz სიზუსტე",
      value: `${user.avgQuizScore}%`,
      sub: `+${user.quizImprovement}% ამ თვეში`,
      color: "var(--accent-purple)",
      icon: Sparkles,
      highlight: false,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className={`card relative overflow-hidden py-5 ${
            metric.highlight ? "border-[color-mix(in_oklab,var(--accent-amber),transparent_50%)]" : ""
          }`}
          style={
            metric.highlight
              ? { boxShadow: "0 0 0 1px color-mix(in oklab, var(--accent-amber), transparent 75%)" }
              : undefined
          }
        >
          {metric.highlight && (
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-[0.14] blur-2xl"
              style={{ background: metric.color }}
              aria-hidden
            />
          )}
          <div className="relative flex items-center justify-between">
            <p className="text-xs text-[var(--text-secondary)]">{metric.label}</p>
            <metric.icon
              className="h-4 w-4 stroke-[1.75]"
              style={{ color: metric.color }}
            />
          </div>
          <p
            className="mono relative mt-2 text-3xl font-bold"
            style={{ color: metric.color }}
          >
            {metric.value}
          </p>
          <p className="relative mt-1 text-xs text-[var(--text-secondary)]">{metric.sub}</p>
        </article>
      ))}
    </section>
  );
}
