import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

const STEPS = [
  {
    id: "01",
    title: "აირჩიე საგანი და დონე",
    body: "მიუთითე რას სწავლობ და რა დონეზე ხარ — SpaceEdu მორგებულია სკოლის, გამოცდის თუ უნივერსიტეტის პროგრამებზე.",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.1)",
  },
  {
    id: "02",
    title: "მიიღე პერსონალური გეგმა",
    body: "AI ანალიზებს შენს მიზანს და აწყობს კვირეულ გეგმას — რას, როდის და როგორ ისწავლო.",
    color: "#22d3ee",
    bg: "rgba(34, 211, 238, 0.1)",
  },
  {
    id: "03",
    title: "ისწავლე AI Tutor-თან ერთად",
    body: "დასვი კითხვები, გაიარე Active Recall Quiz-ები და მიიღე ახსნა ELI5 ფორმატში, სანამ ბოლომდე არ გაგიგია.",
    color: "#f472b6",
    bg: "rgba(244, 114, 182, 0.1)",
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
        <h2 className="headline text-2xl font-bold text-white sm:text-3xl">
          როგორ მუშაობს <span className="text-[#22d3ee]">SpaceEdu</span>
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-400 sm:text-base">
          სამი მარტივი ნაბიჯი შენს პერსონალურ სასწავლო სივრცემდე
        </p>
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((step, idx) => (
            <RevealOnScroll key={step.id} delayMs={100 * (idx + 1)}>
              <article
                className="group relative flex h-full flex-col items-start rounded-2xl border bg-[#121214]/40 p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1"
                style={{ borderColor: `${step.color}30` }}
              >
                <span
                  className="headline mb-6 text-3xl font-extrabold"
                  style={{ color: step.color }}
                >
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
