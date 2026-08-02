import Link from "next/link";
import { Award, Flame, Layers, Target } from "lucide-react";
import { getSpaceLabel, type UserProfile } from "@/lib/profile";
import { Button } from "@/components/ui/Button";

interface ProfileCardProps {
  user: UserProfile;
}

const SPACE_BADGE: Record<UserProfile["space"], string> = {
  school: "bg-purple-500/15 text-purple-300 border-purple-500/40",
  abiturient: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
  student: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
};

export function ProfileCard({ user }: ProfileCardProps) {
  const quickStats = [
    { label: "სესია", value: user.totalSessions, icon: Layers },
    { label: "სტრიქი", value: user.currentStreak, icon: Flame },
    { label: "ბეჯი", value: user.badges, icon: Award },
    { label: "საშ. Quiz", value: `${user.avgQuizScore}%`, icon: Target },
  ];

  return (
    <section className="card relative overflow-hidden">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.12] blur-2xl"
        style={{ background: "var(--accent-cyan)" }}
        aria-hidden
      />
      <div className="relative flex items-start gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-[0_0_0_3px_var(--bg-card),0_0_0_4px_var(--accent-cyan)]"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))",
          }}
        >
          {user.initials}
        </div>
        <div className="min-w-0 pt-0.5">
          <h2 className="headline truncate text-lg font-semibold">{user.name}</h2>
          <span
            className={`mt-1.5 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${SPACE_BADGE[user.space]}`}
          >
            {getSpaceLabel(user.space)}
          </span>
          <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
            შემოგვიერთდა: {user.joinDate}
          </p>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-2">
        {quickStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 transition-colors hover:border-[var(--border-hover)]"
          >
            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <stat.icon className="h-3.5 w-3.5 stroke-[1.75]" />
              <p className="text-xs">{stat.label}</p>
            </div>
            <p className="mono mt-1 text-base font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <Link href="/profile/edit">
        <Button variant="ghost" className="mt-4 w-full">
          პროფილის რედაქტირება
        </Button>
      </Link>
    </section>
  );
}
