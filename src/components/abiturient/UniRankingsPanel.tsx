export function UniRankingsPanel() {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#121214]/60 p-5 backdrop-blur-xl">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-white">უნივერსიტეტების რეიტინგი</h2>
        <p className="mt-1 text-sm text-zinc-400">
          პროგრამების შედარება შენი ქულების მიხედვით.
        </p>
      </div>
      <div className="space-y-2">
        {[
          { idx: 1, title: "საუკეთესო შესაბამისობა", code: "Rank-01" },
          { idx: 2, title: "სტაბილური ვარიანტი", code: "Rank-02" },
          { idx: 3, title: "საჰაერო ალტერნატივა", code: "Rank-03" },
        ].map((row) => (
          <div
            key={row.code}
            className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#0f1420]/60 px-3 py-2"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-xs font-semibold text-white">
                  {row.idx}
                </span>
                <p className="truncate text-sm text-zinc-200">{row.title}</p>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">{row.code}</p>
            </div>
            <span className="rounded-full border border-purple-500/25 bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-300">
              Mock
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
