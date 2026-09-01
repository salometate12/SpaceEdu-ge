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

const STAT_BG: Record<string, string> = {
  სესია: "#efe9fe",
  სტრიქი: "#ffedd5",
  ბეჯი: "#fef3c7",
  "საშ. Quiz": "#cffafe",
};

export function ProfileCard({ user }: ProfileCardProps) {
  const quickStats = [
    { label: "სესია", value: user.totalSessions, icon: Layers, color: "#6d28d9" },
    { label: "სტრიქი", value: user.currentStreak, icon: Flame, color: "#c2410c" },
    { label: "ბეჯი", value: user.badges, icon: Award, color: "#92400e" },
    { label: "საშ. Quiz", value: `${user.avgQuizScore}%`, icon: Target, color: "#0e7490" },
  ];

  return (
    <section className="dashboard-glass-card relative overflow-hidden rounded-[32px] p-6">
      <div className="relative flex items-start gap-4">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-orange-400 via-pink-500 to-rose-500 text-xl font-black text-white shadow-lg ring-4 ring-white dark:ring-[#16161f]">
          {user.initials}
        </div>
        <div className="min-w-0 pt-1">
          <h2 className="headline truncate text-2xl font-black text-[var(--text-primary)]">
            {user.name}
          </h2>
          <span
            className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${SPACE_BADGE[user.space]}`}
          >
            {getSpaceLabel(user.space)}
          </span>
          <p className="mt-2 text-xs font-medium text-[var(--text-muted)]">
            შემოგვიერთდა: {user.joinDate}
          </p>
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-2.5">
        {quickStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl px-3.5 py-3 transition-transform hover:-translate-y-0.5"
            style={{ background: STAT_BG[stat.label] }}
          >
            <div className="flex items-center gap-1.5">
              <stat.icon className="h-3.5 w-3.5 stroke-[2]" style={{ color: stat.color }} />
              <p className="text-xs font-bold" style={{ color: stat.color }}>
                {stat.label}
              </p>
            </div>
            <p className="mono mt-1.5 text-xl font-black" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <Link
        href="/profile/edit"
        className="mt-5 flex w-full items-center justify-center rounded-full border-2 border-[#1c1917] bg-transparent py-3 text-sm font-bold text-[var(--text-primary)] transition-all hover:bg-[#1c1917] hover:text-white"
      >
        პროფილის რედაქტირება
      </Link>
    </section>
  );
}
