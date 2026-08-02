import type { UserProfile } from "@/lib/profile";
import { Button } from "@/components/ui/Button";

interface ProfileCardProps {
  user: UserProfile;
}

const SPACE_BADGE: Record<UserProfile["space"], string> = {
  school: "bg-purple-500/20 text-purple-200 border-purple-500/40",
  abiturient: "bg-cyan-500/20 text-cyan-200 border-cyan-500/40",
  student: "bg-green-500/20 text-green-200 border-green-500/40",
};

export function ProfileCard({ user }: ProfileCardProps) {
  const quickStats = [
    { label: "სესია", value: user.totalSessions },
    { label: "სტრიქი", value: user.currentStreak },
    { label: "ბეჯი", value: user.badges },
    { label: "საშ. Quiz", value: `${user.avgQuizScore}%` },
  ];

  return (
    <section className="card">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--accent-purple)] bg-[var(--bg-secondary)] text-lg font-semibold">
          {user.initials}
        </div>
        <div className="min-w-0">
          <h2 className="headline truncate text-lg font-semibold">{user.name}</h2>
          <span
            className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-xs ${SPACE_BADGE[user.space]}`}
          >
            {user.space}
          </span>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            შემოგვიერთდა: {user.joinDate}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {quickStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2"
          >
            <p className="mono text-base font-semibold">{stat.value}</p>
            <p className="text-xs text-[var(--text-secondary)]">{stat.label}</p>
          </div>
        ))}
      </div>

      <Button variant="ghost" className="mt-4 w-full">
        პროფილის რედაქტირება
      </Button>
    </section>
  );
}
