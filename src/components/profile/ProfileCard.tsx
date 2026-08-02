import Link from "next/link";
import { Award, Flame, Layers, Target } from "lucide-react";
import { getSpaceLabel, type UserProfile } from "@/lib/profile";

interface ProfileCardProps {
  user: UserProfile;
}

const SPACE_BADGE: Record<UserProfile["space"], string> = {
  school: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  abiturient: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  student: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

export function ProfileCard({ user }: ProfileCardProps) {
  const quickStats = [
    { label: "სესია", value: user.totalSessions, icon: Layers, color: "text-violet-300" },
    { label: "სტრიქი", value: user.currentStreak, icon: Flame, color: "text-orange-300" },
    { label: "ბეჯი", value: user.badges, icon: Award, color: "text-amber-300" },
    { label: "საშ. Quiz", value: `${user.avgQuizScore}%`, icon: Target, color: "text-cyan-300" },
  ];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#13131A]/60 p-6 backdrop-blur-xl transition-colors hover:border-white/[0.15]">
      <div
        className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full opacity-[0.14] blur-3xl"
        style={{
          background: "radial-gradient(circle, #22D3EE 0%, transparent 70%)",
        }}
        aria-hidden
      />
      <div className="relative flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-lg font-bold text-white shadow-[0_0_0_3px_#13131A,0_0_0_4px_rgba(34,211,238,0.4),0_0_24px_rgba(34,211,238,0.25)]">
          {user.initials}
        </div>
        <div className="min-w-0 pt-0.5">
          <h2 className="headline truncate text-lg font-semibold text-white">{user.name}</h2>
          <span
            className={`mt-1.5 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${SPACE_BADGE[user.space]}`}
          >
            {getSpaceLabel(user.space)}
          </span>
          <p className="mt-1.5 text-xs text-zinc-500">
            შემოგვიერთდა: {user.joinDate}
          </p>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-2">
        {quickStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-colors hover:border-white/[0.12]"
          >
            <div className="flex items-center gap-1.5 text-zinc-500">
              <stat.icon className={`h-3.5 w-3.5 stroke-[1.75] ${stat.color}`} />
              <p className="text-xs">{stat.label}</p>
            </div>
            <p className="mono mt-1 text-base font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <Link
        href="/profile/edit"
        className="mt-4 flex w-full items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-sm font-medium text-white/85 transition-all hover:border-cyan-500/40 hover:bg-cyan-500/5 hover:text-white"
      >
        პროფილის რედაქტირება
      </Link>
    </section>
  );
}
