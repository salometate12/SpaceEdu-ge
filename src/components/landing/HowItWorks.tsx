import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

const STEPS = [
  {
    id: "01",
    title: "აირჩიე სივრცე",
    body: "გაიარე ავტორიზაცია და მონიშნე სასურველი სამუშაო გარემო.",
  },
  {
    id: "02",
    title: "გაააქტიურე ასისტენტი",
    body: "ჩვენი ხელოვნური ინტელექტი მზად არის შენს კითხვებზე საპასუხოდ.",
  },
  {
    id: "03",
    title: "მიაღწიე მიზანს",
    body: "მიიღე მაქსიმალური ქულები გამოცდებზე და მარტივად ჩააბარე საგნები.",
  },
] as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative mx-auto w-full max-w-7xl overflow-hidden px-4 py-16 sm:px-6 sm:py-20"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-20 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.05)_0%,transparent_70%)] blur-3xl"
        aria-hidden
      />

      <div className="mx-auto mb-12 max-w-2xl text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-400/90">
          პროცესი
        </p>
        <h2 className="headline mt-2 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
          როგორ მუშაობს
        </h2>
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div
          className="absolute left-0 top-1/4 -z-10 hidden h-px w-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent md:block"
          aria-hidden
        />

        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((step, idx) => (
            <RevealOnScroll key={step.id} delayMs={100 * (idx + 1)}>
              <article className="group relative flex flex-col items-start rounded-2xl border border-white/[0.06] bg-[#121214]/30 p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30">
                <span className="mono mb-6 flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-sm font-bold text-purple-400 transition-all duration-300 group-hover:bg-purple-600 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                  {step.id}
                </span>
                <h3 className="mb-2 text-lg font-semibold text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{step.body}</p>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
