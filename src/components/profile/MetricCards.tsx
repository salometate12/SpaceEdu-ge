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
      hex: "#10B981",
      textColor: "text-emerald-300",
      icon: TrendingUp,
      highlight: false,
    },
    {
      label: "გამოცდამდე",
      value: examPassed ? "🎓" : String(daysUntilExam),
      sub: examPassed ? "წარმატებები!" : "დღე დარჩა",
      hex: "#F59E0B",
      textColor: "text-amber-300",
      icon: CalendarClock,
      highlight: true,
    },
    {
      label: "Quiz სიზუსტე",
      value: `${user.avgQuizScore}%`,
      sub: `+${user.quizImprovement}% ამ თვეში`,
      hex: "#A78BFA",
      textColor: "text-violet-300",
      icon: Sparkles,
      highlight: false,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className={`relative overflow-hidden rounded-2xl border bg-[#13131A]/60 p-5 backdrop-blur-xl transition-colors ${
            metric.highlight
              ? "border-amber-500/25 hover:border-amber-500/40"
              : "border-white/10 hover:border-white/[0.15]"
          }`}
        >
          <div
            className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${
              metric.highlight ? "opacity-[0.18]" : "opacity-[0.1]"
            }`}
            style={{ background: metric.hex }}
            aria-hidden
          />
          <div className="relative flex items-center justify-between">
            <p className="text-xs text-zinc-500">{metric.label}</p>
            <metric.icon className={`h-4 w-4 stroke-[1.75] ${metric.textColor}`} />
          </div>
          <p className={`mono relative mt-2 text-3xl font-bold ${metric.textColor}`}>
            {metric.value}
          </p>
          <p className="relative mt-1 text-xs text-zinc-500">{metric.sub}</p>
        </article>
      ))}
    </section>
  );
}
