import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Pencil, Ruler } from "./notebook/Doodles";
import { ACCENT_CARD, ACCENT_TEXT, type NotebookAccent } from "./notebook/accents";

const STEPS: {
  id: string;
  title: string;
  body: string;
  accent: NotebookAccent;
  tilt: string;
}[] = [
  {
    id: "01",
    title: "აირჩიე საგანი და დონე",
    body: "მიუთითე რას სწავლობ და რა დონეზე ხარ — SpaceEdu მორგებულია სკოლის, გამოცდის თუ უნივერსიტეტის პროგრამებზე.",
    accent: "amber",
    tilt: "hover:-rotate-1",
  },
  {
    id: "02",
    title: "მიიღე პერსონალური გეგმა",
    body: "AI ანალიზებს შენს მიზანს და აწყობს კვირეულ გეგმას — რას, როდის და როგორ ისწავლო.",
    accent: "blue",
    tilt: "hover:rotate-1",
  },
  {
    id: "03",
    title: "ისწავლე AI Tutor-თან ერთად",
    body: "დასვი კითხვები, გაიარე Active Recall Quiz-ები და მიიღე ახსნა ELI5 ფორმატში, სანამ ბოლომდე არ გაგიგია.",
    accent: "pink",
    tilt: "hover:-rotate-1",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-4 sm:px-6 sm:pb-24"
    >
      <Ruler className="pointer-events-none absolute right-6 top-6 hidden w-24 rotate-12 text-slate-400 xl:block dark:text-slate-500" />
      <Pencil className="pointer-events-none absolute left-6 top-10 hidden h-12 w-12 -rotate-12 text-amber-600/70 xl:block dark:text-amber-400/60" />

      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="headline text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-50">
          როგორ მუშაობს <span className={ACCENT_TEXT.green}>SpaceEdu</span>
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base dark:text-slate-300">
          სამი მარტივი ნაბიჯი შენს პერსონალურ სასწავლო სივრცემდე
        </p>
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="relative grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <RevealOnScroll key={step.id} delayMs={100 * (index + 1)}>
              <article
                className={`flex h-full flex-col items-start rounded-2xl border-2 p-7 transition-transform duration-300 ${step.tilt} ${ACCENT_CARD[step.accent]}`}
              >
                <span
                  className={`headline mb-5 text-3xl font-extrabold ${ACCENT_TEXT[step.accent]}`}
                >
                  {step.id}
                </span>
                <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-50">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {step.body}
                </p>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
