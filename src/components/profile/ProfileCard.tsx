import Link from "next/link";
import { Award, Flame, Layers, Target } from "lucide-react";
import { getSpaceLabel, type UserProfile } from "@/lib/profile";

interface ProfileCardProps {
  user: UserProfile;
}

const SPACE_BADGE: Record<UserProfile["space"], string> = {
  school: "border-violet-300 bg-violet-100 text-violet-700",
  abiturient: "border-cyan-300 bg-cyan-100 text-cyan-700",
  student: "border-emerald-300 bg-emerald-100 text-emerald-700",
};

export function ProfileCard({ user }: ProfileCardProps) {
  const quickStats = [
    { label: "სესია", value: user.totalSessions, icon: Layers, color: "#7c3aed" },
    { label: "სტრიქი", value: user.currentStreak, icon: Flame, color: "#f97316" },
    { label: "ბეჯი", value: user.badges, icon: Award, color: "#d97706" },
    { label: "საშ. Quiz", value: `${user.avgQuizScore}%`, icon: Target, color: "#0891b2" },
  ];

  return (
    <section className="dashboard-glass-card relative overflow-hidden rounded-[28px] p-6">
      <div className="relative flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-lg font-bold text-white shadow-md">
          {user.initials}
        </div>
        <div className="min-w-0 pt-0.5">
          <h2 className="headline truncate text-lg font-bold text-[var(--text-primary)]">
            {user.name}
          </h2>
          <span
            className={`mt-1.5 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${SPACE_BADGE[user.space]}`}
          >
            {getSpaceLabel(user.space)}
          </span>
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
            შემოგვიერთდა: {user.joinDate}
          </p>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-2">
        {quickStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 transition-colors hover:border-[var(--border-hover)]"
          >
            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <stat.icon className="h-3.5 w-3.5 stroke-[1.75]" style={{ color: stat.color }} />
              <p className="text-xs">{stat.label}</p>
            </div>
            <p className="mono mt-1 text-base font-bold text-[var(--text-primary)]">{stat.value}</p>
          </div>
        ))}
      </div>

      <Link
        href="/profile/edit"
        className="mt-4 flex w-full items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition-all hover:border-violet-400 hover:text-violet-600"
      >
        პროფილის რედაქტირება
      </Link>
    </section>
  );
}
