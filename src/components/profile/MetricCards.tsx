import { CalendarClock, GraduationCap, Sparkles, TrendingUp } from "lucide-react";
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
      value: examPassed ? null : String(daysUntilExam),
      sub: examPassed ? "წარმატებები!" : "დღე დარჩა",
      bg: "#fef3c7",
      text: "#92400e",
      icon: examPassed ? GraduationCap : CalendarClock,
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
          className="relative overflow-hidden rounded-[28px] p-5 transition-transform hover:-translate-y-1"
          style={{ background: metric.bg }}
        >
          <div className="relative flex items-center justify-between">
            <p className="text-xs font-bold" style={{ color: metric.text, opacity: 0.8 }}>
              {metric.label}
            </p>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: "rgb(255 255 255 / 0.55)" }}
            >
              <metric.icon className="h-4 w-4 stroke-[2]" style={{ color: metric.text }} />
            </span>
          </div>
          <p className="mono relative mt-3 text-4xl font-black" style={{ color: metric.text }}>
            {metric.value ?? <metric.icon className="h-9 w-9" strokeWidth={2.25} />}
          </p>
          <p className="relative mt-1 text-xs font-bold" style={{ color: metric.text, opacity: 0.75 }}>
            {metric.sub}
          </p>
        </article>
      ))}
    </section>
  );
}
