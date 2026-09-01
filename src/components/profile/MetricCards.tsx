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
      bg: "#d1fae5",
      text: "#065f46",
      icon: TrendingUp,
    },
    {
      label: "გამოცდამდე",
      value: examPassed ? "🎓" : String(daysUntilExam),
      sub: examPassed ? "წარმატებები!" : "დღე დარჩა",
      bg: "#fef3c7",
      text: "#92400e",
      icon: CalendarClock,
    },
    {
      label: "Quiz სიზუსტე",
      value: `${user.avgQuizScore}%`,
      sub: `+${user.quizImprovement}% ამ თვეში`,
      bg: "#efe9fe",
      text: "#5b21b6",
      icon: Sparkles,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className="relative overflow-hidden rounded-[24px] p-5 transition-transform hover:-translate-y-0.5"
          style={{ background: metric.bg }}
        >
          <div className="relative flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: metric.text, opacity: 0.75 }}>
              {metric.label}
            </p>
            <metric.icon className="h-4 w-4 stroke-[1.75]" style={{ color: metric.text }} />
          </div>
          <p className="mono relative mt-2 text-3xl font-extrabold" style={{ color: metric.text }}>
            {metric.value}
          </p>
          <p className="relative mt-1 text-xs font-medium" style={{ color: metric.text, opacity: 0.7 }}>
            {metric.sub}
          </p>
        </article>
      ))}
    </section>
  );
}
