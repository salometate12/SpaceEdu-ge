export type DashboardWorkspace = "abiturient" | "student";

interface DashboardBannerStatsProps {
  workspace: DashboardWorkspace;
  streak?: number;
  countdown?: number;
}

const COUNTDOWN_LABEL: Record<DashboardWorkspace, string> = {
  abiturient: "გამოცდამდე დარჩა",
  student: "სესიებამდე დარჩა",
};

export function DashboardBannerStats({
  workspace,
  streak = 12,
  countdown = 42,
}: DashboardBannerStatsProps) {
  return (
    <div className="flex shrink-0 flex-row items-center gap-3 sm:gap-4">
      <div className="rounded-xl border border-white/5 bg-[#13131A]/40 px-4 py-3 backdrop-blur-md transition-all duration-300 ease-in-out dark:bg-[#13131A]/40">
        <p className="mono text-3xl font-bold leading-none text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.35)]">
          {streak}
        </p>
        <p className="mt-1 text-[11px] font-medium tracking-wide text-amber-400/90">
          🔥 სტრიქონი
        </p>
      </div>
      <div className="rounded-xl border border-white/5 bg-[#13131A]/40 px-4 py-3 backdrop-blur-md transition-all duration-300 ease-in-out dark:bg-[#13131A]/40">
        <p className="mono text-3xl font-bold leading-none text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.3)]">
          {countdown}
        </p>
        <p className="mt-1 max-w-[9rem] text-[11px] font-medium leading-tight tracking-wide text-cyan-400/90">
          📅 {COUNTDOWN_LABEL[workspace]}
        </p>
      </div>
    </div>
  );
}
